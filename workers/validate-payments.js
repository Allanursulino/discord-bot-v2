const {
    ComponentType,
    ButtonStyle,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder
} = require("discord.js");

const { db, checkoutService, formatPrice } = require("../@shared");
const config = require("../config");
const logger = require("../utils/logger");

module.exports = {
    execute: (client) => {
        client.on("clientReady", () => {
            const guild = client.guilds.cache.get(config.guildId);
            const intervalSeconds = config.settings?.payment_check_interval_seconds || 15;

            setInterval(async () => {
                try {
                    const all = db.all();
                    const checkouts = all.filter(entry =>
                        entry.ID.startsWith("checkout:") &&
                        entry.data?.status === "PENDING"
                    );

                    logger.info(`Verificando ${checkouts.length} pagamentos pendentes...`);

                    for (const checkout of checkouts) {
                        const checkoutData = checkout.data;

                        try {
                            const updatedCheckout = await checkoutService.checkPaymentStatus(checkoutData.id);

                            if (!updatedCheckout || updatedCheckout.status !== "APPROVED") continue;

                            const channelId = checkout.ID.split(":")[1];
                            const channel = guild.channels.cache.get(channelId);
                            if (!channel) continue;

                            const member = await guild.members.fetch(checkoutData.userId).catch(() => null);
                            if (!member) continue;

                            const provider = checkoutData.payment?.provider;
                            const gatewayName =
                                provider === "mercado_pago"
                                    ? "Mercado Pago PIX"
                                    : provider === "stripe"
                                    ? "Stripe"
                                    : "Pagamento";

                            const embed = new EmbedBuilder()
                                .setTitle(`${config.emojis.success} Pagamento Aprovado`)
                                .setColor(0x00ff00)
                                .setDescription("Seu pagamento foi confirmado com sucesso!")
                                .addFields(
                                    { name: "📋 Compra", value: checkoutData.id, inline: true },
                                    { name: "💰 Valor", value: formatPrice(checkoutData.total), inline: true },
                                    { name: "💳 Método", value: gatewayName, inline: true }
                                )
                                .setTimestamp();

                            await channel.send({
                                content: `🎉 <@${checkoutData.userId}> pagamento aprovado!`,
                                embeds: [embed]
                            });

                            await db.set(checkout.ID, {
                                ...checkoutData,
                                status: "APPROVED"
                            });

                            logger.venda(
                                checkoutData.userId,
                                checkoutData.productName || "Produto",
                                checkoutData.total,
                                gatewayName
                            );
                        } catch (err) {
                            logger.erro("CHECKOUT_PAYMENT", err, checkoutData?.id);
                        }
                    }
                } catch (error) {
                    logger.erro("VALIDATE_PAYMENTS_LOOP", error);
                }
            }, intervalSeconds * 1000);
        });
    }
};
