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
      // Conecta ao RabbitMQ com credenciais do Docker Compose
      this.connection = await amqp.connect(
        `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`
      );
      this.channel = await this.connection.createChannel();

      // Declara as filas
      await this.channel.assertQueue(this.QUEUE_ENTRADA, { durable: true });
      await this.channel.assertQueue(this.QUEUE_STATUS, { durable: true });

      this.isConnected = true;
      this.logger.log("Conectado ao RabbitMQ com sucesso");
      this.logger.log(
        `Filas criadas: ${this.QUEUE_ENTRADA}, ${this.QUEUE_STATUS}`
      );
    } catch (error) {
      this.isConnected = false;
      this.logger.error("Erro ao conectar com RabbitMQ:", error);
      this.logger.error(
        "Certifique-se de que o RabbitMQ está rodando em localhost:5672"
      );
      this.logger.error("Execute: docker-compose up -d");
      this.logger.error(
        "Aguarde alguns segundos para o RabbitMQ inicializar completamente"
      );
      this.logger.error("Credenciais: admin/admin123");
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
