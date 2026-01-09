const axios = require('axios');
const config = require('../config');

class Logger {
    constructor() {
        this.webhookUrl = config.discord.webhook_url;
        this.logChannel = config.discord.log_channel;
        this.adminId = config.discord.admin_id;
        this.emojis = config.emojis;
    }

    // Log no console E no webhook do Discord
    async log(type, message, data = null) {
        const timestamp = new Date().toLocaleString('pt-BR');
        const consoleMessage = `[${timestamp}] ${type}: ${message}`;
        
        console.log(consoleMessage);
        if (data) console.log(data);

        // Enviar para webhook do Discord
        try {
            let color;
            let emoji;
            
            switch(type) {
                case 'VENDA':
                    color = 0x00FF00; // Verde
                    emoji = '💰';
                    break;
                case 'ERRO':
                    color = 0xFF0000; // Vermelho
                    emoji = '❌';
                    break;
                case 'INFO':
                    color = 0x0099FF; // Azul
                    emoji = 'ℹ️';
                    break;
                case 'PAGAMENTO':
                    color = 0xFFD700; // Dourado
                    emoji = '💳';
                    break;
                default:
                    color = 0x808080; // Cinza
                    emoji = '📝';
            }

            const embed = {
                title: `${emoji} ${type}`,
                description: message,
                color: color,
                fields: [],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Bot de Vendas'
                }
            };

            if (data && typeof data === 'object') {
                Object.entries(data).forEach(([key, value]) => {
                    if (value) {
                        embed.fields.push({
                            name: key,
                            value: String(value).slice(0, 1024),
                            inline: true
                        });
                    }
                });
            }

            await axios.post(this.webhookUrl, {
                embeds: [embed],
                content: type === 'ERRO' ? `<@${this.adminId}>` : undefined
            });
        } catch (error) {
            console.error('Erro ao enviar log para webhook:', error.message);
        }
    }

    // Métodos específicos
    async venda(user, product, valor, metodo) {
        await this.log('VENDA', `Nova venda realizada!`, {
            '👤 Usuário': user,
            '📦 Produto': product,
            '💰 Valor': `R$ ${valor.toFixed(2)}`,
            '💳 Método': metodo,
            '🕒 Data': new Date().toLocaleString('pt-BR')
        });
    }

    async pagamento(checkoutId, status, provider) {
        await this.log('PAGAMENTO', `Pagamento ${status}`, {
            '📋 Checkout ID': checkoutId,
            '🏦 Gateway': provider,
            '📊 Status': status,
            '🕒 Hora': new Date().toLocaleTimeString('pt-BR')
        });
    }

    async erro(contexto, error, userId = null) {
        await this.log('ERRO', `Erro em ${contexto}`, {
            '🔧 Contexto': contexto,
            '❌ Erro': error.message || String(error),
            '👤 Usuário': userId || 'Não especificado',
            '📁 Stack': error.stack ? error.stack.split('\n')[0] : 'Não disponível'
        });
    }

    async info(mensagem, data = null) {
        await this.log('INFO', mensagem, data);
    }
}

module.exports = new Logger();