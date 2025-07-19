// api/meta/campaigns.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  // Permite chamadas de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token não fornecido.' });
  }

  const accessToken = authHeader.split(' ')[1];
  
  // Obter contas selecionadas do corpo da requisição ou query params
  let selectedAccounts = [];
  
  // Verificar se é uma chamada individual com ad_account_id
  if (req.query.ad_account_id) {
    selectedAccounts = [req.query.ad_account_id];
    console.log('🔍 === ENDPOINT /api/meta/campaigns ===');
    console.log('📋 ad_account_id recebido:', req.query.ad_account_id);
    console.log('🎯 Buscando campanhas APENAS para esta conta');
  } else if (req.method === 'POST' && req.body && req.body.selectedAccounts) {
    selectedAccounts = req.body.selectedAccounts;
  } else if (req.query.selectedAccounts) {
    selectedAccounts = Array.isArray(req.query.selectedAccounts) 
      ? req.query.selectedAccounts 
      : [req.query.selectedAccounts];
  }
  
  console.log('Contas selecionadas recebidas:', selectedAccounts);

  try {
    let accountsToProcess = [];
    
    if (selectedAccounts.length > 0) {
      // Se contas específicas foram selecionadas, buscar apenas essas contas
      console.log('Filtrando por contas selecionadas:', selectedAccounts);
      
      for (const accountId of selectedAccounts) {
        try {
          const accountResponse = await axios.get(`https://graph.facebook.com/v23.0/${accountId}`, {
            params: {
              access_token: accessToken,
              fields: 'id,name,account_status,currency,timezone_name'
            }
          });
          accountsToProcess.push(accountResponse.data);
        } catch (accountError) {
          console.warn(`Erro ao buscar conta ${accountId}:`, accountError.message);
        }
      }
    } else {
      // Se nenhuma conta específica foi selecionada, buscar todas as contas
      console.log('Nenhuma conta específica selecionada, buscando todas as contas');
      const accountsResponse = await axios.get(`https://graph.facebook.com/v23.0/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status,currency,timezone_name'
        }
      });
      accountsToProcess = accountsResponse.data.data;
    }
    
    console.log(`Processando ${accountsToProcess.length} contas de anúncio`);

    const allCampaigns = [];
    
    // Para cada conta de anúncio, buscar suas campanhas
    for (const account of accountsToProcess) {
      try {
        const campaignsResponse = await axios.get(`https://graph.facebook.com/v23.0/${account.id}/campaigns`, {
          params: {
            access_token: accessToken,
            fields: [
              'id',
              'name', 
              'status',
              'objective',
              'created_time',
              'updated_time',
              'start_time',
              'stop_time',
              'daily_budget',
              'lifetime_budget',
              'budget_remaining',
              'buying_type',
              'can_use_spend_cap',
              'configured_status',
              'effective_status'
            ].join(',')
          }
        });

        // Adicionar informações da conta a cada campanha
        campaignsResponse.data.data.forEach(campaign => {
          campaign.account_info = {
            account_id: account.id,
            account_name: account.name,
            account_status: account.account_status,
            currency: account.currency,
            timezone_name: account.timezone_name
          };
          allCampaigns.push(campaign);
        });
      } catch (campaignError) {
        console.warn(`Erro ao buscar campanhas da conta ${account.id}:`, campaignError.message);
      }
    }

    console.log(`Encontradas ${allCampaigns.length} campanhas para ${accountsToProcess.length} contas`);
    
    // Log específico para chamadas individuais
    if (req.query.ad_account_id) {
      console.log('📊 Campanhas encontradas:', allCampaigns.length);
      console.log('🔍 === FIM ===');
    }
    
    res.json({ 
      success: true, 
      campaigns: allCampaigns,
      total_campaigns: allCampaigns.length,
      accounts_processed: accountsToProcess.length,
      selected_accounts: selectedAccounts,
      filtered: selectedAccounts.length > 0,
      message: selectedAccounts.length > 0 
        ? `Campanhas filtradas para ${selectedAccounts.length} conta(s) selecionada(s)` 
        : 'Todas as campanhas obtidas com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao obter campanhas:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao obter campanhas.',
      details: error.response?.data || error.message 
    });
  }
};