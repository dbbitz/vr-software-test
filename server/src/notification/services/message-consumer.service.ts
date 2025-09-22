import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";
import { StatusStorageService } from "./status-storage.service";
import { MessageStatusDto } from "../dto/notification.dto";
import { NotificationGateway } from "../gateways/notification.gateway";

@Injectable()
export class MessageConsumerService implements OnModuleInit {
  private readonly logger = new Logger(MessageConsumerService.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly statusStorageService: StatusStorageService,
    private readonly notificationGateway: NotificationGateway
  ) {}

  async onModuleInit() {
    // Aguarda a conexão RabbitMQ antes de iniciar o consumidor
    try {
      await this.rabbitMQService.waitForConnection();
      await this.startConsuming();
    } catch (error) {
      this.logger.error("Falha ao inicializar consumidor:", error);
      this.logger.error(
        "Verifique se o RabbitMQ está rodando: docker-compose up -d"
      );
    }
  }

  private async startConsuming(): Promise<void> {
    try {
      await this.rabbitMQService.consumeFromEntrada(
        this.processMessage.bind(this)
      );
    } catch (error) {
      this.logger.error("Erro ao iniciar consumidor:", error);
      throw error;
    }
  }

  private async processMessage(message: MessageStatusDto): Promise<void> {
    this.logger.log(`Processando mensagem: ${message.mensagemId}`);

    // Atualiza status para PROCESSANDO
    this.statusStorageService.setStatus(
      message.mensagemId,
      "PROCESSANDO",
      message.conteudoMensagem
    );

    // Notifica via WebSocket sobre o status PROCESSANDO
    this.notificationGateway.broadcastStatusUpdate(
      message.mensagemId,
      "PROCESSANDO"
    );

    // Simula processamento assíncrono com atraso de 1-2 segundos
    const delay = Math.floor(Math.random() * 1000) + 1000; // 1000-2000ms
    await this.sleep(delay);

    // Simula sucesso ou falha: número aleatório de 1-10
    // Se for 2 ou menos (20% chance), considera falha
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    const isSuccess = randomNumber > 2;

    const finalStatus = isSuccess
      ? "PROCESSADO_SUCESSO"
      : "FALHA_PROCESSAMENTO";

    this.logger.log(
      `Mensagem ${message.mensagemId} processada: ${finalStatus} (número: ${randomNumber})`
    );

    // Atualiza status no armazenamento
    this.statusStorageService.updateProcessingStatus(
      message.mensagemId,
      finalStatus
    );

    // Notifica via WebSocket sobre o status final
    this.notificationGateway.broadcastStatusUpdate(
      message.mensagemId,
      finalStatus
    );

    // Publica status na fila de status
    await this.rabbitMQService.publishToStatus({
      mensagemId: message.mensagemId,
      status: finalStatus,
      timestamp: new Date(),
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
