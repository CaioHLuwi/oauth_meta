// api/meta/campaigns.js
const axios = require('axios');

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

  try {
    // Lista campanhas usando a Graph API
    const response = await axios.get(`https://graph.facebook.com/v23.0/me/adaccounts?fields=campaigns{name,status,objective}&access_token=${accessToken}`);
    res.json({ 
      success: true, 
      campaigns: response.data,
      message: 'Campanhas obtidas com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao obter campanhas:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao obter campanhas.',
      details: error.response?.data || error.message 
    });
  }
};