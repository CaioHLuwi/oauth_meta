const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const metaAdsRoutes = require("../routes/metaAds");

const app = express();

// Middlewares
app.use(cors()); // Permite todas as origens por padrão, ajuste em produção
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Serve static files from the 'public' directory
app.use("/oauth_meta", express.static(path.join(__dirname, "../public")));

// Rotas da API Meta Ads
app.use("/oauth_meta", metaAdsRoutes);

// Rota de saúde
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is healthy" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint não encontrado" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;


