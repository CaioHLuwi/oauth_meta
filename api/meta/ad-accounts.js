// api/meta/ad-accounts.js
require('dotenv').config();
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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    const accessToken = authHeader.split(' ')[1];

    // Faz requisição para a Graph API para obter contas de anúncios
    const response = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status,currency,timezone_name,business'
      }
    });

    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Erro ao buscar contas de anúncios:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Token inválido ou expirado',
        details: error.response.data
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.response?.data || error.message
    });
  }
};