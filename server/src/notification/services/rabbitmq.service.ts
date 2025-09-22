import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import * as amqp from "amqplib";
import { MessageStatusDto, StatusUpdateDto } from "../dto/notification.dto";

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private isConnected = false;

  // Usando "daniel" como nome - substitua pelo seu nome
  private readonly NOME = "daniel";
  private readonly QUEUE_ENTRADA = `fila.notificacao.entrada.${this.NOME}`;
  private readonly QUEUE_STATUS = `fila.notificacao.status.${this.NOME}`;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      // URLs para teste
      const cloudAMQPUrls = [
        "amqp://bjnuffmq:gj-YQIiEXyfxQxjsZtiYDKeXIT8ppUq7@jaragua-01.lmq.cloudamqp.com/bjnuffmq",
        "amqp://bjnuffmq:gj-YQIiEXyfxQxjsZtiYDKeXIT8ppUq7@jaragua-01.lmq.cloudamqp.com",
        "amqps://bjnuffmq:gj-YQIiEXyfxQxjsZtiYDKeXIT8ppUq7@jaragua-01.lmq.cloudamqp.com/bjnuffmq",
      ];
      const localUrl = "amqp://admin:admin123@localhost:5672";

      let connectionUrl = process.env.RABBITMQ_URL;
      let isCloudAMQP = true;
      let connected = false;

      // Se não há variável de ambiente, tenta CloudAMQP primeiro
      if (!connectionUrl) {
        for (const url of cloudAMQPUrls) {
          try {
            this.logger.log(
              `Tentando conectar ao CloudAMQP: ${url.replace(/:[^:@]*@/, ":***@")}`
            );

            const connectionOptions = {
              heartbeat: 60,
              connectionTimeout: 10000,
            };

            this.connection = await amqp.connect(url, connectionOptions);
            connectionUrl = url;
            connected = true;
            this.logger.log("Conectado ao CloudAMQP com sucesso");
            break;
          } catch (cloudError) {
            this.logger.warn(
              `Falha com URL ${url.replace(/:[^:@]*@/, ":***@")}: ${cloudError.message}`
            );
          }
        }
      } else {
        // Usa a variável de ambiente
        try {
          const connectionOptions = {
            heartbeat: 60,
            connectionTimeout: 10000,
          };

          this.connection = await amqp.connect(
            connectionUrl,
            connectionOptions
          );
          connected = true;
          this.logger.log("Conectado usando variável de ambiente");
        } catch (envError) {
          this.logger.warn(
            `Falha com variável de ambiente: ${envError.message}`
          );
        }
      }

      if (!connected) {
        // Tenta RabbitMQ local como fallback
        this.logger.warn(
          "Falha ao conectar ao CloudAMQP, tentando RabbitMQ local..."
        );
        isCloudAMQP = false;
        connectionUrl = localUrl;

        this.connection = await amqp.connect(connectionUrl);
        this.logger.log("Conectado ao RabbitMQ local com sucesso");
      }

      this.channel = await this.connection.createChannel();

      // Declara as filas
      await this.channel.assertQueue(this.QUEUE_ENTRADA, { durable: true });
      await this.channel.assertQueue(this.QUEUE_STATUS, { durable: true });

      this.isConnected = true;
      this.logger.log(
        `Filas criadas: ${this.QUEUE_ENTRADA}, ${this.QUEUE_STATUS}`
      );

      if (isCloudAMQP) {
        this.logger.log(
          "URL de gerenciamento: https://jaragua-01.lmq.cloudamqp.com"
        );
      } else {
        this.logger.log(
          "URL de gerenciamento local: http://localhost:15672 (admin/admin123)"
        );
      }
    } catch (error) {
      this.isConnected = false;
      this.logger.error("Erro ao conectar com RabbitMQ:", error);
      this.logger.error("Tentativas:");
      this.logger.error(
        "1. CloudAMQP: https://jaragua-01.lmq.cloudamqp.com (bjnuffmq)"
      );
      this.logger.error("2. Local: http://localhost:15672 (admin/admin123)");
      this.logger.error("Execute: docker-compose up -d");
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.logger.log("Desconectado do RabbitMQ");
    } catch (error) {
      this.logger.error("Erro ao desconectar do RabbitMQ:", error);
    }
  }

  async publishToEntrada(message: MessageStatusDto): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error(
        "RabbitMQ não está conectado. Verifique se o serviço está rodando."
      );
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.sendToQueue(this.QUEUE_ENTRADA, messageBuffer, {
        persistent: true,
      });
      this.logger.log(
        `Mensagem publicada na fila de entrada: ${message.mensagemId}`
      );
    } catch (error) {
      this.logger.error("Erro ao publicar mensagem na fila de entrada:", error);
      throw error;
    }
  }

  async publishToStatus(statusUpdate: StatusUpdateDto): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error(
        "RabbitMQ não está conectado. Verifique se o serviço está rodando."
      );
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(statusUpdate));
      await this.channel.sendToQueue(this.QUEUE_STATUS, messageBuffer, {
        persistent: true,
      });
      this.logger.log(
        `Status publicado: ${statusUpdate.mensagemId} - ${statusUpdate.status}`
      );
    } catch (error) {
      this.logger.error("Erro ao publicar status:", error);
      throw error;
    }
  }

  async consumeFromEntrada(
    callback: (message: MessageStatusDto) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error(
        "RabbitMQ não está conectado. Verifique se o serviço está rodando."
      );
    }

    try {
      await this.channel.consume(this.QUEUE_ENTRADA, async (msg) => {
        if (msg) {
          try {
            const messageContent = JSON.parse(
              msg.content.toString()
            ) as MessageStatusDto;
            await callback(messageContent);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(
              "Erro ao processar mensagem da fila de entrada:",
              error
            );
            this.channel.nack(msg, false, false); // Rejeita a mensagem
          }
        }
      });
      this.logger.log("Consumidor da fila de entrada iniciado");
    } catch (error) {
      this.logger.error(
        "Erro ao iniciar consumidor da fila de entrada:",
        error
      );
      throw error;
    }
  }

  getQueueNames(): { entrada: string; status: string } {
    return {
      entrada: this.QUEUE_ENTRADA,
      status: this.QUEUE_STATUS,
    };
  }

  isRabbitMQConnected(): boolean {
    return this.isConnected && !!this.channel;
  }

  async waitForConnection(maxRetries = 10, delay = 1000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      if (this.isRabbitMQConnected()) {
        return;
      }
      this.logger.log(
        `Aguardando conexão RabbitMQ... tentativa ${i + 1}/${maxRetries}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Timeout aguardando conexão RabbitMQ");
  }
}
