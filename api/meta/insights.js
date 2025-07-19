// api/meta/insights.js
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
  const { campaign_ids, date_preset = 'last_30d' } = req.query;
  
  // Obter contas selecionadas do corpo da requisição ou query params
  let selectedAccounts = [];
  
  // Verificar se é uma chamada individual com ad_account_id
  if (req.query.ad_account_id) {
    selectedAccounts = [req.query.ad_account_id];
    console.log('🔍 === ENDPOINT /api/meta/campaigns/insights ===');
    console.log('📋 ad_account_id recebido:', req.query.ad_account_id);
    console.log('🎯 Buscando insights APENAS para esta conta');
  } else if (req.method === 'POST' && req.body && req.body.selectedAccounts) {
    selectedAccounts = req.body.selectedAccounts;
  } else if (req.query.selectedAccounts) {
    selectedAccounts = Array.isArray(req.query.selectedAccounts) 
      ? req.query.selectedAccounts 
      : [req.query.selectedAccounts];
  }
  
  console.log('Contas selecionadas para insights:', selectedAccounts);

  try {
    let accountsToProcess = [];
    
    if (selectedAccounts.length > 0) {
      // Se contas específicas foram selecionadas, buscar apenas essas contas
      console.log('Filtrando insights por contas selecionadas:', selectedAccounts);
      
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
          console.warn(`Erro ao buscar conta ${accountId} para insights:`, accountError.message);
        }
      }
    } else {
      // Se nenhuma conta específica foi selecionada, buscar todas as contas
      console.log('Nenhuma conta específica selecionada para insights, buscando todas as contas');
      const accountsResponse = await axios.get(`https://graph.facebook.com/v23.0/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status,currency,timezone_name'
        }
      });
      accountsToProcess = accountsResponse.data.data;
    }
    
    console.log(`Processando insights para ${accountsToProcess.length} contas de anúncio`);

    const insights = [];
    
    // Para cada conta de anúncio, buscar campanhas e seus insights
    for (const account of accountsToProcess) {
      try {
        // Buscar campanhas da conta
        const campaignsResponse = await axios.get(`https://graph.facebook.com/v23.0/${account.id}/campaigns`, {
          params: {
            access_token: accessToken,
            fields: 'id,name,status,objective,created_time,updated_time,start_time,stop_time,daily_budget,lifetime_budget,budget_remaining'
          }
        });

        // Filtrar campanhas se campaign_ids foi fornecido
        let campaignsToProcess = campaignsResponse.data.data;
        if (campaign_ids) {
          const campaignIdsArray = campaign_ids.split(',');
          campaignsToProcess = campaignsResponse.data.data.filter(campaign => 
            campaignIdsArray.includes(campaign.id)
          );
          console.log(`Filtrando ${campaignsToProcess.length} campanhas específicas de ${campaignsResponse.data.data.length} total`);
        }
        
        // Para cada campanha, buscar insights detalhados
        for (const campaign of campaignsToProcess) {
          try {
            const insightsResponse = await axios.get(`https://graph.facebook.com/v23.0/${campaign.id}/insights`, {
              params: {
                access_token: accessToken,
                date_preset: date_preset,
                fields: [
                  // Métricas de Performance
                  'impressions',
                  'clicks',
                  'reach',
                  'frequency',
                  'video_views',
                  'video_view_time',
                  
                  // Métricas Financeiras
                  'spend',
                  'cpc',
                  'cpm',
                  'cpp',
                  'ctr',
                  'cost_per_unique_click',
                  
                  // Métricas de Conversão
                  'conversions',
                  'conversion_values',
                  'cost_per_conversion',
                  'conversion_rate_ranking',
                  
                  // Métricas de Engajamento
                  'post_engagements',
                  'page_likes',
                  'post_reactions',
                  'post_shares',
                  'post_comments',
                  
                  // Métricas de Link
                  'link_clicks',
                  'outbound_clicks',
                  'website_clicks',
                  
                  // Dados temporais
                  'date_start',
                  'date_stop'
                ].join(',')
              }
            });

            // Combinar dados da campanha com insights
            const campaignInsights = {
              // Dados da Campanha
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              campaign_status: campaign.status,
              campaign_objective: campaign.objective,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              start_time: campaign.start_time,
              stop_time: campaign.stop_time,
              daily_budget: campaign.daily_budget,
              lifetime_budget: campaign.lifetime_budget,
              budget_remaining: campaign.budget_remaining,
              account_id: account.id,
              account_name: account.name,
              
              // Insights (usar dados do primeiro período se existir)
              insights: insightsResponse.data.data.length > 0 ? {
                // Métricas de Performance
                impressions: parseInt(insightsResponse.data.data[0].impressions || 0),
                clicks: parseInt(insightsResponse.data.data[0].clicks || 0),
                reach: parseInt(insightsResponse.data.data[0].reach || 0),
                frequency: parseFloat(insightsResponse.data.data[0].frequency || 0),
                video_views: parseInt(insightsResponse.data.data[0].video_views || 0),
                video_view_time: parseInt(insightsResponse.data.data[0].video_view_time || 0),
                
                // Métricas Financeiras
                spend: parseFloat(insightsResponse.data.data[0].spend || 0),
                cpc: parseFloat(insightsResponse.data.data[0].cpc || 0),
                cpm: parseFloat(insightsResponse.data.data[0].cpm || 0),
                cpp: parseFloat(insightsResponse.data.data[0].cpp || 0),
                ctr: parseFloat(insightsResponse.data.data[0].ctr || 0),
                cost_per_unique_click: parseFloat(insightsResponse.data.data[0].cost_per_unique_click || 0),
                
                // Métricas de Conversão
                conversions: parseInt(insightsResponse.data.data[0].conversions || 0),
                conversion_values: parseFloat(insightsResponse.data.data[0].conversion_values || 0),
                cost_per_conversion: parseFloat(insightsResponse.data.data[0].cost_per_conversion || 0),
                conversion_rate_ranking: insightsResponse.data.data[0].conversion_rate_ranking || null,
                
                // Calcular ROAS (Return on Ad Spend)
                roas: insightsResponse.data.data[0].conversion_values && insightsResponse.data.data[0].spend 
                  ? (parseFloat(insightsResponse.data.data[0].conversion_values) / parseFloat(insightsResponse.data.data[0].spend)).toFixed(2)
                  : 0,
                
                // Métricas de Engajamento
                post_engagements: parseInt(insightsResponse.data.data[0].post_engagements || 0),
                page_likes: parseInt(insightsResponse.data.data[0].page_likes || 0),
                post_reactions: parseInt(insightsResponse.data.data[0].post_reactions || 0),
                post_shares: parseInt(insightsResponse.data.data[0].post_shares || 0),
                post_comments: parseInt(insightsResponse.data.data[0].post_comments || 0),
                
                // Métricas de Link
                link_clicks: parseInt(insightsResponse.data.data[0].link_clicks || 0),
                outbound_clicks: parseInt(insightsResponse.data.data[0].outbound_clicks || 0),
                website_clicks: parseInt(insightsResponse.data.data[0].website_clicks || 0),
                
                // Dados temporais
                date_start: insightsResponse.data.data[0].date_start,
                date_stop: insightsResponse.data.data[0].date_stop
              } : {
                // Valores padrão quando não há insights
                impressions: 0,
                clicks: 0,
                reach: 0,
                frequency: 0,
                spend: 0,
                cpc: 0,
                cpm: 0,
                ctr: 0,
                conversions: 0,
                roas: 0,
                message: 'Nenhum insight disponível para o período selecionado'
              }
            };

            insights.push(campaignInsights);
          } catch (campaignInsightError) {
            console.warn(`Erro ao buscar insights da campanha ${campaign.id}:`, campaignInsightError.message);
            
            // Adicionar campanha mesmo sem insights
            insights.push({
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              campaign_status: campaign.status,
              campaign_objective: campaign.objective,
              account_id: account.id,
              account_name: account.name,
              insights: {
                error: 'Erro ao buscar insights',
                details: campaignInsightError.response?.data || campaignInsightError.message
              }
            });
          }
        }
      } catch (campaignError) {
        console.warn(`Erro ao buscar campanhas da conta ${account.id}:`, campaignError.message);
      }
    }

    console.log(`Encontrados insights para ${insights.length} campanhas de ${accountsToProcess.length} contas`);
    
    // Log específico para chamadas individuais
    if (req.query.ad_account_id) {
      console.log('📊 Insights encontrados:', insights.length);
      console.log('🔍 === FIM ===');
    }
    
    res.json({ 
      success: true, 
      insights: insights,
      total_campaigns: insights.length,
      accounts_processed: accountsToProcess.length,
      selected_accounts: selectedAccounts,
      filtered: selectedAccounts.length > 0,
      date_preset: date_preset,
      message: selectedAccounts.length > 0 
        ? `Insights filtrados para ${selectedAccounts.length} conta(s) selecionada(s)` 
        : 'Insights de todas as campanhas obtidos com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao obter insights de campanhas:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erro ao obter insights de campanhas.',
      details: error.response?.data || error.message 
    });
  }
};