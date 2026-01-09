const axios = require("axios");
const config = require("../config");

class Logger {
    constructor() {
        // Prioridade: ENV (Render) → config.js
        this.webhookUrl =
            process.env.DISCORD_LOG_WEBHOOK ||
            config?.discord?.webhook_url ||
            null;

        this.logChannel = config?.discord?.log_channel || null;
        this.adminId = process.env.DISCORD_ADMIN_ID || config?.discord?.admin_id || null;
        this.emojis = config?.emojis || {};
    }

    isValidWebhook(url) {
        return typeof url === "string" && url.startsWith("https://discord.com/api/webhooks/");
    }

    async log(type, message, data = null) {
        const timestamp = new Date().toLocaleString("pt-BR");
        const consoleMessage = `[${timestamp}] ${type}: ${message}`;

        console.log(consoleMessage);
        if (data) console.log(data);

        // 🚫 Sem webhook → apenas console
        if (!this.isValidWebhook(this.webhookUrl)) {
            return;
        }

        try {
            let color = 0x808080;
            let emoji = "📝";

            switch (type) {
                case "VENDA":
                    color = 0x00ff00;
                    emoji = "💰";
                    break;
                case "ERRO":
                    color = 0xff0000;
                    emoji = "❌";
                    break;
                case "INFO":
                    color = 0x0099ff;
                    emoji = "ℹ️";
                    break;
                case "PAGAMENTO":
                    color = 0xffd700;
                    emoji = "💳";
                    break;
            }

            const embed = {
                title: `${emoji} ${type}`,
                description: message,
                color,
                fields: [],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "MultiHub • Bot de Vendas"
                }
            };

            if (data && typeof data === "object") {
                for (const [key, value] of Object.entries(data)) {
                    if (value !== undefined && value !== null) {
                        embed.fields.push({
                            name: key,
                            value: String(value).slice(0, 1024),
                            inline: true
                        });
                    }
                }
            }

            await axios.post(this.webhookUrl, {
                embeds: [embed],
                content: type === "ERRO" && this.adminId ? `<@${this.adminId}>` : undefined
            });

        } catch (error) {
            console.error("Erro ao enviar log para webhook:", error.message);
        }
    }

    async venda(user, product, valor, metodo) {
        return this.log("VENDA", "Nova venda realizada!", {
            "👤 Usuário": user,
            "📦 Produto": product,
            "💰 Valor": valor,
            "💳 Método": metodo,
            "🕒 Data": new Date().toLocaleString("pt-BR")
        });
    }

    async pagamento(checkoutId, status, provider) {
        return this.log("PAGAMENTO", `Pagamento ${status}`, {
            "📋 Checkout ID": checkoutId,
            "🏦 Gateway": provider,
            "📊 Status": status
        });
    }

    async erro(contexto, error, userId = null) {
        return this.log("ERRO", `Erro em ${contexto}`, {
            "🔧 Contexto": contexto,
            "❌ Erro": error?.message || String(error),
            "👤 Usuário": userId || "Não especificado",
            "📁 Stack": error?.stack ? error.stack.split("\n")[0] : "N/A"
        });
    }

    async info(mensagem, data = null) {
        return this.log("INFO", mensagem, data);
    }
}

module.exports = new Logger();
