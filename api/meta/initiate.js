// api/meta/initiate.js
import axios from 'axios';

export default function handler(req, res) {
  const { META_APP_ID, META_REDIRECT_URI } = process.env;
  if (!META_APP_ID || !META_REDIRECT_URI) {
    return res.status(500).json({ error: 'Faltando META_APP_ID ou META_REDIRECT_URI' });
  }
  const url = `https://www.facebook.com/v23.0/dialog/oauth`
    + `?client_id=${META_APP_ID}`
    + `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}`
    + `&scope=ads_read,ads_management`;
  return res.status(200).json({ authUrl: url });
}