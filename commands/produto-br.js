const {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");
const productService = require("../services/product-service");
const CatalogService = require("../services/catalog-service");
const config = require("../config");

module.exports = {
    options: {
        name: "produto-br",
        type: ApplicationCommandType.ChatInput,
        description: "Criar rapidamente um produto para Brasil",
        options: [
            {
                name: "nome",
                description: "Nome do produto",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "preco",
                description: "Preço em R$ (ex: 99.90)",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
            {
                name: "estoque",
                description: "Quantidade em estoque",
                type: ApplicationCommandOptionType.Integer,
                required: false,
            }
        ],
    },
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply("❌ Apenas administradores podem criar produtos.");
        }

        const nome = interaction.options.getString("nome");
        const preco = interaction.options.getNumber("preco");
        const estoque = interaction.options.getInteger("estoque");

        // Criar produto BR
        const productData = {
            title: nome,
            price: preco,
            region: "br",
            currency: "BRL",
            stock: estoque || null,
            delivery_type: "digital"
        };

        const product = productService.saveProduct(productData);

        // Publicar no canal BR
        const catalogService = new CatalogService(interaction.client);
        await catalogService.publishProduct(product.id);

        const embed = new EmbedBuilder()
            .setTitle("✅ PRODUTO BR CRIADO!")
            .setColor(0x009C3B)
            .setDescription(`Produto criado para o mercado brasileiro`)
            .addFields(
                { name: "📦 Produto", value: product.title, inline: true },
                { name: "💰 Preço", value: `R$ ${product.price.toFixed(2)}`, inline: true },
                { name: "📊 Estoque", value: product.stock === null ? "∞ Ilimitado" : `${product.stock} unidades`, inline: true },
                { name: "🌍 Região", value: "🇧🇷 Brasil", inline: true },
                { name: "📋 ID", value: `\`${product.id}\``, inline: false },
                { name: "💳 Pagamentos", value: "💰 PIX | 💳 Cartão | 📄 Boleto", inline: false }
            )
            .setFooter({ text: "Produto publicado no canal BR" })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};