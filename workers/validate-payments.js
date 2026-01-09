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

            if (!checkoutService) {
                logger.erro(
                    "CHECKOUT_SERVICE_NAO_INICIALIZADO",
                    new Error("checkoutService está undefined. Verifique variáveis de ambiente.")
                );
                return;
            }

            const guild = client.guilds.cache.get(config.guildId);
            if (!guild) {
                logger.erro(
                    "GUILD_NAO_ENCONTRADA",
                    new Error(`Guild ${config.guildId} não encontrada`)
                );
                return;
            }

            const intervalSeconds =
                config.settings?.payment_check_interval_seconds || 15;

            setInterval(async () => {
                try {
                    const all = db.all();

                    const checkouts = all.filter(entry =>
                        entry.ID.startsWith("checkout:") &&
                        entry.data?.status === "PENDING"
                    );

                    logger.info(
                        `Verificando ${checkouts.length} pagamentos pendentes...`
                    );

                    for (const checkout of checkouts) {
                        const checkoutData = checkout.data;

                        try {
                            const updatedCheckout =
                                await checkoutService.checkPaymentStatus(
                                    checkoutData.id
                                );

                            if (
                                updatedCheckout &&
                                updatedCheckout.status === "APPROVED"
                            ) {
                                const channelId =
                                    checkout.ID.split(":")[1];

                                const channel =
                                    guild.channels.cache.get(channelId);

                                if (!channel) continue;

                                const member =
                                    await guild.members.fetch(
                                        checkoutData.userId
                                    ).catch(() => null);

                                if (!member) continue;

                                const provider =
                                    checkoutData.payment?.provider;

                                const gatewayName =
                                    provider === "mercado_pago"
                                        ? "Mercado Pago PIX"
                                        : provider === "stripe"
                                        ? "Stripe"
                                        : "Pagamento";

                                const embed = new EmbedBuilder()
                                    .setTitle(
                                        `${config.emojis.success} Pagamento Aprovado`
                                    )
                                    .setColor("#00FF00")
                                    .setDescription(
                                        "Seu pagamento foi confirmado com sucesso!"
                                    )
                                    .addFields(
                                        {
                                            name: `${config.emojis.product} Produto`,
                                            value:
                                                checkoutData.productName ||
                                                "Produto Digital",
                                            inline: false
                                        },
                                        {
                                            name: `${config.emojis.money} Valor`,
                                            value: formatPrice(
                                                checkoutData.total
                                            ),
                                            inline: true
                                        },
                                        {
                                            name: `${config.emojis.timer} Data`,
                                            value: new Date().toLocaleString(
                                                "pt-BR"
                                            ),
                                            inline: true
                                        },
                                        {
                                            name: "Gateway",
                                            value: gatewayName,
                                            inline: true
                                        }
                                    )
                                    .setTimestamp();

                                await channel.send({
                                    content: `🎉 <@${checkoutData.userId}>`,
                                    embeds: [embed]
                                });

                                if (
                                    config.settings?.send_dm_on_purchase &&
                                    member
                                ) {
                                    try {
                                        await member.send({ embeds: [embed] });
                                    } catch {}
                                }

                                logger.venda(
                                    checkoutData.userId,
                                    checkoutData.productName || "Produto",
                                    checkoutData.total,
                                    gatewayName
                                );
                            }
                        } catch (err) {
                            logger.erro(
                                "ERRO_CHECKOUT_INDIVIDUAL",
                                err,
                                checkoutData?.id
                            );
                        }
                    }

                    const expiredCount =
                        await checkoutService.checkExpiredCheckouts();

                    if (expiredCount > 0) {
                        logger.info(
                            `${expiredCount} checkouts expirados processados`
                        );
                    }
                } catch (error) {
                    logger.erro("VALIDATE_PAYMENTS_LOOP", error);
                }
            }, intervalSeconds * 1000);
        });
    }
};
