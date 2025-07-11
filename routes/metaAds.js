
const express = require("express");
const axios = require("axios");
const router = express.Router();

// Utility function to get environment variables
const getEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`Environment variable ${key} is not set.`);
  }
  return value;
};

const META_APP_ID = getEnv("META_APP_ID");
const META_APP_SECRET = getEnv("META_APP_SECRET");
const REDIRECT_URI = getEnv("REDIRECT_URI");

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy" });
});

// Initiate OAuth flow
router.get("/oauth/initiate", (req, res) => {
  if (!META_APP_ID || !REDIRECT_URI) {
    return res
      .status(500)
      .json({ error: "META_APP_ID or REDIRECT_URI not configured in environment." });
  }
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

// OAuth callback endpoint
router.get("/oauth-callback.html", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.error("Authorization code not received.");
    return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body>
                <h1>Erro na Autenticação</h1>
                <p>Código de autorização não recebido.</p>
                <script>
                    localStorage.setItem(\'meta_ads_oauth_result\', JSON.stringify({ type: \'META_ADS_OAUTH_ERROR\', message: \'Authorization code not received.\' }));
                    window.close();
                </script>
            </body>
            </html>
        `);
  }

  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    console.error("Missing environment variables for token exchange.");
    return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body>
                <h1>Erro na Autenticação</h1>
                <p>Variáveis de ambiente ausentes para troca de token.</p>
                <script>
                    localStorage.setItem(\'meta_ads_oauth_result\', JSON.stringify({ type: \'META_ADS_OAUTH_ERROR\', message: \'Missing environment variables.\' }));
                    window.close();
                </script>
            </body>
            </html>
        `);
  }

  try {
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      {
        params: {
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log(
      "Access Token obtained:",
      accessToken ? accessToken.substring(0, 20) + "..." : "N/A"
    );

    res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Autenticação Concluída</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
                    .container { background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                    .success { color: #4CAF50; font-weight: bold; }
                    .error { color: #F44336; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Autenticação Concluída com Sucesso!</h1>
                    <p class="success">Access Token: ${accessToken.substring(0, 50)}...</p>
                    <p>Esta janela será fechada automaticamente.</p>
                    <script>
                        localStorage.setItem(\'meta_ads_oauth_result\', JSON.stringify({ type: \'META_ADS_OAUTH_SUCCESS\', accessToken: \'${accessToken}\' }));
                        setTimeout(() => { window.close(); }, 100);
                    </script>
                </div>
            </body>
            </html>
        `);
  } catch (error) {
    console.error(
      "Error exchanging code for access token:",
      error.response ? error.response.data : error.message
    );
    const errorMessage =
      error.response &&
      error.response.data &&
      error.response.data.error &&
      error.response.data.error.message
        ? error.response.data.error.message
        : "Erro desconhecido ao obter access token.";

    res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body>
                <h1>Erro na Autenticação</h1>
                <p class="error">Erro ao obter access token: ${errorMessage}</p>
                <script>
                    localStorage.setItem(\'meta_ads_oauth_result\', JSON.stringify({ type: \'META_ADS_OAUTH_ERROR\', message: \'Error obtaining access token: ${errorMessage}\' }));
                    window.close();
                </script>
            </body>
            </html>
        `);
  }
});

// Test token endpoint (for debugging)
router.get("/test-token", async (req, res) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required." });
  }

  try {
    const debugResponse = await axios.get(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${META_APP_ID}|${META_APP_SECRET}`
    );
    res.json(debugResponse.data);
  } catch (error) {
    console.error(
      "Error debugging token:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({
        error: "Failed to debug token.",
        details: error.response ? error.response.data : error.message,
      });
  }
});

module.exports = router;


