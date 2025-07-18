// api/google/callback.js
const { google } = require('googleapis');

module.exports = async (req, res) => {
  // Configurar headers CORS e Cross-Origin-Opener-Policy
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  const { code, error } = req.query;
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  } = process.env;
  
  const GOOGLE_REDIRECT_URI = `${process.env.APP_URL || 'https://backend.otmizy.com'}/api/google/callback`;

  // Verificar se houve erro ou cancelamento
  if (error) {
    const errorMessage = error === 'access_denied' ? 'Autenticação cancelada pelo usuário' : `Erro OAuth: ${error}`;
    return res.redirect(`/oauth-callback-google.html?error=${encodeURIComponent(errorMessage)}`);
  }
  
  if (!code) {
    return res.redirect('/oauth-callback-google.html?error=Código de autorização não encontrado');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // Buscar informações do perfil do usuário
    let userInfo = null;
    let adsAccounts = null;
    
    if (tokens.access_token) {
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });
        
        if (response.ok) {
          userInfo = await response.json();
        } else {
          console.warn('Falha ao buscar informações do usuário:', response.status);
        }
      } catch (userInfoError) {
        console.warn('Erro ao buscar informações do usuário:', userInfoError.message);
      }
      
      // Buscar contas do Google Ads acessíveis
      try {
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        });
        
        const ads = google.ads('v14');
        const accessibleCustomers = await ads.customers.listAccessibleCustomers({ 
          auth: oauth2Client 
        });
        
        adsAccounts = accessibleCustomers.data;
      } catch (adsError) {
        console.warn('Erro ao buscar contas do Google Ads:', adsError.message);
      }
    }
    
    // Preparar dados para retornar
    const authData = {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      userInfo: userInfo || null,
      adsAccounts: adsAccounts || null
    };
    
    // Codificar os dados como JSON na query string
    const qs = new URLSearchParams({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      user_data: JSON.stringify(authData)
    }).toString();

    return res.redirect(`/oauth-callback-google.html?${qs}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const errorMessage = err.message || 'Erro interno durante autenticação';
    return res.redirect(`/oauth-callback-google.html?error=${encodeURIComponent(errorMessage)}`);
  }
};