// api/google/campaigns.js
const { google } = require('googleapis');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  // Permite chamadas de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token não fornecido.' });
  }

  const accessToken = authHeader.split(' ')[1];
  const refreshToken = req.headers['x-refresh-token'];

  try {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    const GOOGLE_REDIRECT_URI = `${process.env.APP_URL || 'https://backend.otmizy.com'}/api/google/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    const ads = google.ads('v14');
    const data = await ads.customers.listAccessibleCustomers({ auth: oauth2Client });
    
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    res.status(500).json({ 
      error: 'Erro ao obter campanhas.',
      details: error.message 
    });
  }
};