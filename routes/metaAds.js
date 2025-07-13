const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = process.env.META_APP_ID;
const CLIENT_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.META_REDIRECT_URI;

router.get('/oauth/initiate', (req, res) => {
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=ads_management,ads_read,read_insights,business_management`;
    res.json({ authUrl });
});

router.get('/oauth-callback.html', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Autenticação Cancelada</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8d7da; color: #721c24; text-align: center; }
                    .container { padding: 20px; border-radius: 8px; background-color: #f8d7da; border: 1px solid #f5c6cb; }
                    h1 { color: #721c24; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Autenticação Cancelada pelo Usuário</h1>
                    <p>Você cancelou o processo de autenticação ou ocorreu um erro.</p>
                </div>
                <script>
                    localStorage.setItem('metaAdsOAuthResult', JSON.stringify({ error: 'Autenticação cancelada pelo usuário' }));
                    window.close();
                </script>
            </body>
            </html>
        `);
    }

    try {
        const { data } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
            },
        });

        const accessToken = data.access_token;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Autenticação Concluída</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #d4edda; color: #155724; text-align: center; }
                    .container { padding: 20px; border-radius: 8px; background-color: #d4edda; border: 1px solid #c3e6cb; }
                    h1 { color: #155724; }
                    .token { background-color: #e2f0d9; padding: 10px; border-radius: 5px; word-break: break-all; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Autenticação Concluída com Sucesso!</h1>
                    <p>Seu access token:</p>
                    <div class="token">${accessToken}</div>
                    <p>Você pode fechar esta janela.</p>
                </div>
                <script>
                    localStorage.setItem('metaAdsOAuthResult', JSON.stringify({ accessToken: '${accessToken}' }));
                    setTimeout(() => {
                        window.close();
                    }, 500); // Adiciona um pequeno atraso antes de fechar
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Erro ao obter access token:', error.response ? error.response.data : error.message);
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Erro de Autenticação</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8d7da; color: #721c24; text-align: center; }
                    .container { padding: 20px; border-radius: 8px; background-color: #f8d7da; border: 1px solid #f5c6cb; }
                    h1 { color: #721c24; }
                    .error-message { background-color: #f5c6cb; padding: 10px; border-radius: 5px; word-break: break-all; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Erro ao obter access token</h1>
                    <p>Ocorreu um erro durante o processo de autenticação:</p>
                    <div class="error-message">${errorMessage}</div>
                </div>
                <script>
                    localStorage.setItem('metaAdsOAuthResult', JSON.stringify({ error: 'Erro ao obter access token: ${errorMessage}' }));
                    window.close();
                </script>
            </body>
            </html>
        `);
    }
});

module.exports = router;


