# OAuth Meta Backend - Serverless

Backend serverless para autenticação OAuth com Google Ads e Meta Ads, otimizado para deploy no Vercel.

## 🚀 Funcionalidades

- **Google Ads OAuth**: Autenticação e acesso às APIs do Google Ads
- **Meta Ads OAuth**: Autenticação e acesso às APIs do Meta (Facebook) Ads
- **Serverless Functions**: Arquitetura otimizada para Vercel
- **CORS Habilitado**: Permite chamadas de qualquer origem
- **Health Check**: Endpoint para verificação de status

## 📁 Estrutura do Projeto

```
api/
├── google/
│   ├── initiate.js      # Inicia OAuth do Google
│   ├── callback.js      # Callback do Google OAuth
│   └── campaigns.js     # Lista campanhas do Google Ads
├── meta/
│   ├── initiate.js      # Inicia OAuth do Meta
│   ├── callback.js      # Callback do Meta OAuth
│   ├── campaigns.js     # Lista campanhas do Meta Ads
│   └── test-token.js    # Testa token do Meta
└── health.js            # Health check
```

## 🔧 Configuração

1. **Clone o repositório**
2. **Configure as variáveis de ambiente** (copie `.env.example` para `.env`)
3. **Instale as dependências**: `npm install`
4. **Execute em desenvolvimento**: `npm run dev`
5. **Deploy para produção**: `npm run deploy`

## 🌐 Endpoints

Todas as rotas seguem o padrão `/api/auth/...`:

### Google Ads
- `GET /api/auth/google` - Inicia OAuth do Google
- `GET /api/auth/google/callback` - Callback do Google
- `GET /api/auth/google/campaigns` - Lista campanhas (requer Bearer token)

### Meta Ads
- `GET /api/auth/meta` - Inicia OAuth do Meta
- `GET /api/auth/meta/callback` - Callback do Meta
- `GET /api/auth/meta/campaigns` - Lista campanhas (requer Bearer token)
- `GET /api/auth/meta/test-token` - Testa token (requer Bearer token)

### Geral
- `GET /api/auth/health` - Health check

## 🔑 Variáveis de Ambiente

```env
# Google Ads
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Meta Ads
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# URL base
APP_URL=https://backend.otmizy.com
```

## 🚀 Deploy

O projeto está configurado para deploy automático no Vercel:

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no dashboard do Vercel
3. O deploy será automático a cada push

## 📝 Notas Técnicas

- **Runtime**: Node.js 18+
- **Arquitetura**: Serverless Functions
- **CORS**: Habilitado para todas as origens
- **Autenticação**: Bearer tokens nos headers
- **Formato**: CommonJS (require/module.exports)

## 🔒 Segurança

- Tokens são validados em cada requisição
- Variáveis sensíveis devem estar no ambiente
- HTTPS obrigatório em produção
- CORS configurado adequadamente