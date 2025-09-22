# Frontend Angular - Sistema de Notificações

Este é um frontend Angular moderno e responsivo que integra com a API NestJS para processamento de notificações em tempo real.

## 🚀 Funcionalidades

- ✅ Interface moderna e responsiva
- ✅ Envio de notificações via HTTP
- ✅ Comunicação WebSocket em tempo real
- ✅ Atualizações de status automáticas
- ✅ Geração automática de UUIDs
- ✅ Lista dinâmica de notificações
- ✅ Indicador de status da conexão WebSocket
- ✅ Design com UX/UI moderna

## 🛠️ Tecnologias Utilizadas

- **Angular 19** - Framework principal
- **TypeScript** - Linguagem de programação
- **SCSS** - Pré-processador CSS
- **Socket.IO Client** - Comunicação WebSocket
- **UUID** - Geração de identificadores únicos
- **RxJS** - Programação reativa

### Criar arquivo .env
Copie o arquivo de exemplo e personalize:
```bash
cp env.example .env
```

### Configurar variáveis
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

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Buildar envs

node ./scripts/build-env.js

# Executar em modo desenvolvimento
npm start

# Ou usar Angular CLI
ng serve
```

O frontend estará disponível em `http://localhost:4200`

## 🎯 Como Usar

### 1. Enviar Notificação
1. Digite sua mensagem no campo de texto
2. Clique em "Enviar Notificação"
3. A notificação aparecerá imediatamente na lista com status "Aguardando Processamento"
4. Após confirmação da API, o status mudará para "Pendente"

### 2. Acompanhar Status em Tempo Real
- O sistema se conecta automaticamente ao WebSocket do servidor
- Atualizações de status são recebidas em tempo real:
  - **Aguardando Processamento** - Mensagem sendo enviada
  - **Pendente** - Mensagem aceita pela API
  - **Processando** - Mensagem sendo processada
  - **Processado com Sucesso** - Processamento concluído
  - **Falha no Processamento** - Erro durante processamento

### 3. Indicador de Conexão
- **Verde**: Conectado ao WebSocket
- **Vermelho**: Desconectado do WebSocket

## 🏗️ Arquitetura

### Serviços

#### NotificationService
- **Responsabilidades**: Comunicação HTTP e WebSocket
- **Métodos principais**:
  - `enviarNotificacao()` - Envia notificação via HTTP
  - `getStatusUpdates()` - Observable para atualizações WebSocket
  - `consultarStatus()` - Consulta status específico
  - `consultarTodosStatus()` - Lista todos os status

### Componentes

#### NotificacaoComponent
- **Responsabilidades**: Interface do usuário e gerenciamento de estado
- **Funcionalidades**:
  - Formulário de envio de mensagens
  - Lista dinâmica de notificações
  - Gerenciamento de estado local
  - Tratamento de atualizações WebSocket

## 🎨 Design System

### Cores dos Status
- **Aguardando**: Amarelo (#ffc107)
- **Pendente**: Azul claro (#17a2b8)
- **Processando**: Azul (#007bff) com animação
- **Sucesso**: Verde (#28a745)
- **Falha**: Vermelho (#dc3545)

### Responsividade
- Design mobile-first
- Breakpoints otimizados
- Interface adaptável para diferentes tamanhos de tela

## 🔧 Configuração

### Endpoints da API
O serviço está configurado para se conectar a:
- **HTTP API**: `http://localhost:3000/api`
- **WebSocket**: `http://localhost:3000/notifications`

### Modificar URLs
Para alterar as URLs de conexão, edite o arquivo:
```typescript
// src/app/services/notification.service.ts
private readonly apiUrl = 'http://localhost:3000/api';

// No método initializeWebSocket()
this.socket = io('http://localhost:3000/notifications', {
  // ...
});
```

## 🧪 Desenvolvimento

### Estrutura de Pastas
```
src/
├── app/
│   ├── components/
│   │   └── notificacao/
│   │       ├── notificacao.component.ts
│   │       ├── notificacao.component.html
│   │       └── notificacao.component.scss
│   ├── services/
│   │   └── notification.service.ts
│   ├── app.component.*
│   └── app.config.ts
├── styles.scss
└── index.html
```



### Comandos Úteis


```bash
# Desenvolvimento
ng serve --open

# Build para produção
ng build --prod

# Testes unitários
ng test

# Linting
ng lint

# Gerar novo componente
ng generate component nome-componente

# Gerar novo serviço
ng generate service nome-servico
```

## 🐛 Solução de Problemas

### WebSocket não conecta
1. Verifique se o servidor NestJS está rodando
2. Confirme se o RabbitMQ está ativo
3. Verifique as URLs de conexão

### Notificações não aparecem
1. Verifique o console do navegador para erros
2. Confirme se a API está respondendo
3. Teste os endpoints manualmente

### Erros de CORS
Se houver problemas de CORS, verifique a configuração do servidor NestJS.

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Dispositivos**: Desktop, Tablet, Mobile
- **Resolução**: Otimizado para 320px até 1920px+

## 🤝 Integração com Backend

Este frontend foi desenvolvido para integrar perfeitamente com o backend NestJS localizado em `../server/`. Certifique-se de:

1. Iniciar o RabbitMQ: `docker-compose up -d`
2. Iniciar o servidor: `npm run start:dev`
3. Iniciar o frontend: `ng serve`

## 📄 Licença

Este projeto faz parte do teste técnico VR Software.
