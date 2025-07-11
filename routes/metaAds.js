const express = require("express");
const axios = require("axios");
const path = require("path");
const router = express.Router();

// Carrega variáveis de ambiente do .env
require("dotenv").config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:5000/oauth-callback.html";

// Rota para iniciar o fluxo OAuth (usando apenas public_profile para teste)
router.get("/oauth/initiate", (req, res) => {
  if (!META_APP_ID) {
    return res.status(500).json({ error: "META_APP_ID não configurado no ambiente." });
  }
  
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

// Servir arquivo HTML estático para o callback
router.get("/oauth-callback.html", (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  const error_description = req.query.error_description;

  // Se há um código, processar no backend e redirecionar com access token
  if (code && !error) {
    processOAuthCallback(code, res);
    return;
  }

  // Se há erro ou não há código, servir página HTML com parâmetros
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Meta Ads OAuth Callback</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .success { color: #28a745; font-size: 18px; margin-bottom: 20px; }
        .error { color: #dc3545; font-size: 18px; margin-bottom: 20px; }
        .token {
            background-color: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div id="content">
        ${error ? `
            <div class="error">
                <h2>Erro na Autenticação</h2>
                <p>${error_description || error}</p>
            </div>
        ` : `
            <div class="error">
                <h2>Erro</h2>
                <p>Código de autorização não recebido.</p>
            </div>
        `}
    </div>

    <script>
        function sendMessageToParent(data) {
            const origins = [
                'https://otmizy.com',
                'https://zeuz.otmizy.com', 
                'http://localhost:3000',
                window.location.origin
            ];
            
            origins.forEach(origin => {
                try {
                    if (window.opener) {
                        window.opener.postMessage(data, origin);
                        console.log('Mensagem enviada para origem:', origin);
                    }
                } catch (e) {
                    console.log('Falha ao enviar para origem:', origin, e);
                }
            });
        }

        sendMessageToParent({
            type: 'META_ADS_OAUTH_ERROR',
            error: '${error_description || error || 'Código de autorização não recebido'}'
        });
        
        setTimeout(() => window.close(), 3000);
    </script>
</body>
</html>`;

  res.send(htmlContent);
});

// Função para processar o callback OAuth
async function processOAuthCallback(code, res) {
  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return sendErrorPage(res, "Variáveis de ambiente não configuradas");
  }

  try {
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    // Redirecionar para a página de sucesso com o access token
    const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Meta Ads OAuth Callback</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .success { color: #28a745; font-size: 18px; margin-bottom: 20px; }
        .token {
            background-color: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="success">
        <h2>Autenticação Concluída com Sucesso!</h2>
        <p>Fechando esta janela...</p>
        <div class="token">Access Token: ${accessToken.substring(0, 20)}...</div>
    </div>

    <script>
        function sendMessageToParent(data) {
            const origins = [
                'https://otmizy.com',
                'https://zeuz.otmizy.com', 
                'http://localhost:3000',
                window.location.origin
            ];
            
            origins.forEach(origin => {
                try {
                    if (window.opener) {
                        window.opener.postMessage(data, origin);
                        console.log('Mensagem enviada para origem:', origin);
                    }
                } catch (e) {
                    console.log('Falha ao enviar para origem:', origin, e);
                }
            });
        }

        sendMessageToParent({
            type: 'META_ADS_OAUTH_SUCCESS',
            accessToken: '${accessToken}',
            code: '${code}',
            timestamp: Date.now()
        });
        
        setTimeout(() => window.close(), 2000);
    </script>
</body>
</html>`;

    res.send(successHtml);

  } catch (error) {
    console.error("Erro ao trocar código por token:", error.response?.data || error.message);
    sendErrorPage(res, "Erro ao obter access token");
  }
}

// Função para enviar página de erro
function sendErrorPage(res, errorMessage) {
  const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Meta Ads OAuth Callback</title>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }
        .error { color: #dc3545; font-size: 18px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="error">
        <h2>Erro</h2>
        <p>${errorMessage}</p>
    </div>

    <script>
        function sendMessageToParent(data) {
            const origins = [
                'https://otmizy.com',
                'https://zeuz.otmizy.com', 
                'http://localhost:3000',
                window.location.origin
            ];
            
            origins.forEach(origin => {
                try {
                    if (window.opener) {
                        window.opener.postMessage(data, origin);
                        console.log('Mensagem enviada para origem:', origin);
                    }
                } catch (e) {
                    console.log('Falha ao enviar para origem:', origin, e);
                }
            });
        }

        sendMessageToParent({
            type: 'META_ADS_OAUTH_ERROR',
            error: '${errorMessage}'
        });
        
        setTimeout(() => window.close(), 3000);
    </script>
</body>
</html>`;

  res.send(errorHtml);
}

// Rota de callback para o OAuth (API endpoint)
router.get("/oauth-callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Código de autorização não recebido." });
  }

  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.status(500).json({ error: "Variáveis de ambiente não configuradas." });
  }

  try {
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    res.json({ 
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: response.data.expires_in 
    });

  } catch (error) {
    console.error("Erro ao trocar código por token:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao obter access token." });
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

