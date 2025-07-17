const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
const app = express();

// Carrega variáveis de ambiente do .env
require('dotenv').config();

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para sessão (se necessário)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Para desenvolvimento
}));

// Servir arquivos estáticos da pasta public
app.use(express.static('public'));

// Configurações Google Ads
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || 'https://backend.otmizy.com'}/oauth-callback-google.html`
);

// Configurações Meta Ads
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://backend.otmizy.com/oauth-callback.html';

// ===== ROTAS GOOGLE ADS =====

// Inicia o fluxo OAuth do Google
app.get('/api/auth/google', (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/adwords']
  });
  res.redirect(url);
});

// Callback do Google OAuth
app.get('/api/auth/google/callback', async (req, res, next) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    // Armazena tokens em sessão
    req.session.googleTokens = tokens;
    res.redirect('/oauth-callback-google.html');
  } catch (e) {
    next(e);
  }
});

// Listar campanhas do Google Ads
app.get('/api/auth/google/campaigns', async (req, res, next) => {
  try {
    oauth2Client.setCredentials(req.session.googleTokens);
    const ads = google.ads('v14');
    const data = await ads.customers.listAccessibleCustomers({ auth: oauth2Client });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// ===== ROTAS META ADS =====

// Inicia o fluxo OAuth do Meta
app.get('/api/auth/meta', (req, res) => {
  if (!META_APP_ID) {
    return res.status(500).json({ error: 'META_APP_ID não configurado no ambiente.' });
  }
  
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
  res.json({ authUrl });
});

// Callback do Meta OAuth
app.get('/oauth-callback.html', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  const error_description = req.query.error_description;

  // Se há erro, redirecionar para página de erro
  if (error) {
    return res.redirect(`/oauth-result.html?error=${encodeURIComponent(error_description || error)}`);
  }

  // Se não há código, erro
  if (!code) {
    return res.redirect(`/oauth-result.html?error=${encodeURIComponent('Código de autorização não recebido')}`);
  }

  // Verificar variáveis de ambiente
  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.redirect(`/oauth-result.html?error=${encodeURIComponent('Variáveis de ambiente não configuradas')}`);
  }

  try {
    // Trocar código por access token
    const tokenExchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`;
    const response = await axios.get(tokenExchangeUrl);
    const accessToken = response.data.access_token;

    // Redirecionar para página de sucesso com access token
    res.redirect(`/oauth-result.html?access_token=${encodeURIComponent(accessToken)}&code=${encodeURIComponent(code)}`);

  } catch (error) {
    console.error('Erro ao trocar código por token:', error.response?.data || error.message);
    res.redirect(`/oauth-result.html?error=${encodeURIComponent('Erro ao obter access token')}`);
  }
});

// Página de resultado do OAuth do Meta
app.get('/oauth-result.html', (req, res) => {
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
    
    <script>
        // Usar localStorage para comunicação (não depende de window.opener)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const error = urlParams.get('error');
        
        if (accessToken) {
            // Salvar resultado no localStorage
            const oauthResult = {
                type: 'META_ADS_OAUTH_SUCCESS',
                accessToken: accessToken,
                code: urlParams.get('code'),
                timestamp: Date.now()
            };
            
            localStorage.setItem('meta_ads_oauth_result', JSON.stringify(oauthResult));
            console.log('Access token salvo no localStorage:', accessToken.substring(0, 20) + '...');
            
            // Fechar popup após 2 segundos
            setTimeout(() => {
                window.close();
            }, 2000);
            
        } else if (error) {
            // Salvar erro no localStorage
            const oauthResult = {
                type: 'META_ADS_OAUTH_ERROR',
                error: error,
                timestamp: Date.now()
            };
            
            localStorage.setItem('meta_ads_oauth_result', JSON.stringify(oauthResult));
            console.log('Erro salvo no localStorage:', error);
            
            // Fechar popup após 3 segundos
            setTimeout(() => {
                window.close();
            }, 3000);
        }
    </script>
</body>
</html>`;

  res.send(htmlContent);
});

// Testar access token do Meta
app.get('/api/auth/meta/test-token', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token não fornecido.' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    // Testa o token com a Graph API básica
    const response = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
    res.json({ 
      success: true, 
      user: response.data,
      message: 'Token válido!' 
    });
  } catch (error) {
    console.error('Erro ao validar token:', error.response?.data || error.message);
    res.status(401).json({ 
      error: 'Token inválido ou expirado.',
      details: error.response?.data || error.message 
    });
  }
});

// ===== ROTAS GERAIS =====

// Rota de saúde
app.get('/api/auth/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Para Vercel, exportar o app
module.exports = app;

// Para execução local
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}