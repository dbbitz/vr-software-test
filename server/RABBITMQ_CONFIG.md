# Configuração RabbitMQ

## Estratégia de Conexão

O serviço RabbitMQ foi configurado com uma estratégia de fallback inteligente:

### 1. **CloudAMQP (Prioritário)**
- **Host:** jaragua-01.lmq.cloudamqp.com
- **Usuário:** bjnuffmq
- **Senha:** gj-YQIiEXyfxQxjsZtiYDKeXIT8ppUq7
- **Interface de Gerenciamento:** https://jaragua-01.lmq.cloudamqp.com

### 2. **RabbitMQ Local (Fallback)**
- **Host:** localhost:5672
- **Usuário:** admin
- **Senha:** admin123
- **Interface de Gerenciamento:** http://localhost:15672

## Como Funciona

1. **Primeira tentativa:** Tenta conectar ao CloudAMQP com diferentes formatos de URL:
   - `amqp://bjnuffmq:***@jaragua-01.lmq.cloudamqp.com/bjnuffmq` (com vhost)
   - `amqp://bjnuffmq:***@jaragua-01.lmq.cloudamqp.com` (sem vhost)
   - `amqps://bjnuffmq:***@jaragua-01.lmq.cloudamqp.com/bjnuffmq` (SSL)

2. **Segunda tentativa:** Se CloudAMQP falhar, conecta ao RabbitMQ local

3. **Configurações aplicadas:**
   - Heartbeat: 60 segundos
   - Timeout de conexão: 10 segundos
   - Filas duráveis

## Variáveis de Ambiente (Opcional)

Você pode sobrescrever a URL de conexão definindo:

```bash
RABBITMQ_URL=amqp://bjnuffmq:gj-YQIiEXyfxQxjsZtiYDKeXIT8ppUq7@jaragua-01.lmq.cloudamqp.com
```

## Executando RabbitMQ Local

Se precisar usar o RabbitMQ local:

```bash
docker-compose up -d
```

## Filas Criadas

- `fila.notificacao.entrada.daniel`
- `fila.notificacao.status.daniel`

## Logs de Conexão

O serviço registra detalhadamente as tentativas de conexão, facilitando o diagnóstico de problemas.
