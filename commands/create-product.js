const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    EmbedBuilder,
    TextInputStyle,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require("discord.js");
const productService = require("../services/product-service");
const CatalogService = require("../services/catalog-service");
const config = require("../config");
const logger = require("../utils/logger");

module.exports = {
    options: {
        name: "criar-produto",
        type: ApplicationCommandType.ChatInput,
        description: "Criar um novo produto para venda",
        options: [
            {
                name: "regiao",
                description: "Região do produto",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: "🇧🇷 Brasil (BRL)", value: "br" },
                    { name: "🌎 Internacional (USD)", value: "intl" }
                ]
            }
        ],
    },
    
    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Você precisa ser administrador para criar produtos.",
                ephemeral: true
            });
        }

        const regiao = interaction.options.getString("regiao");
        const regionInfo = config.regions[regiao];
        
        if (!regionInfo) {
            return interaction.reply({
                content: "❌ Região inválida.",
                ephemeral: true
            });
        }

        // Criar modal com NO MÁXIMO 5 ActionRows
        const modal = new ModalBuilder()
            .setCustomId(`create_product_${regiao}`)
            .setTitle(`Criar Produto - ${regionInfo.name}`);

        // 1ª LINHA: Nome do produto
        const nomeInput = new TextInputBuilder()
            .setCustomId('product_name')
            .setLabel('Nome do Produto')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100)
            .setPlaceholder('Ex: Curso de JavaScript Completo');

        // 2ª LINHA: Preço
        const precoInput = new TextInputBuilder()
            .setCustomId('product_price')
            .setLabel(`Preço (${regionInfo.currency})`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10)
            .setPlaceholder('Ex: 99.90');

        // 3ª LINHA: Estoque (combinado com algo)
        const stockInput = new TextInputBuilder()
            .setCustomId('product_stock')
            .setLabel('Estoque (vazio = ilimitado)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(10)
            .setPlaceholder('Ex: 100 ou deixe vazio');

        // 4ª LINHA: Descrição (mais importante)
        const descInput = new TextInputBuilder()
            .setCustomId('product_description')
            .setLabel('Descrição do produto')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
            .setPlaceholder('Descreva seu produto aqui...');

        // 5ª LINHA: Imagem (opcional) e Entrega (combinados)
        // Vamos fazer um select menu em vez de dois text inputs
        const extraInput = new TextInputBuilder()
            .setCustomId('product_extra')
            .setLabel('Imagem URL (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(500)
            .setPlaceholder('https://exemplo.com/imagem.jpg');

        // Adicionar APENAS 5 ActionRows
        modal.addComponents(
            new ActionRowBuilder().addComponents(nomeInput),
            new ActionRowBuilder().addComponents(precoInput),
            new ActionRowBuilder().addComponents(stockInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(extraInput)
        );

        await interaction.showModal(modal);

        // Handler do modal
        const filter = (i) => i.customId === `create_product_${regiao}` && i.user.id === interaction.user.id;
        
        try {
            const modalResponse = await interaction.awaitModalSubmit({ filter, time: 300000 });
            
            await modalResponse.deferReply({ ephemeral: true });

            // Coletar dados
            const nome = modalResponse.fields.getTextInputValue('product_name');
            const preco = parseFloat(modalResponse.fields.getTextInputValue('product_price'));
            const estoque = modalResponse.fields.getTextInputValue('product_stock');
            const descricao = modalResponse.fields.getTextInputValue('product_description');
            const extra = modalResponse.fields.getTextInputValue('product_extra') || '';

            // Validar preço
            if (isNaN(preco) || preco <= 0) {
                return modalResponse.editReply(`❌ Preço inválido. Use um número positivo (ex: 99.90).`);
            }

            // Extrair imagem URL (se houver)
            let imagem = '';
            let deliveryContent = '';
            
            // Tenta identificar se é URL de imagem
            if (extra.startsWith('http')) {
                if (extra.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    imagem = extra;
                } else {
                    deliveryContent = extra;
                }
            } else if (extra.trim() !== '') {
                deliveryContent = extra;
            }

            // Criar produto
            const productData = {
                title: nome,
                price: preco,
                region: regiao,
                currency: regionInfo.currency,
                description: descricao,
                stock: estoque && estoque.trim() !== '' ? parseInt(estoque) : null,
                image: imagem,
                delivery_type: 'digital',
                delivery_content: deliveryContent,
                created_at: new Date().toISOString()
            };

            const product = productService.saveProduct(productData);

            // Publicar no canal da região
            const catalogService = new CatalogService(interaction.client);
            const published = await catalogService.publishProduct(product.id);

            // Embed de confirmação
            const embed = new EmbedBuilder()
                .setTitle(`✅ PRODUTO CRIADO - ${regionInfo.name}`)
                .setColor(this.getRegionColor(regiao))
                .addFields(
                    {
                        name: '📦 Nome',
                        value: product.title,
                        inline: true
                    },
                    {
                        name: '💰 Preço',
                        value: `${regionInfo.emojis?.currency || ''} ${product.price.toFixed(2)} ${product.currency}`,
                        inline: true
                    },
                    {
                        name: '🌍 Região',
                        value: regionInfo.name,
                        inline: true
                    },
                    {
                        name: '📊 Estoque',
                        value: product.stock === null ? '∞ Ilimitado' : `${product.stock} unidades`,
                        inline: true
                    },
                    {
                        name: '📋 ID do Produto',
                        value: `\`${product.id}\``,
                        inline: false
                    }
                )
                .setTimestamp();

            // Adicionar canal se publicado
            if (published && regionInfo.product_channel) {
                embed.addFields({
                    name: '📍 Canal',
                    value: `<#${regionInfo.product_channel}>`,
                    inline: false
                });
                embed.setFooter({ text: 'Produto publicado no canal' });
            } else {
                embed.setFooter({ text: 'Configure o canal no config.json' });
            }

            if (product.image) {
                embed.setImage(product.image);
            }

            await modalResponse.editReply({
                content: `✅ **Produto criado para ${regionInfo.name}!**`,
                embeds: [embed]
            });

            logger.info(`Produto criado: ${product.title}`, {
                id: product.id,
                region: regiao,
                price: product.price,
                currency: product.currency,
                admin: interaction.user.tag
            });

        } catch (error) {
            if (error.name === 'InteractionCollectorError') {
                // Timeout do modal
                return;
            }
            logger.erro('CRIAR_PRODUTO_MODAL', error, interaction.user.id);
            console.error('Erro detalhado:', error);
        }
    },

    // Helper para cor da região
    getRegionColor(region) {
        const colors = {
            'br': 0x009C3B,
            'intl': 0x0052A5
        };
        return colors[region] || 0x5865F2;
    }
};