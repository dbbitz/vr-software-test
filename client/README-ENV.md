# 🔧 Configuração de Variáveis de Ambiente - Angular

Sistema simplificado para carregar variáveis de ambiente diretamente do arquivo `.env` no diretório client.

## 🚀 Como Usar

### 1. Criar arquivo .env
Copie o arquivo de exemplo e personalize:
```bash
cp env.example .env
```

### 2. Configurar variáveis
Edite o arquivo `.env` com suas configurações:
```bash
# Configurações do Backend API
NG_APP_API_URL=http://localhost:3000/api
NG_APP_WEBSOCKET_URL=http://localhost:3000/notifications

# Configurações de Ambiente
NG_APP_ENVIRONMENT=development

# Configurações de Debug
NG_APP_ENABLE_CONSOLE_LOG=true

# Configurações de Conexão WebSocket
NG_APP_WEBSOCKET_TRANSPORTS=websocket
NG_APP_WEBSOCKET_AUTO_CONNECT=true
```

### 3. Executar aplicação
```bash
npm start
```

## 📋 Variáveis Disponíveis

| Variável | Descrição | Padrão | Valores |
|----------|-----------|---------|---------|
| `NG_APP_API_URL` | URL base da API REST | `http://localhost:3000/api` | Qualquer URL válida |
| `NG_APP_WEBSOCKET_URL` | URL do WebSocket | `http://localhost:3000/notifications` | Qualquer URL WebSocket |
| `NG_APP_ENVIRONMENT` | Ambiente atual | `development` | `development`, `production` |
| `NG_APP_ENABLE_CONSOLE_LOG` | Habilitar logs no console | `true` para dev, `false` para prod | `true`, `false` |
| `NG_APP_WEBSOCKET_TRANSPORTS` | Transportes WebSocket | `websocket` | `websocket`, `polling` ou `websocket,polling` |
| `NG_APP_WEBSOCKET_AUTO_CONNECT` | Conexão automática | `true` | `true`, `false` |

## 💡 Como Funciona

1. **Script Build**: `scripts/build-env.js` lê o arquivo `.env` e gera os environment files
2. **Environment Files**: Arquivos TypeScript gerados automaticamente em `src/environments/`
3. **ConfigService**: Serviço que usa os environment files e fornece configurações tipadas
4. **Pre-hooks**: Scripts `prebuild` e `prestart` garantem que os environments estão atualizados

## 🔧 Usando no Código

### Injetar ConfigService
```typescript
import { ConfigService } from './services/config.service';

@Component({...})
export class MeuComponent {
  constructor(private config: ConfigService) {}

  exemplo() {
    // Acessar configurações
    const apiUrl = this.config.apiUrl;
    const wsUrl = this.config.websocketUrl;
    
    // Verificar ambiente
    if (this.config.isProduction) {
      // Lógica para produção
    }
  }
}
```

### Override para Testes
```typescript
// No console do navegador ou em testes
const configService = inject(ConfigService);

// Sobrescrever temporariamente
configService.updateConfig({
  apiUrl: 'http://localhost:4000/api'
});

// Resetar para valores do .env
configService.resetConfig();
```

## 🌍 Diferentes Ambientes

### Desenvolvimento
```bash
NG_APP_ENVIRONMENT=development
NG_APP_ENABLE_CONSOLE_LOG=true
NG_APP_API_URL=http://localhost:3000/api
```

### Produção
```bash
NG_APP_ENVIRONMENT=production
NG_APP_ENABLE_CONSOLE_LOG=false
NG_APP_API_URL=https://api.exemplo.com/api
```

### Staging
```bash
NG_APP_ENVIRONMENT=staging
NG_APP_ENABLE_CONSOLE_LOG=true
NG_APP_API_URL=https://api-staging.exemplo.com/api
```

## ⚠️ Importante

- **Prefixo NG_APP_**: Todas as variáveis devem começar com `NG_APP_`
- **Arquivo .env**: Deve estar no diretório `client/`
- **Reiniciar**: Após alterar `.env`, reinicie o servidor de desenvolvimento
- **Gitignore**: O arquivo `.env` está no `.gitignore` por segurança

## 🔒 Segurança

- ❌ Não commite arquivos `.env` com dados sensíveis
- ✅ Use `env.example` como template
- ✅ Configure secrets apenas no servidor/CI/CD
- ✅ Frontend deve receber apenas URLs e configurações públicas
