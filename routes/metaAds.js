// Estrutura: 
// /api/meta/initiate.js
// /api/meta/callback.js
// /api/meta/test-token.js

// api/meta/initiate.js
import axios from 'axios';

export default function handler(req, res) {
  const { META_APP_ID, REDIRECT_URI } = process.env;
  if (!META_APP_ID || !REDIRECT_URI) {
    return res.status(500).json({ error: 'META_APP_ID ou REDIRECT_URI não configurados.' });
  }
  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=public_profile`;
  res.status(200).json({ authUrl });
}


// api/meta/callback.js
import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.query;
  const { META_APP_ID, META_APP_SECRET, REDIRECT_URI } = process.env;
  if (!code) {
    return res.redirect('/oauth-error.html');
  }
  if (!META_APP_ID || !META_APP_SECRET || !REDIRECT_URI) {
    return res.redirect('/oauth-error.html');
  }
  try {
    const { data } = await axios.get('https://graph.facebook.com/v23.0/oauth/access_token', {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }
    });
    const { access_token: accessToken } = data;
    return res.redirect(`/oauth-result.html?access_token=${encodeURIComponent(accessToken)}`);
  } catch (err) {
    console.error('Erro ao trocar código por token:', err.response?.data || err.message);
    return res.redirect('/oauth-error.html');
  }
}


// api/meta/test-token.js
import axios from 'axios';

export default async function handler(req, res) {
  const accessToken = req.query.access_token;
  const { META_APP_ID, META_APP_SECRET } = process.env;
  if (!accessToken) {
    return res.status(400).json({ error: 'Parâmetro access_token é obrigatório.' });
  }
  if (!META_APP_ID || !META_APP_SECRET) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas.' });
  }
  try {
    const { data } = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: accessToken,
        access_token: `${META_APP_ID}|${META_APP_SECRET}`
      }
    });
    res.status(200).json(data);
  } catch (err) {
    console.error('Erro no debug token:', err.response?.data || err.message);
    res.status(500).json({ error: 'Falha ao depurar token.', details: err.response?.data || err.message });
  }
}

/*
  ** public/
     oauth-result.html      ← salva access_token em localStorage e fecha popup
     oauth-error.html       ← exibe erro genérico
*/
