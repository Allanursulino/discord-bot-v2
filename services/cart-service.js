const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const checkoutService = require('./checkout-service');
const productService = require('./product-service');
const config = require('../config');
const logger = require('../utils/logger');

class CartService {
    constructor(client) {
        this.client = client;
    }

    // Helper para textos em inglês/português baseado na região
    getLocalizedText(productRegion) {
        const isBR = productRegion === 'br';
        return {
            cartTitle: isBR ? '🛒 Seu Carrinho' : '🛒 Your Cart',
            cartDesc: isBR ? 
                `Olá <@{userId}>, você está comprando:\n**{productTitle}**` :
                `Hello <@{userId}>, you are purchasing:\n**{productTitle}**`,
            unitPrice: isBR ? '💰 Preço unitário' : '💰 Unit Price',
            quantity: isBR ? '📦 Quantidade' : '📦 Quantity',
            total: isBR ? '💵 Total' : '💵 Total',
            region: isBR ? '🌍 Região' : '🌍 Region',
            choosePayment: isBR ? 'Escolha a forma de pagamento' : 'Choose payment method',
            pixLabel: isBR ? '💰 PAGAR COM PIX' : '💰 PAY WITH PIX',
            cardLabel: isBR ? '💳 PAGAR COM CARTÃO' : '💳 PAY WITH CARD',
            internationalCardLabel: '💳 PAY WITH CARD',
            checkPayment: isBR ? '✅ VERIFICAR PAGAMENTO' : '✅ CHECK PAYMENT',
            backLabel: isBR ? '↩️ Voltar' : '↩️ Back',
            payNow: isBR ? '💳 PAGAR AGORA' : '💳 PAY NOW',
            alreadyPaid: isBR ? '✅ JÁ PAGUEI' : '✅ I ALREADY PAID',
            paymentConfirmed: isBR ? '✅ PAGAMENTO CONFIRMADO!' : '✅ PAYMENT CONFIRMED!',
            paymentConfirmedDesc: isBR ? 
                'Seu pagamento foi aprovado e o produto será entregue em breve.' :
                'Your payment has been approved and the product will be delivered shortly.',
            productReady: isBR ? '✅ SEU PRODUTO ESTÁ PRONTO!' : '✅ YOUR PRODUCT IS READY!',
            productReadyDesc: isBR ? 
                '**{productTitle}**\n\nAqui está seu produto:' :
                '**{productTitle}**\n\nHere is your product:',
            productField: isBR ? '📦 Produto' : '📦 Product',
            amountPaid: isBR ? '💰 Valor Pago' : '💰 Amount Paid',
            purchaseDate: isBR ? '📅 Data da Compra' : '📅 Purchase Date',
            support: isBR ? '📞 Suporte' : '📞 Support',
            supportText: isBR ? 
                'Em caso de problemas, entre em contato com o suporte.' :
                'If you have any issues, please contact support.',
            paymentPending: isBR ? '⏳ AGUARDANDO PAGAMENTO' : '⏳ PAYMENT PENDING',
            paymentPendingDesc: isBR ? 
                'Seu pagamento ainda não foi confirmado.\n\nIsso pode levar alguns minutos.' :
                'Your payment has not been confirmed yet.\n\nThis may take a few minutes.',
            channelClosing: isBR ? 
                '⏳ Este canal será fechado em 30 segundos...' :
                '⏳ This channel will close in 30 seconds...',
            productSentDM: isBR ? 
                '✅ Produto enviado para sua DM (Mensagem Direta)! Verifique sua caixa de entrada.' :
                '✅ Product sent to your DM (Direct Message)! Check your inbox.',
            errorContactSupport: isBR ? 
                '❌ Ocorreu um erro ao entregar o produto. Entre em contato com o suporte.' :
                '❌ An error occurred while delivering the product. Contact support.',
            pixPaymentTitle: isBR ? '💰 PAGAMENTO VIA PIX - BRASIL' : '💰 PAYMENT VIA PIX - BRAZIL',
            pixPaymentDesc: isBR ? 
                '**Valor:** {amount}\n**Válido por:** 30 minutos\n\nEscaneie o QR Code abaixo:' :
                '**Amount:** {amount}\n**Valid for:** 30 minutes\n\nScan the QR Code below:',
            copyPixCode: isBR ? '📋 Código PIX (Copiar e Colar)' : '📋 PIX Code (Copy and Paste)',
            afterPayment: isBR ? 'Após pagar, clique em "✅ JÁ PAGUEI"' : 'After paying, click "✅ I ALREADY PAID"',
            stripePaymentTitle: isBR ? '💳 PAGAMENTO VIA CARTÃO/BOLETO' : '💳 PAYMENT VIA CARD',
            stripePaymentDesc: isBR ? 
                '**Valor:** {amount}\n\nClique no botão abaixo para pagar:' :
                '**Amount:** {amount}\n\nClick the button below to pay:',
            redirectText: isBR ? 
                'Você será redirecionado para a página de pagamento' :
                'You will be redirected to the payment page',
            tryAgain: isBR ? 'Tente novamente em 2 minutos' : 'Try again in 2 minutes',
            purchaseCanceled: isBR ? '❌ Compra cancelada' : '❌ Purchase canceled',
            purchaseCanceledDesc: isBR ? 'Sua compra foi cancelada.' : 'Your purchase has been canceled.',
            thanksPurchase: isBR ? 'Obrigado pela compra! Volte sempre.' : 'Thank you for your purchase! Come back soon.',
            activeCartWarning: isBR ? 
                '⚠️ Você já tem um carrinho ativo. Finalize ou cancele ele primeiro.' :
                '⚠️ You already have an active cart. Complete or cancel it first.',
            outOfStock: isBR ? '❌ Produto esgotado.' : '❌ Product out of stock.',
            cartCreateError: isBR ? '❌ Erro ao criar carrinho. Estoque insuficiente.' : '❌ Error creating cart. Insufficient stock.',
            channelCreateError: isBR ? '❌ Erro ao criar canal de checkout. Contate um administrador.' : '❌ Error creating checkout channel. Contact an administrator.',
            cartCreated: isBR ? '✅ Carrinho criado! Acesse: {channel}' : '✅ Cart created! Access: {channel}',
            pixOnlyBR: isBR ? '❌ PIX disponível apenas para produtos Brasil.' : '❌ PIX available only for Brazil products.',
            errorProcessingPix: isBR ? '❌ Erro ao processar pagamento PIX. Tente cartão.' : '❌ Error processing PIX payment. Try card.',
            errorProcessingCard: isBR ? '❌ Erro ao processar pagamento com cartão.' : '❌ Error processing card payment.',
            errorCheckingPayment: isBR ? '❌ Erro ao verificar pagamento. Tente novamente mais tarde.' : '❌ Error checking payment. Try again later.',
            addCoupon: isBR ? '🎫 Adicionar Cupom' : '🎫 Add Coupon',
            removeCoupon: isBR ? '🗑️ Remover Cupom' : '🗑️ Remove Coupon',
            couponApplied: isBR ? '🎫 Cupom Aplicado' : '🎫 Coupon Applied',
            couponCode: isBR ? 'Código' : 'Code',
            couponDiscount: isBR ? 'Desconto' : 'Discount',
            // NOVOS TEXTOS
            cancelPurchaseLabel: isBR ? '❌ CANCELAR COMPRA' : '❌ CANCEL PURCHASE',
            addCouponLabel: isBR ? '🎫 ADICIONAR CUPOM' : '🎫 ADD COUPON',
            confirmCancel: isBR ? '✅ SIM, CANCELAR' : '✅ YES, CANCEL',
            dontCancel: isBR ? '❌ NÃO, MANTER' : '❌ NO, KEEP',
            noActiveCart: isBR ? '❌ Você não tem nenhuma compra ativa para cancelar.' : '❌ You don\'t have any active purchase to cancel.',
            needCartForCoupon: isBR ? '❌ Você precisa ter um carrinho ativo para adicionar cupom.' : '❌ You need an active cart to add a coupon.',
            confirmCancelTitle: isBR ? '❌ CANCELAR COMPRA ATIVA' : '❌ CANCEL ACTIVE PURCHASE',
            cancelSuccess: isBR ? '✅ Compra cancelada com sucesso!' : '✅ Purchase cancelled successfully!',
            couponModalTitle: isBR ? 'Aplicar Cupom' : 'Apply Coupon',
            couponInputLabel: isBR ? 'Código do Cupom' : 'Coupon Code',
            couponPlaceholder: isBR ? 'Ex: PROMO10' : 'Ex: PROMO10',
            removeProduct: isBR ? '🗑️ Remover Produto' : '🗑️ Remove Product',
            quantityActions: isBR ? '📦 Ajustar Quantidade' : '📦 Adjust Quantity'
        };
    }

    // Criar canal privado para checkout baseado na região
    async createCheckoutChannel(user, checkoutId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout) return null;

            const product = productService.getProduct(checkout.productId);
            if (!product) return null;

            const regionInfo = productService.getProductRegionInfo(product.id);
            const guild = this.client.guilds.cache.get(config.guildId);
            
            if (!guild) return null;

            // Verificar se a categoria existe e é válida
            let parentCategory = null;
            if (regionInfo.category_id) {
                const category = guild.channels.cache.get(regionInfo.category_id);
                if (category && category.type === ChannelType.GuildCategory) {
                    parentCategory = regionInfo.category_id;
                }
            }

            // Nome do canal
            const channelName = `carrinho-${user.username}-${product.region}`.toLowerCase().slice(0, 100);
            
            // Configuração das permissões
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: this.client.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                }
            ];

            // Adicionar admin se configurado
            if (config.discord && config.discord.admin_id) {
                permissionOverwrites.push({
                    id: config.discord.admin_id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                });
            }

            // Criar canal privado
            const channelData = {
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
                topic: `Checkout: ${product.title} | ${regionInfo.name} | User: ${user.username} | ID: ${checkoutId}`
            };

            // Adicionar parent apenas se for uma categoria válida
            if (parentCategory) {
                channelData.parent = parentCategory;
            }

            const channel = await guild.channels.create(channelData);

            logger.info(`Canal de checkout criado para região ${product.region}`, {
                userId: user.id,
                username: user.username,
                checkoutId,
                region: product.region,
                channelId: channel.id,
                channelName: channel.name
            });

            return channel;
        } catch (error) {
            logger.erro('CRIAR_CANAL_CHECKOUT_REGIONAL', error, user?.id);
            return null;
        }
    }

    // Enviar painel do carrinho com opções de pagamento da região
    async sendCartPanel(channel, checkoutId, userId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout) {
                logger.erro('Checkout não encontrado para painel', null, userId);
                return;
            }

            const product = productService.getProduct(checkout.productId);
            if (!product) {
                logger.erro('Produto não encontrado para painel', null, userId);
                return;
            }

            const regionInfo = productService.getProductRegionInfo(product.id);
            const localized = this.getLocalizedText(product.region);

            const embed = new EmbedBuilder()
                .setTitle(localized.cartTitle)
                .setDescription(localized.cartDesc
                    .replace('{userId}', userId)
                    .replace('{productTitle}', product.title))
                .setColor(this.getRegionColor(product.region))
                .addFields(
                    {
                        name: localized.unitPrice,
                        value: `${regionInfo.emojis?.currency || ''} ${checkout.unitPrice.toFixed(2)} ${product.currency}`,
                        inline: true
                    },
                    {
                        name: localized.quantity,
                        value: `${checkout.quantity}`,
                        inline: true
                    },
                    {
                        name: localized.total,
                        value: `${regionInfo.emojis?.currency || ''} ${checkout.total.toFixed(2)} ${product.currency}`,
                        inline: true
                    },
                    {
                        name: localized.region,
                        value: regionInfo.name,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${localized.choosePayment} • ${regionInfo.name}` 
                })
                .setTimestamp();

            // Adicionar campo de cupom se aplicado
            if (checkout.coupon) {
                const discountText = checkout.coupon.type === 'PERCENTAGE' 
                    ? `${checkout.coupon.amount}%` 
                    : `${regionInfo.emojis?.currency || ''} ${checkout.coupon.amount.toFixed(2)}`;
                
                embed.addFields({
                    name: localized.couponApplied,
                    value: `**${localized.couponCode}:** ${checkout.coupon.code}\n**${localized.couponDiscount}:** ${discountText}`,
                    inline: false
                });
            }

            if (product.image) {
                embed.setImage(product.image);
            }

            // BOTÕES DISTRIBUÍDOS EM MÚLTIPLAS LINHAS (máximo 5 por linha)
            
            // Linha 1: Métodos de pagamento
            const paymentRow = new ActionRowBuilder();
            
            // BR tem PIX + Cartão
            if (product.region === 'br') {
                paymentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pay_pix:${checkoutId}`)
                        .setLabel(localized.pixLabel)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`pay_card:${checkoutId}`)
                        .setLabel(localized.cardLabel)
                        .setStyle(ButtonStyle.Primary)
                );
            } 
            // Internacional só tem cartão
            else {
                paymentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pay_card:${checkoutId}`)
                        .setLabel(localized.internationalCardLabel)
                        .setStyle(ButtonStyle.Primary)
                );
            }

            // Linha 2: Controle de quantidade e cupom
            const quantityRow = new ActionRowBuilder();
            
            quantityRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`increase:${checkoutId}`)
                    .setLabel('➕')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`decrease:${checkoutId}`)
                    .setLabel('➖')
                    .setStyle(ButtonStyle.Secondary)
            );

            // Botão de cupom
            if (!checkout.coupon) {
                quantityRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`add_coupon:${checkoutId}`)
                        .setLabel(localized.addCoupon)
                        .setStyle(ButtonStyle.Secondary)
                );
            } else {
                quantityRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`remove_coupon:${checkoutId}`)
                        .setLabel(localized.removeCoupon)
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            quantityRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`remove_product:${checkoutId}`)
                    .setLabel(localized.removeProduct)
                    .setStyle(ButtonStyle.Secondary)
            );

            // Linha 3: Ações principais
            const actionsRow = new ActionRowBuilder();
            
            actionsRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel:${checkoutId}`)
                    .setLabel('❌ Cancelar Compra')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`need_help`)
                    .setLabel('❓ Ajuda')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`show_my_carts`)
                    .setLabel('📋 Meus Carrinhos')
                    .setStyle(ButtonStyle.Secondary)
            );

            const components = [paymentRow, quantityRow, actionsRow];

            // Verificar se estamos no canal correto
            if (!channel || !channel.isTextBased()) {
                logger.erro('Canal inválido para enviar painel', null, userId);
                return;
            }

            await channel.send({
                content: `<@${userId}>`,
                embeds: [embed],
                components: components
            });

            logger.info(`Painel do carrinho enviado para região ${product.region}`, {
                checkoutId,
                userId,
                region: product.region
            });

        } catch (error) {
            logger.erro('ENVIAR_PAINEL_CARRINHO_REGIONAL', error, userId);
            throw error;
        }
    }

    // Enviar instruções de pagamento PIX (apenas BR)
    async sendPixPayment(channel, checkoutId, userId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout) return;

            const product = productService.getProduct(checkout.productId);
            if (!product || product.region !== 'br') {
                await channel.send(this.getLocalizedText('br').pixOnlyBR);
                return;
            }

            const paymentResult = await checkoutService.startPayment(checkoutId, 'pix');
            
            if (!paymentResult || !paymentResult.payment) {
                await channel.send('❌ Erro ao gerar QR Code PIX. Tente novamente.');
                return;
            }

            const regionInfo = productService.getProductRegionInfo(product.id);
            const localized = this.getLocalizedText('br');
            const amountText = `${regionInfo.emojis?.currency || ''} ${paymentResult.checkout.total.toFixed(2)} ${product.currency}`;

            const embed = new EmbedBuilder()
                .setTitle(localized.pixPaymentTitle)
                .setDescription(localized.pixPaymentDesc.replace('{amount}', amountText))
                .setColor(0x00FF00)
                .setImage(paymentResult.payment.qr_code)
                .addFields({
                    name: localized.copyPixCode,
                    value: `\`\`\`${paymentResult.payment.pix_code}\`\`\``
                })
                .setFooter({ text: localized.afterPayment })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`check_payment:${checkoutId}`)
                        .setLabel(localized.alreadyPaid)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`back_to_cart:${checkoutId}`)
                        .setLabel(localized.backLabel)
                        .setStyle(ButtonStyle.Secondary)
                );

            await channel.send({
                content: `<@${userId}>`,
                embeds: [embed],
                components: [row]
            });

            logger.info(`QR Code PIX enviado (BR)`, { checkoutId, userId });

        } catch (error) {
            logger.erro('ENVIAR_PAGAMENTO_PIX_BR', error, userId);
            await channel.send(this.getLocalizedText('br').errorProcessingPix);
        }
    }

    // Enviar link de pagamento Stripe (todas as regiões)
    async sendStripePayment(channel, checkoutId, userId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout) return;

            const product = productService.getProduct(checkout.productId);
            if (!product) return;

            const regionInfo = productService.getProductRegionInfo(product.id);
            const localized = this.getLocalizedText(product.region);

            const paymentResult = await checkoutService.startPayment(checkoutId, 'stripe');
            
            if (!paymentResult || !paymentResult.payment) {
                await channel.send(localized.errorProcessingCard);
                return;
            }

            const amountText = `${regionInfo.emojis?.currency || ''} ${paymentResult.checkout.total.toFixed(2)} ${product.currency}`;

            const embed = new EmbedBuilder()
                .setTitle(localized.stripePaymentTitle)
                .setDescription(localized.stripePaymentDesc.replace('{amount}', amountText))
                .setColor(0x7289DA)
                .setFooter({ 
                    text: localized.redirectText
                })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(localized.payNow)
                        .setStyle(ButtonStyle.Link)
                        .setURL(paymentResult.payment.url),
                    new ButtonBuilder()
                        .setCustomId(`check_payment:${checkoutId}`)
                        .setLabel(localized.checkPayment)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`back_to_cart:${checkoutId}`)
                        .setLabel(localized.backLabel)
                        .setStyle(ButtonStyle.Secondary)
                );

            await channel.send({
                content: `<@${userId}>`,
                embeds: [embed],
                components: [row]
            });

            logger.info(`Link Stripe enviado para região ${product.region}`, { checkoutId, userId });

        } catch (error) {
            logger.erro('ENVIAR_PAGAMENTO_STRIPE_REGIONAL', error, userId);
            await channel.send(localized.errorProcessingCard);
        }
    }

    // Enviar confirmação de pagamento
    async sendPaymentConfirmation(channel, checkoutId, userId) {
        try {
            const checkout = await checkoutService.checkPaymentStatus(checkoutId);
            
            if (!checkout) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ ERRO')
                    .setDescription('Não foi possível verificar o pagamento.')
                    .setColor(0xFF0000)
                    .setTimestamp();

                await channel.send({
                    content: `<@${userId}>`,
                    embeds: [embed]
                });
                return;
            }

            const product = productService.getProduct(checkout.productId);
            const regionInfo = productService.getProductRegionInfo(product?.id);
            const localized = this.getLocalizedText(product?.region || 'br');

            if (checkout.status === 'APPROVED') {
                const embed = new EmbedBuilder()
                    .setTitle(localized.paymentConfirmed)
                    .setDescription(localized.paymentConfirmedDesc)
                    .setColor(0x00FF00)
                    .addFields(
                        {
                            name: localized.amountPaid,
                            value: `${regionInfo?.emojis?.currency || ''} ${checkout.total.toFixed(2)} ${checkout.currency || 'BRL'}`,
                            inline: true
                        },
                        {
                            name: localized.purchaseDate,
                            value: new Date().toLocaleDateString('pt-BR'),
                            inline: true
                        }
                    )
                    .setFooter({ text: localized.thanksPurchase })
                    .setTimestamp();

                await channel.send({
                    content: `<@${userId}>`,
                    embeds: [embed]
                });

                logger.info(`Pagamento confirmado`, { checkoutId, userId });

                // Entregar produto
                await this.deliverProduct(userId, checkoutId);

                // Fechar canal após alguns segundos
                setTimeout(() => {
                    this.closeCheckoutChannel(checkoutId);
                }, 10000); // 10 segundos

            } else {
                const embed = new EmbedBuilder()
                    .setTitle(localized.paymentPending)
                    .setDescription(localized.paymentPendingDesc)
                    .setColor(0xFFA500)
                    .setFooter({ text: localized.tryAgain })
                    .setTimestamp();

                await channel.send({
                    content: `<@${userId}>`,
                    embeds: [embed]
                });
            }

        } catch (error) {
            logger.erro('CONFIRMAR_PAGAMENTO', error, userId);
            await channel.send(this.getLocalizedText('br').errorCheckingPayment);
        }
    }

    // Remover produto do carrinho (excluir checkout)
    async removeProductFromCart(channel, checkoutId, userId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout || checkout.userId !== userId) {
                return { success: false, message: 'Carrinho não encontrado ou não pertence a você.' };
            }

            // Cancelar checkout
            checkoutService.cancelCheckout(checkoutId);
            
            // Fechar canal
            await this.closeCheckoutChannel(checkoutId);
            
            const product = productService.getProduct(checkout.productId);
            const localized = this.getLocalizedText(product?.region || 'br');
            
            return { 
                success: true, 
                message: localized.purchaseCanceledDesc,
                productTitle: product?.title || 'Produto'
            };
            
        } catch (error) {
            logger.erro('REMOVER_PRODUTO_CARRINHO', error, userId);
            return { success: false, message: 'Erro ao remover produto do carrinho.' };
        }
    }

    // Entregar produto ao usuário
    async deliverProduct(userId, checkoutId) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout || checkout.status !== 'APPROVED') return;

            const product = productService.getProduct(checkout.productId);
            if (!product) return;

            const user = await this.client.users.fetch(userId);
            if (!user) return;

            const regionInfo = productService.getProductRegionInfo(product.id);
            const localized = this.getLocalizedText(product.region);

            // Embed de entrega do produto
            const embed = new EmbedBuilder()
                .setTitle(localized.productReady)
                .setDescription(localized.productReadyDesc.replace('{productTitle}', product.title))
                .setColor(0x00FF00)
                .addFields(
                    {
                        name: localized.productField,
                        value: product.title,
                        inline: true
                    },
                    {
                        name: localized.amountPaid,
                        value: `${regionInfo.emojis?.currency || ''} ${checkout.total.toFixed(2)} ${product.currency}`,
                        inline: true
                    },
                    {
                        name: localized.region,
                        value: regionInfo.name,
                        inline: true
                    },
                    {
                        name: localized.purchaseDate,
                        value: new Date(checkout.createdAt).toLocaleDateString('pt-BR'),
                        inline: true
                    }
                )
                .setFooter({ text: localized.thanksPurchase })
                .setTimestamp();

            // Adicionar conteúdo de entrega se existir
            if (product.delivery_content) {
                embed.addFields({
                    name: '🎁 ' + (product.region === 'br' ? 'Conteúdo do Produto' : 'Product Content'),
                    value: product.delivery_content,
                    inline: false
                });
            }

            // Adicionar instruções de suporte
            embed.addFields({
                name: localized.support,
                value: localized.supportText,
                inline: false
            });

            // Tentar enviar por DM primeiro
            try {
                await user.send({ embeds: [embed] });
                logger.info(`Produto entregue por DM para ${user.tag}`, { 
                    product: product.title,
                    region: product.region,
                    checkoutId 
                });

                // Notificar no canal que o produto foi enviado por DM
                const channelId = checkoutId.split(':')[1];
                const channel = this.client.channels.cache.get(channelId);
                if (channel) {
                    await channel.send(localized.productSentDM);
                }

            } catch (dmError) {
                // Se não conseguir DM, enviar no canal
                logger.info(`Não foi possível enviar DM para ${user.tag}, enviando no canal.`);
                
                const channelId = checkoutId.split(':')[1];
                const channel = this.client.channels.cache.get(channelId);
                
                if (channel) {
                    await channel.send({
                        content: `<@${userId}>`,
                        embeds: [embed]
                    });
                    
                    logger.info(`Produto entregue no canal para ${user.tag}`, {
                        product: product.title,
                        region: product.region,
                        channelId: channel.id
                    });
                }
            }

            // Log da venda completa
            logger.info(`Venda concluída e produto entregue`, {
                userId: userId,
                username: user.tag,
                productId: product.id,
                productTitle: product.title,
                region: product.region,
                amount: checkout.total,
                currency: product.currency,
                paymentMethod: checkout.payment?.method || 'unknown',
                checkoutId: checkoutId
            });

            // Atualizar status do checkout para completado
            checkout.status = 'COMPLETED';
            checkout.deliveredAt = new Date().toISOString();
            checkoutService.updateCheckoutStatus(checkoutId, checkout);

        } catch (error) {
            logger.erro('ENTREGAR_PRODUTO', error, userId);
            
            // Tentar notificar o usuário sobre o erro
            try {
                const channelId = checkoutId.split(':')[1];
                const channel = this.client.channels.cache.get(channelId);
                if (channel) {
                    await channel.send(localized.errorContactSupport);
                }
            } catch (channelError) {
                // Ignora erro de canal
            }
        }
    }

    // Fechar canal de checkout após conclusão
    async closeCheckoutChannel(checkoutId) {
        try {
            // Extrair channelId do checkoutId (se o formato for checkoutId:channelId)
            let channelId;
            if (checkoutId.includes(':')) {
                channelId = checkoutId.split(':')[1];
            } else {
                // Tentar encontrar o canal pelo checkout
                const checkout = checkoutService.getCheckout(checkoutId);
                if (!checkout) return;
                
                // Procurar canal pelo nome ou tópico
                const guilds = this.client.guilds.cache;
                for (const guild of guilds.values()) {
                    const channels = await guild.channels.fetch();
                    const channel = channels.find(ch => 
                        ch.topic?.includes(checkoutId) || 
                        ch.name?.includes(checkoutId.slice(0, 8))
                    );
                    if (channel) {
                        channelId = channel.id;
                        break;
                    }
                }
            }

            if (!channelId) return;

            const channel = this.client.channels.cache.get(channelId);
            if (!channel) return;

            // Verificar se há mensagens importantes não lidas
            const messages = await channel.messages.fetch({ limit: 10 });
            const hasUnresolvedIssues = messages.some(msg => 
                msg.content.includes('❌') || 
                msg.content.includes('erro') || 
                msg.content.includes('Erro') ||
                msg.content.includes('error') ||
                msg.content.includes('Error')
            );

            if (hasUnresolvedIssues) {
                logger.info(`Canal ${channel.name} tem issues não resolvidas, mantendo aberto.`);
                return;
            }

            // Avisar antes de fechar
            const localized = this.getLocalizedText('br');
            const warningMsg = await channel.send(localized.channelClosing);
            
            setTimeout(async () => {
                try {
                    await channel.delete();
                    logger.info(`Canal de checkout deletado: ${channel.name}`, { checkoutId });
                } catch (deleteError) {
                    // Canal já deletado ou sem permissão
                }
            }, 30000); // 30 segundos

        } catch (error) {
            // Ignora erros de canal não encontrado
            if (!error.message.includes('Unknown Channel')) {
                logger.erro('FECHAR_CANAL_CHECKOUT', error);
            }
        }
    }

    // Atualizar quantidade no carrinho
    async updateCartQuantity(channel, checkoutId, userId, change) {
        try {
            const checkout = checkoutService.getCheckout(checkoutId);
            if (!checkout) return false;

            const newQuantity = checkout.quantity + change;
            if (newQuantity < 1) return false;

            const product = productService.getProduct(checkout.productId);
            if (product.stock !== null && newQuantity > product.stock) {
                return false;
            }

            const updated = checkoutService.updateQuantity(checkoutId, newQuantity);
            if (updated) {
                // Limpar mensagens antigas
                const messages = await channel.messages.fetch({ limit: 5 });
                const cartMessages = messages.filter(msg => 
                    msg.embeds.length > 0 && 
                    (msg.embeds[0].title?.includes('Carrinho') || msg.embeds[0].title?.includes('Cart'))
                );
                
                cartMessages.forEach(msg => {
                    if (msg.deletable) msg.delete().catch(() => {});
                });

                // Enviar novo painel
                await this.sendCartPanel(channel, checkoutId, userId);
                return true;
            }
            return false;
        } catch (error) {
            logger.erro('ATUALIZAR_QUANTIDADE_CARRINHO', error, userId);
            return false;
        }
    }

    // Helper para cor da região
    getRegionColor(region) {
        const colors = {
            'br': 0x009C3B,     // Verde Brasil
            'intl': 0x0052A5,   // Azul Internacional
            'us': 0x3C3B6E,     // Azul EUA
            'eu': 0x003399      // Azul Europa
        };
        return colors[region] || 0x5865F2;
    }

    // Limpar carrinho abandonado
    async cleanupAbandonedCarts() {
        try {
            const allCheckouts = checkoutService.getAllCheckouts();
            const abandonedCheckouts = allCheckouts.filter(checkout => {
                const created = new Date(checkout.createdAt);
                const now = new Date();
                const hoursDiff = (now - created) / (1000 * 60 * 60);
                
                return checkout.status === 'DRAFT' && hoursDiff > 1; // Mais de 1 hora
            });

            for (const checkout of abandonedCheckouts) {
                try {
                    checkoutService.cancelCheckout(checkout.id);
                    await this.closeCheckoutChannel(checkout.id);
                    logger.info(`Carrinho abandonado limpo: ${checkout.id}`);
                } catch (error) {
                    // Ignora erros individuais
                }
            }

            return abandonedCheckouts.length;
        } catch (error) {
            logger.erro('LIMPAR_CARRINHOS_ABANDONADOS', error);
            return 0;
        }
    }

    // Verificar se usuário já tem checkout ativo
    async getUserActiveCheckout(userId) {
        try {
            const allCheckouts = checkoutService.getAllCheckouts();
            return allCheckouts.find(checkout => 
                checkout.userId === userId && 
                (checkout.status === 'DRAFT' || checkout.status === 'PENDING')
            );
        } catch (error) {
            logger.erro('VERIFICAR_CHECKOUT_ATIVO', error, userId);
            return null;
        }
    }
}

module.exports = CartService;