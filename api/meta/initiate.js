// api/meta/initiate.js
const axios = require('axios');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  // Permite chamadas de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { META_APP_ID } = process.env;
  const META_REDIRECT_URI = `${process.env.APP_URL || 'https://backend.otmizy.com'}/api/meta/callback`;
  
  if (!META_APP_ID) {
    return res.status(500).json({ error: 'META_APP_ID não configurado no ambiente.' });
  }
  
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=ads_read,ads_management,business_management,public_profile,email`;
  
  return res.status(200).json({ authUrl });
};