// api/google/profile.js
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
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Falha ao buscar informações do usuário',
        message: errorText,
        status: response.status
      });
    }
    
    const userInfo = await response.json();
    
    return res.status(200).json({
      success: true,
      userInfo,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil do Google:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};