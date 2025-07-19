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
    
    // Buscar informações do perfil do usuário
    let userInfo = null;
    let adAccounts = null;
    let businessManagers = null;
    let permissionErrors = [];
    
    if (data.access_token) {
      try {
        const userResponse = await axios.get('https://graph.facebook.com/v23.0/me', {
          params: {
            access_token: data.access_token,
            fields: 'id,name,email,picture.type(large)'
          }
        });
        userInfo = userResponse.data;
      } catch (userInfoError) {
        console.warn('Erro ao buscar informações do usuário Meta:', userInfoError.message);
      }
      
      // Buscar Business Managers primeiro
      try {
        const businessResponse = await axios.get('https://graph.facebook.com/v23.0/me/businesses', {
          params: {
            access_token: data.access_token,
            fields: 'id,name,verification_status,created_time'
          }
        });
        businessManagers = businessResponse.data;
        
        // Buscar contas de anúncio associadas a cada Business Manager
        if (businessManagers && businessManagers.data && businessManagers.data.length > 0) {
          const allAdAccounts = [];
          
          for (const business of businessManagers.data) {
            try {
              const bmAdAccountsResponse = await axios.get(`https://graph.facebook.com/v23.0/${business.id}/owned_ad_accounts`, {
                params: {
                  access_token: data.access_token,
                  fields: 'id,name,account_status,currency,timezone_name,business,account_id'
                }
              });
              
              // Adicionar informação do Business Manager a cada conta
              if (bmAdAccountsResponse.data && bmAdAccountsResponse.data.data) {
                bmAdAccountsResponse.data.data.forEach(account => {
                  account.business_manager = {
                    id: business.id,
                    name: business.name,
                    verification_status: business.verification_status
                  };
                  allAdAccounts.push(account);
                });
              }
            } catch (bmAdAccountError) {
              console.warn(`Erro ao buscar contas do BM ${business.id}:`, bmAdAccountError.message);
            }
          }
          
          adAccounts = { data: allAdAccounts };
        }
      } catch (businessError) {
        console.warn('Erro ao buscar Business Managers Meta:', businessError.message);
        if (businessError.response?.data?.error) {
          permissionErrors.push({
            type: 'business_managers',
            error: businessError.response.data.error,
            required_permissions: ['business_management'],
            message: 'Para acessar Business Managers, é necessária a permissão: business_management'
          });
        }
      }
      
      // Fallback: buscar contas de anúncio diretamente se não conseguiu via BM
      if (!adAccounts || !adAccounts.data || adAccounts.data.length === 0) {
        try {
          const adAccountsResponse = await axios.get('https://graph.facebook.com/v23.0/me/adaccounts', {
            params: {
              access_token: data.access_token,
              fields: 'id,name,account_status,currency,timezone_name,business,account_id'
            }
          });
          adAccounts = adAccountsResponse.data;
        } catch (adAccountsError) {
          console.warn('Erro ao buscar contas de anúncio Meta:', adAccountsError.message);
          if (adAccountsError.response?.data?.error) {
            permissionErrors.push({
              type: 'ad_accounts',
              error: adAccountsError.response.data.error,
              required_permissions: ['ads_read', 'ads_management'],
              message: 'Para acessar contas de anúncio, são necessárias as permissões: ads_read, ads_management'
            });
          }
        }
      }
    }
    
    // Preparar dados para retornar
    const authData = {
      access_token: data.access_token || '',
      userInfo: userInfo || null,
      adAccounts: adAccounts || null,
      businessManagers: businessManagers || null,
      permissionErrors: permissionErrors.length > 0 ? permissionErrors : null
    };
    
    // Codificar os dados como JSON na query string
    const qs = new URLSearchParams({
      access_token: data.access_token || '',
      user_data: JSON.stringify(authData)
    }).toString();
    
    return res.redirect(`/oauth-callback-meta.html?${qs}`);
  } catch (err) {
    console.error('Meta OAuth callback error:', err);
    return res.redirect('/oauth-error.html');
  }
};