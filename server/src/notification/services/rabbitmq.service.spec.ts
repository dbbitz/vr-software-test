import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";
import { MessageStatusDto, StatusUpdateDto } from "../dto/notification.dto";
import * as amqp from "amqplib";

// Mock completo da biblioteca amqplib
jest.mock("amqplib");

describe("RabbitMQService", () => {
  let service: RabbitMQService;
  let mockConnection: jest.Mocked<amqp.Connection>;
  let mockChannel: jest.Mocked<amqp.Channel>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Configuração dos mocks
    mockChannel = {
      sendToQueue: jest.fn().mockResolvedValue(true),
      assertQueue: jest.fn().mockResolvedValue({
        queue: "test-queue",
        messageCount: 0,
        consumerCount: 0,
      }),
      consume: jest.fn().mockResolvedValue({ consumerTag: "test-consumer" }),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock da função connect do amqplib
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    // Mock das variáveis de ambiente
    process.env.RABBITMQ_USER = "admin";
    process.env.RABBITMQ_PASS = "admin123";
    process.env.RABBITMQ_HOST = "localhost";
    process.env.RABBITMQ_PORT = "5672";

    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQService],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);

    // Mock do logger para evitar logs nos testes
    loggerSpy = jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "error").mockImplementation();

    // Inicializar o serviço (simula onModuleInit)
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
  });

  describe("publishToEntrada", () => {
    it("deve publicar uma mensagem na fila de entrada com sucesso", async () => {
      // Arrange
      const messageDto: MessageStatusDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        conteudoMensagem: "Esta é uma mensagem de teste para processamento",
        timestamp: new Date(),
      };

      const expectedBuffer = Buffer.from(JSON.stringify(messageDto));
      const expectedQueueName = "fila.notificacao.entrada.daniel";

      // Act
      await service.publishToEntrada(messageDto);

      // Assert
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expectedQueueName,
        expectedBuffer,
        { persistent: true }
      );
    });

    it("deve lançar erro quando RabbitMQ não estiver conectado", async () => {
      // Arrange
      const messageDto: MessageStatusDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        conteudoMensagem: "Mensagem de teste",
      };

      // Simular desconexão
      await service.onModuleDestroy();

      // Act & Assert
      await expect(service.publishToEntrada(messageDto)).rejects.toThrow(
        "RabbitMQ não está conectado. Verifique se o serviço está rodando."
      );
    });

    it("deve propagar erro quando sendToQueue falhar", async () => {
      // Arrange
      const messageDto: MessageStatusDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        conteudoMensagem: "Mensagem de teste",
      };

      const error = new Error("Erro de conexão");
      mockChannel.sendToQueue.mockRejectedValue(error);

      // Act & Assert
      await expect(service.publishToEntrada(messageDto)).rejects.toThrow(
        "Erro de conexão"
      );
    });
  });

  describe("publishToStatus", () => {
    it("deve publicar um status na fila de status com sucesso", async () => {
      // Arrange
      const statusDto: StatusUpdateDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        status: "PROCESSADO_SUCESSO",
        timestamp: new Date(),
      };

      const expectedBuffer = Buffer.from(JSON.stringify(statusDto));
      const expectedQueueName = "fila.notificacao.status.daniel";

      // Act
      await service.publishToStatus(statusDto);

      // Assert
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expectedQueueName,
        expectedBuffer,
        { persistent: true }
      );
    });

    it("deve publicar status de falha corretamente", async () => {
      // Arrange
      const statusDto: StatusUpdateDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        status: "FALHA_PROCESSAMENTO",
        timestamp: new Date(),
      };

      const expectedBuffer = Buffer.from(JSON.stringify(statusDto));
      const expectedQueueName = "fila.notificacao.status.daniel";

      // Act
      await service.publishToStatus(statusDto);

      // Assert
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expectedQueueName,
        expectedBuffer,
        { persistent: true }
      );
    });

    it("deve lançar erro quando RabbitMQ não estiver conectado", async () => {
      // Arrange
      const statusDto: StatusUpdateDto = {
        mensagemId: "550e8400-e29b-41d4-a716-446655440000",
        status: "PROCESSADO_SUCESSO",
        timestamp: new Date(),
      };

      // Simular desconexão
      await service.onModuleDestroy();

      // Act & Assert
      await expect(service.publishToStatus(statusDto)).rejects.toThrow(
        "RabbitMQ não está conectado. Verifique se o serviço está rodando."
      );
    });
  });

  describe("Conexão e inicialização", () => {
    it("deve conectar ao RabbitMQ na inicialização", () => {
      // Assert
      expect(amqp.connect).toHaveBeenCalledWith(
        "amqp://admin:admin123@localhost:5672"
      );
      expect(mockConnection.createChannel).toHaveBeenCalledTimes(1);
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        "fila.notificacao.entrada.daniel",
        { durable: true }
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        "fila.notificacao.status.daniel",
        { durable: true }
      );
    });

    it("deve retornar os nomes das filas corretamente", () => {
      // Act
      const queueNames = service.getQueueNames();

      // Assert
      expect(queueNames).toEqual({
        entrada: "fila.notificacao.entrada.daniel",
        status: "fila.notificacao.status.daniel",
      });
    });

    it("deve verificar se está conectado corretamente", () => {
      // Act & Assert
      expect(service.isRabbitMQConnected()).toBe(true);
    });
  });

  describe("Tratamento de erros de conexão", () => {
    it("deve tratar erro de conexão na inicialização", async () => {
      // Arrange
      const connectionError = new Error("Falha na conexão");
      (amqp.connect as jest.Mock).mockRejectedValue(connectionError);

      const newService = new RabbitMQService();

      // Act & Assert
      await expect(newService.onModuleInit()).rejects.toThrow(
        "Falha na conexão"
      );
    });

    it("deve desconectar corretamente quando destruído", async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockChannel.close).toHaveBeenCalledTimes(1);
      expect(mockConnection.close).toHaveBeenCalledTimes(1);
      expect(service.isRabbitMQConnected()).toBe(false);
    });
  });

  describe("waitForConnection", () => {
    it("deve retornar imediatamente quando já conectado", async () => {
      // Act
      await expect(service.waitForConnection(3, 100)).resolves.toBeUndefined();
    });

    it("deve lançar timeout quando não conseguir conectar", async () => {
      // Arrange
      await service.onModuleDestroy(); // Desconectar

      // Act & Assert
      await expect(service.waitForConnection(2, 10)).rejects.toThrow(
        "Timeout aguardando conexão RabbitMQ"
      );
    });
  });
});
