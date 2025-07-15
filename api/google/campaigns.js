// api/google/campaigns.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Espera receber o token no header Authorization: Bearer <token>
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const accessToken = match[1];

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  try {
    // Exemplo: listar clientes acessíveis
    const ads = google.ads('v14');
    const { data } = await ads.customers.listAccessibleCustomers({
      auth: oauth2Client
    });
    // Retorne o JSON completo ou filtre o que precisar
    res.status(200).json(data);
  } catch (err) {
    console.error('Erro ao buscar campanhas Google:', err);
    res.status(500).json({
      error: 'Não foi possível obter dados de campanha',
      message: err.message
    });
  }
}