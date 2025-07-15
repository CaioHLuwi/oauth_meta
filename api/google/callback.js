// api/google/callback.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { code } = req.query;
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  } = process.env;

  if (!code) {
    return res.redirect('/oauth-error.html');
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    // você pode persistir tokens em banco aqui, se quiser
    // vamos devolver para o front via query string
    const qs = new URLSearchParams({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || ''
    }).toString();

    return res.redirect(`/oauth-callback-google.html?${qs}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect('/oauth-error.html');
  }
}