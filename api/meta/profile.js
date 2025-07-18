// api/meta/profile.js
const axios = require('axios');

module.exports = async (req, res) => {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { access_token } = req.query;
  
  if (!access_token) {
    return res.status(400).json({
      error: 'access_token é obrigatório',
      message: 'Forneça o access_token como parâmetro de query'
    });
  }
  
  try {
    // Buscar informações do perfil do usuário
    const response = await axios.get('https://graph.facebook.com/v23.0/me', {
      params: {
        access_token: access_token,
        fields: 'id,name,email,picture.type(large)'
      }
    });
    
    return res.status(200).json({
      success: true,
      userInfo: response.data,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil da Meta:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Falha ao buscar informações do usuário',
        message: error.response.data?.error?.message || error.message,
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};