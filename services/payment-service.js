const axios = require('axios');
const qrcode = require('qrcode');
const Stripe = require('stripe');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

class PaymentService {
    constructor() {
        // Stripe
        this.stripe = new Stripe(config.payment.stripe.secret_key);
        this.stripeConfig = config.payment.stripe;

        // Mercado Pago
        this.mercadoPagoConfig = config.payment.mercadoPago;
        this.mercadoPagoBaseUrl = 'https://api.mercadopago.com/v1';

        this.emojis = config.emojis;
        this.pixExpirationMinutes = config.settings.pix_expiration_minutes || 30;
    }

    // ========== MERCADO PAGO PIX ========== //

    async createMercadoPagoPixPayment(amount, description, checkoutId, userId) {
        try {
            logger.info(`Gerando PIX Mercado Pago para checkout ${checkoutId}`, {
                amount,
                description,
                userId
            });

            const amountInReais = parseFloat(amount).toFixed(2);
            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + this.pixExpirationMinutes);

            const pixData = {
                transaction_amount: Number(amountInReais),
                description: description.substring(0, 255),
                payment_method_id: 'pix',
                payer: {
                    email: 'adriana.celly1979@gmail.com',
                    first_name: 'Discord',
                    last_name: 'User',
                    identification: {
                        type: 'CPF',
                        number: '12519234458'
                    }
                },
                external_reference: checkoutId,
                notification_url: this.mercadoPagoConfig.notification_url,
                statement_descriptor: 'DISCORD BOT',
                date_of_expiration: expirationDate.toISOString()
            };

            const response = await axios.post(
                `${this.mercadoPagoBaseUrl}/payments`,
                pixData,
                {
                    headers: {
                        Authorization: `Bearer ${this.mercadoPagoConfig.access_token}`,
                        'Content-Type': 'application/json',
                        'X-Integrator-ID': this.mercadoPagoConfig.integrator_id || '',
                        'X-Idempotency-Key': crypto.randomUUID()
                    },
                    timeout: 10000
                }
            );

            if (response.data.status === 'rejected') {
                throw new Error(`Pagamento rejeitado: ${response.data.status_detail}`);
            }

            const pixInfo = response.data.point_of_interaction?.transaction_data;
            if (!pixInfo) {
                throw new Error('Dados do PIX não retornados pelo Mercado Pago');
            }

            let qrCodeBase64 = '';
            try {
                qrCodeBase64 = await qrcode.toDataURL(pixInfo.qr_code);
            } catch (qrError) {
                logger.erro('GERAR_QR_CODE', qrError, checkoutId);
            }

            logger.pagamento(checkoutId, 'PIX_GERADO', 'MercadoPago', {
                amount: amountInReais,
                pixId: response.data.id
            });

            return {
                payment_id: response.data.id,
                qr_code: qrCodeBase64,
                qr_code_text: pixInfo.qr_code,
                copy_paste_code: pixInfo.qr_code,
                transaction_id: response.data.id,
                amount: amountInReais,
                expires_at: response.data.date_of_expiration,
                status: response.data.status,
                provider: 'mercado_pago',
                raw_response: response.data
            };

        } catch (error) {
            logger.erro('GERAR_PIX_MERCADO_PAGO', error, checkoutId);

            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;

            console.error('Mercado Pago API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMessage
            });

            throw new Error(`Erro ao gerar PIX (Mercado Pago): ${errorMessage}`);
        }
    }

    async checkMercadoPagoPayment(paymentId) {
        try {
            const response = await axios.get(
                `${this.mercadoPagoBaseUrl}/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.mercadoPagoConfig.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const status = response.data.status;
            let mappedStatus = 'pending';

            if (status === 'approved') mappedStatus = 'paid';
            if (status === 'rejected' || status === 'cancelled') mappedStatus = 'failed';

            if (status === 'approved') {
                logger.pagamento(paymentId, 'PIX_PAGO', 'MercadoPago', {
                    amount: response.data.transaction_amount
                });
            }

            return {
                status: mappedStatus,
                original_status: status,
                transaction_id: response.data.id,
                amount: response.data.transaction_amount,
                payer_email: response.data.payer?.email,
                external_reference: response.data.external_reference,
                raw_response: response.data
            };

        } catch (error) {
            logger.erro('VERIFICAR_PIX_MERCADO_PAGO', error, paymentId);

            if (error.response?.status === 404) {
                return { status: 'not_found', payment_id: paymentId };
            }

            throw error;
        }
    }

    async handleMercadoPagoWebhook(payload) {
        try {
            if (payload.type !== 'payment') {
                return { success: false };
            }

            const paymentInfo = await this.checkMercadoPagoPayment(payload.id);

            return {
                success: true,
                checkoutId: paymentInfo.external_reference,
                status: paymentInfo.status,
                payment_id: payload.id
            };

        } catch (error) {
            logger.erro('WEBHOOK_MERCADO_PAGO', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new PaymentService();
