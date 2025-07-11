const express = require("express");
const axios = require("axios");
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

// Rota de callback para o OAuth - processa e redireciona
router.get("/oauth-callback.html", async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  const error_description = req.query.error_description;

  // Se há erro, redirecionar para página de erro
  if (error) {
    return res.redirect(`/oauth_meta/oauth-result.html?error=${encodeURIComponent(error_description || error)}`);
  }

  // Se não há código, erro
  if (!code) {
    return res.redirect(`/oauth_meta/oauth-result.html?error=${encodeURIComponent('Código de autorização não recebido')}`);
  }

  // Verificar variáveis de ambiente
  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.redirect(`/oauth_meta/oauth-result.html?error=${encodeURIComponent('Variáveis de ambiente não configuradas')}`);
  }

  try {
    // Trocar código por access token
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    // Redirecionar para página de sucesso com access token
    res.redirect(`/oauth_meta/oauth-result.html?access_token=${encodeURIComponent(accessToken)}&code=${encodeURIComponent(code)}`);

  } catch (error) {
    console.error("Erro ao trocar código por token:", error.response?.data || error.message);
    res.redirect(`/oauth_meta/oauth-result.html?error=${encodeURIComponent('Erro ao obter access token')}`);
  }
});

// Página de resultado do OAuth (sem scripts inline)
router.get("/oauth-result.html", (req, res) => {
  const accessToken = req.query.access_token;
  const code = req.query.code;
  const error = req.query.error;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Meta Ads OAuth Result</title>
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
    ${accessToken ? `
        <div class="success">
            <h2>Autenticação Concluída com Sucesso!</h2>
            <p>Fechando esta janela...</p>
            <div class="token">Access Token: ${accessToken.substring(0, 20)}...</div>
        </div>
    ` : `
        <div class="error">
            <h2>Erro na Autenticação</h2>
            <p>${error || 'Erro desconhecido'}</p>
        </div>
    `}
    
    <script src="/oauth_meta/oauth-callback.js"></script>
</body>
</html>`;

  res.send(htmlContent);
});

// Arquivo JavaScript externo para evitar CSP
router.get("/oauth-callback.js", (req, res) => {
  const jsContent = `
// Função para obter parâmetros da URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        access_token: urlParams.get('access_token'),
        code: urlParams.get('code'),
        error: urlParams.get('error')
    };
}

// Função para enviar mensagem para a janela pai
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
                console.log('Mensagem enviada para origem:', origin, data);
            }
        } catch (e) {
            console.log('Falha ao enviar para origem:', origin, e);
        }
    });
}

// Processar resultado quando a página carregar
window.addEventListener('load', function() {
    const params = getUrlParams();
    
    if (params.access_token) {
        // Sucesso - enviar access token
        sendMessageToParent({
            type: 'META_ADS_OAUTH_SUCCESS',
            accessToken: params.access_token,
            code: params.code,
            timestamp: Date.now()
        });
        
        setTimeout(() => {
            if (window.opener) {
                window.close();
            }
        }, 2000);
        
    } else if (params.error) {
        // Erro - enviar mensagem de erro
        sendMessageToParent({
            type: 'META_ADS_OAUTH_ERROR',
            error: params.error
        });
        
        setTimeout(() => {
            if (window.opener) {
                window.close();
            }
        }, 3000);
    }
});
`;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(jsContent);
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

