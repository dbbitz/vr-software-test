# 🚀 Sistema de Notificações - VR Software

Sistema fullstack para processamento de notificações em tempo real com Angular + NestJS + RabbitMQ.

## 📋 Stack

- **Frontend**: Angular 19 + Socket.IO
- **Backend**: NestJS + WebSocket + RabbitMQ
- **Mensageria**: RabbitMQ via Docker

## ⚡ Quick Start

### Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/vr-software-fullstack-test.git
cd vr-software-fullstack-test
```

### 1. Instalar dependências
```bash
# Backend
cd server && npm install

# Frontend  
cd client && npm install
```

### 2. Configurar ambiente

**Backend (.env)**:
```bash
cd server
cp .env.example .env
```

**Frontend (.env)**:
```bash
cd client  
cp .env.example .env
```

### 3. Iniciar RabbitMQ
```bash
cd server
docker-compose up -d
```

### 4. Executar aplicação
```bash
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Frontend  
cd client
npm start
```

## 🌐 URLs

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

## 🎯 Funcionalidades

- ✅ Envio de notificações via HTTP
- ✅ Processamento assíncrono com RabbitMQ  
- ✅ Atualizações em tempo real via WebSocket
- ✅ Interface responsiva e moderna
- ✅ Geração automática de UUIDs
- ✅ Indicador de status da conexão

## 🏗️ Build para Produção

### Frontend
```bash
cd client
npm run build
# Arquivos em client/dist/
```

### Backend
```bash
cd server  
npm run build
npm run start:prod
```

## 🔧 Configuração de Ambiente

### Variáveis Frontend (.env)
```bash
NG_APP_API_URL=http://localhost:3000/api
NG_APP_WEBSOCKET_URL=http://localhost:3000/notifications
NG_APP_ENVIRONMENT=development
```

### Variáveis Backend (.env)
```bash
PORT=3000
RABBITMQ_URL=amqp://localhost:5672
```

## 🐛 Troubleshooting

**WebSocket não conecta?**
- Verifique se o backend está rodando na porta 3000
- Confirme se o RabbitMQ está ativo: `docker ps`

**RabbitMQ não sobe?**  
- Verifique se a porta 5672 está livre
- Execute: `docker-compose down && docker-compose up -d`

## 📱 Como Usar

1. Acesse http://localhost:4200
2. Digite uma mensagem e clique "Enviar"
3. Acompanhe o status em tempo real:
   - **Pendente** → **Processando** → **Processado**
4. Veja o indicador de conexão WebSocket (verde = conectado)

---

**VR Software Test** - Sistema de notificações em tempo real
