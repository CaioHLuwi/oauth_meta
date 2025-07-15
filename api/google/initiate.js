// api/google/initiate.js
import { google } from 'googleapis';

export default function handler(req, res) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return res
      .status(500)
      .json({ error: 'GOOGLE_CLIENT_ID ou GOOGLE_REDIRECT_URI não configurados.' });
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent'
  });

  // Voltamos só a URL para o front disparar o redirect
  res.status(200).json({ authUrl });
}