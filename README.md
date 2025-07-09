# Meta Ads Backend API

Backend em Node.js/Express para integração com a Meta Ads API (Facebook Ads).

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação
```bash
npm install
```

### Configuração
1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env` (opcional)

### Execução
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📋 Endpoints Disponíveis

### Health Check
- **GET** `/health` - Verificar se a API está funcionando

### Meta Ads API

#### Autenticação
Todos os endpoints requerem um Access Token do Meta Ads no header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### Endpoints

1. **GET** `/api/meta-ads/test-token`
   - Testa se o access token é válido
   - Retorna informações do usuário

2. **GET** `/api/meta-ads/ad-accounts`
   - Lista todas as contas de anúncio do usuário
   - Retorna: id, name, account_status, currency, timezone_name, business_name

3. **GET** `/api/meta-ads/campaigns?ad_account_id=ACT_123456789`
   - Lista campanhas de uma conta específica
   - Parâmetros:
     - `ad_account_id` (obrigatório): ID da conta de anúncio
   - Retorna: id, name, status, objective, budgets, etc.

4. **GET** `/api/meta-ads/campaigns/insights?ad_account_id=ACT_123456789&date_preset=last_30_days`
   - Busca insights (métricas) das campanhas
   - Parâmetros:
     - `ad_account_id` (obrigatório): ID da conta de anúncio
     - `campaign_ids` (opcional): IDs específicos de campanhas (separados por vírgula)
     - `date_preset` (opcional): Período dos dados (padrão: last_30_days)
   - Retorna: spend, impressions, clicks, cpc, cpm, ctr, conversions, etc.

5. **GET** `/api/meta-ads/campaigns/combined?ad_account_id=ACT_123456789`
   - Busca campanhas com insights combinados (mais eficiente)
   - Parâmetros:
     - `ad_account_id` (obrigatório): ID da conta de anúncio
     - `date_preset` (opcional): Período dos dados (padrão: last_30_days)
   - Retorna: dados da campanha + métricas de performance

## 🔑 Como Obter Access Token

### Método 1: Graph API Explorer (Desenvolvimento)
1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione seu app
3. Adicione as permissões: `ads_read` e/ou `ads_management`
4. Clique em "Generate Access Token"
5. Estenda o token para longa duração se necessário

### Método 2: Fluxo OAuth (Produção)
Para produção, implemente o fluxo OAuth completo para obter tokens dos usuários.

## 📊 Exemplo de Uso

### JavaScript/Fetch
```javascript
const accessToken = 'YOUR_ACCESS_TOKEN';
const adAccountId = 'act_123456789';

// Buscar campanhas com insights
fetch(`http://localhost:5000/api/meta-ads/campaigns/combined?ad_account_id=${adAccountId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('Campanhas:', data.campaigns);
})
.catch(error => {
  console.error('Erro:', error);
});
```

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/meta-ads',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Buscar campanhas
const campaigns = await api.get('/campaigns/combined', {
  params: { ad_account_id: 'act_123456789' }
});
```

## 🛠️ Estrutura do Projeto

```
meta-ads-backend/
├── server.js              # Servidor principal
├── routes/
│   └── metaAds.js         # Rotas da Meta Ads API
├── package.json
├── .env.example
└── README.md
```

## 🔒 Segurança

- Access tokens são validados em cada requisição
- CORS configurado para permitir requisições do frontend
- Headers de segurança configurados com Helmet
- Logs de requisições com Morgan

## 📝 Notas Importantes

1. **Rate Limits**: A Meta Ads API tem limites de taxa. Implemente cache se necessário.
2. **Permissões**: Certifique-se de ter as permissões corretas (`ads_read`, `ads_management`).
3. **Tokens**: Access tokens podem expirar. Implemente renovação automática.
4. **Erros**: Todos os endpoints retornam erros estruturados em JSON.

## 🐛 Troubleshooting

### Erro 401 - Unauthorized
- Verifique se o access token está correto
- Confirme se o token tem as permissões necessárias

### Erro 400 - Bad Request
- Verifique se o `ad_account_id` está correto
- Confirme se o ID da conta tem o prefixo `act_`

### Erro 403 - Forbidden
- Verifique se você tem acesso à conta de anúncio
- Confirme se o app tem as permissões necessárias

