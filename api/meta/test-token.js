// api/meta/test-token.js
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
};