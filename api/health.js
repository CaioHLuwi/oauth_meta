// api/health.js
module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  // Permite chamadas de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend is healthy',
    timestamp: new Date().toISOString()
  });
};