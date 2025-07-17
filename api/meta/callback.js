// api/meta/callback.js
const axios = require('axios');

module.exports = async (req, res) => {
  const { code } = req.query;
  const { META_APP_ID, META_APP_SECRET } = process.env;
  const META_REDIRECT_URI = `${process.env.APP_URL || 'https://backend.otmizy.com'}/api/meta/callback`;

  if (!code) {
    return res.redirect('/oauth-error.html');
  }
  
  try {
    const { data } = await axios.get('https://graph.facebook.com/v23.0/oauth/access_token', {
      params: { 
        client_id: META_APP_ID, 
        client_secret: META_APP_SECRET, 
        redirect_uri: META_REDIRECT_URI, 
        code 
      }
    });
    // você pode opcionalmente persistir data.access_token em DB aqui
    return res.redirect(`/oauth-callback-meta.html?access_token=${data.access_token}`);
  } catch (err) {
    console.error('Meta OAuth callback error:', err);
    return res.redirect('/oauth-error.html');
  }
};