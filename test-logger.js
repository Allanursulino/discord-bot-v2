require("dotenv").config();
const logger = require("./utils/logger");

(async () => {
    console.log("ENV WEBHOOK:", process.env.DISCORD_LOG_WEBHOOK);

    await logger.info("Teste local do logger", {
        origem: "local",
        status: "OK"
    });

    await logger.erro("TESTE_ERRO", new Error("Erro de teste"));
})();
