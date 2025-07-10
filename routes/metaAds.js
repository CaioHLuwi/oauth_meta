const express = require("express");
const axios = require("axios");
const router = express.Router();

// Variáveis de ambiente para App ID e App Secret
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5000/oauth-callback.html"; // Ajuste conforme seu ambiente

/**
 * Middleware para validar access token
 */
const validateAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token não fornecido." });
  }
  req.accessToken = authHeader.split(" ")[1];
  next();
};

// Rota para iniciar o fluxo OAuth
router.get("/oauth/initiate", (req, res) => {
  if (!META_APP_ID) {
    return res.status(500).json({ error: "META_APP_ID não configurado no ambiente." });
  }
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is healthy" });
});

// Rota de callback para o OAuth
router.get("/oauth-callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    // Se não houver código, é um erro ou o usuário cancelou
    return res.status(400).json({ error: "Código de autorização não recebido." });
  }

  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.status(500).json({ error: "Variáveis de ambiente do Meta Ads não configuradas." });
  }

  try {
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    // Enviar mensagem para a janela pai (o popup)
    // Isso é crucial para o frontend receber o token
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Meta Ads OAuth Callback</title>
          <script>
              window.opener.postMessage({
                  type: 'META_ADS_OAUTH_SUCCESS',
                  code: '${code}' // Enviamos o código de volta para o frontend trocar pelo token
              }, window.location.origin);
              window.close();
          </script>
      </head>
      <body>
          <p>Autenticação concluída. Fechando esta janela...</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("Erro ao trocar código por token:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao obter access token." });
  }
});

// Rota para testar o access token
router.get("/test-token", validateAccessToken, async (req, res) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/me?access_token=${req.accessToken}`
    );
    res.json({ valid: true, user: response.data });
  } catch (error) {
    res.status(401).json({ valid: false, error: "Token inválido ou expirado." });
  }
});

// Rota para buscar contas de anúncio
router.get("/ad-accounts", validateAccessToken, async (req, res) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/me/adaccounts?access_token=${req.accessToken}`
    );
    res.json({ ad_accounts: response.data.data });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contas de anúncio." });
  }
});

// Rota para buscar campanhas de uma conta de anúncio
router.get("/campaigns", validateAccessToken, async (req, res) => {
  const { ad_account_id } = req.query;
  if (!ad_account_id) {
    return res.status(400).json({ error: "ID da conta de anúncio é obrigatório." });
  }
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${ad_account_id}/campaigns?access_token=${req.accessToken}`
    );
    res.json({ campaigns: response.data.data });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar campanhas." });
  }
});

// Rota para buscar insights de campanhas
router.get("/campaign-insights", validateAccessToken, async (req, res) => {
  const { campaign_id, fields, date_preset } = req.query;
  if (!campaign_id) {
    return res.status(400).json({ error: "ID da campanha é obrigatório." });
  }
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${campaign_id}/insights?access_token=${req.accessToken}&fields=${fields || 'spend,impressions,clicks,cpc,ctr,actions,action_values'}&date_preset=${date_preset || 'lifetime'}`
    );
    res.json({ insights: response.data.data });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar insights da campanha." });
  }
});

module.exports = router;

