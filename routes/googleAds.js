const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/oauth-callback-google.html`
);

// 1) Inicia o fluxo
router.get('/auth/google', (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/adwords']
  });
  res.redirect(url);
});

// 2) Callback (HTML em public/ fecha o popup e dá postMessage)
router.get('/auth/google/callback', async (req, res, next) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    // armazene tokens em sessão / banco
    req.session.googleTokens = tokens;
    res.redirect('/oauth-callback-google.html');
  } catch (e) {
    next(e);
  }
});

// 3) Exemplo endpoint para listar campanhas
router.get('/api/google/campaigns', async (req, res, next) => {
  try {
    oauth2Client.setCredentials(req.session.googleTokens);
    const ads = google.ads('v14');
    const data = await ads.customers.listAccessibleCustomers({ auth: oauth2Client });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
