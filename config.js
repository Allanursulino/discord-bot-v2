require("dotenv").config();

module.exports = {
  // =========================
  // Discord / Bot
  // =========================
  guildId: process.env.GUILD_ID || "1405978261082865714",

  discord: {
    admin_id: process.env.DISCORD_ADMIN_ID || "297909145825443841",
    admin_roles: ["Administrator", "Moderator"],
    log_channel: "1407746196843266088",
    support_channel: "1407746196843266088",
    bot_status_channel: "1407746196843266088",

    // webhook de logs (opcional, mas usado pelo logger.js)
    webhook_url: process.env.DISCORD_LOG_WEBHOOK || null
  },

  // =========================
  // Regions
  // =========================
  regions: {
    br: {
      name: "Brasil",
      currency: "BRL",
      payment_methods: ["pix", "card"],
      category_id: "1407980259025883286",
      product_channel: "1458924793335123968",
      checkout_category: "1407746087528824872",
      emojis: {
        flag: "🇧🇷",
        currency: "R$"
      }
    },

    intl: {
      name: "Internacional",
      currency: "USD",
      payment_methods: ["card"],
      category_id: "1407980259025883286",
      product_channel: "1458924725937115147",
      checkout_category: "1407746087528824872",
      emojis: {
        flag: "🌎",
        currency: "$"
      }
    }
  },

  // =========================
  // Payment
  // =========================
  payment: {
  provider: "dual",
  auto_approve: true,
  pix_expiration_minutes: 30,
  webhook_base_url: "https://discord-bot-orders.onrender.com",
  timeout: 10000,
  max_retries: 3,

  mercadoPago: {
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || null,
    public_key: process.env.MERCADO_PAGO_PUBLIC_KEY || null
  },

  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY || null,
    public_key: process.env.STRIPE_PUBLIC_KEY || null,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || null
  }
},

  // =========================
  // Emojis
  // =========================
  emojis: {
    pix: "💰",
    stripe: "💳",
    mercado_pago: "🏦",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    cart: "🛒",
    loading: "🔄",
    product: "📦",
    money: "💵",
    br: "🇧🇷",
    us: "🇺🇸",
    world: "🌎",
    qr_code: "📱",
    timer: "⏳",
    check: "✔️",
    lock: "🔒",
    unlock: "🔓",
    download: "📥",
    receipt: "🧾",
    credit_card: "💳",
    bank: "🏦",
    shopping_bag: "🛍️"
  },

  // =========================
  // Settings
  // =========================
  settings: {
    auto_delete_checkout: true,
    checkout_timeout_minutes: 30,
    payment_check_interval_seconds: 15,
    send_dm_on_purchase: true,
    cleanup_interval_minutes: 60,
    max_payment_retries: 3,
    max_checkout_age_hours: 24,
    auto_restart_hours: 6,
    enable_logging: true,
    enable_debug: false
  },

  // =========================
  // Database
  // =========================
  database: {
    type: "json",
    path: "./database",
    backup_path: "./backups",
    auto_save: true,
    save_interval_seconds: 30
  },

  // =========================
  // App
  // =========================
  version: "2.0.0",
  environment: process.env.NODE_ENV || "production",
  maintenance_mode: false,
  maintenance_message: "🚧 Sistema em manutenção. Volte em breve!"
};
