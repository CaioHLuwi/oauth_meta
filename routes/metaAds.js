const express = require("express");
const axios = require("axios");
const router = express.Router();

// Carrega variáveis de ambiente do .env
require("dotenv").config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5000/oauth-callback.html"; // Ajuste conforme seu ambiente

// Rota para iniciar o fluxo OAuth (usando apenas public_profile para teste)
router.get("/oauth/initiate", (req, res) => {
  if (!META_APP_ID) {
    return res.status(500).json({ error: "META_APP_ID não configurado no ambiente." });
  }
  
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

// Rota de callback para o OAuth
router.get("/oauth-callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    // Se não houver código, é um erro ou o usuário cancelou
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Meta Ads OAuth Callback</title>
          <script>
              try {
                  window.opener.postMessage({
                      type: 'META_ADS_OAUTH_ERROR',
                      error: 'Código de autorização não recebido'
                  }, '*');
              } catch (e) {
                  console.error('Erro ao enviar mensagem:', e);
              }
              window.close();
          </script>
      </head>
      <body>
          <p>Erro: Código de autorização não recebido.</p>
      </body>
      </html>
    `);
  }

  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Meta Ads OAuth Callback</title>
          <script>
              try {
                  window.opener.postMessage({
                      type: 'META_ADS_OAUTH_ERROR',
                      error: 'Variáveis de ambiente não configuradas'
                  }, '*');
              } catch (e) {
                  console.error('Erro ao enviar mensagem:', e);
              }
              window.close();
          </script>
      </head>
      <body>
          <p>Erro: Variáveis de ambiente não configuradas.</p>
      </body>
      </html>
    `);
  }

  try {
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    // Enviar mensagem para a janela pai (o popup) com origem específica
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Meta Ads OAuth Callback</title>
          <script>
              try {
                  // Tentar enviar para múltiplas origens possíveis
                  const origins = ['https://otmizy.com', 'http://localhost:3000', '*'];
                  const message = {
                      type: 'META_ADS_OAUTH_SUCCESS',
                      accessToken: '${accessToken}',
                      code: '${code}',
                      timestamp: Date.now()
                  };
                  
                  origins.forEach(origin => {
                      try {
                          window.opener.postMessage(message, origin);
                          console.log('Mensagem enviada para origem:', origin);
                      } catch (e) {
                          console.log('Falha ao enviar para origem:', origin, e);
                      }
                  });
                  
                  // Aguardar um pouco antes de fechar
                  setTimeout(() => {
                      window.close();
                  }, 1000);
              } catch (e) {
                  console.error('Erro geral ao enviar mensagem:', e);
                  window.close();
              }
          </script>
      </head>
      <body>
          <p>Autenticação concluída com sucesso! Fechando esta janela...</p>
          <p>Access Token: ${accessToken.substring(0, 20)}...</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("Erro ao trocar código por token:", error.response?.data || error.message);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Meta Ads OAuth Callback</title>
          <script>
              try {
                  window.opener.postMessage({
                      type: 'META_ADS_OAUTH_ERROR',
                      error: 'Erro ao obter access token'
                  }, '*');
              } catch (e) {
                  console.error('Erro ao enviar mensagem:', e);
              }
              window.close();
          </script>
      </head>
      <body>
          <p>Erro ao obter access token.</p>
      </body>
      </html>
    `);
  }
});

// Rota de saúde para o prefixo /oauth_meta
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is healthy" });
});

// Rota para testar o access token (usando Graph API básica)
router.get("/test-token", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token não fornecido." });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    // Testa o token com a Graph API básica
    const response = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
    res.json({ 
      success: true, 
      user: response.data,
      message: "Token válido!" 
    });
  } catch (error) {
    console.error("Erro ao validar token:", error.response?.data || error.message);
    res.status(401).json({ 
      error: "Token inválido ou expirado.",
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
