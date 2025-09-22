import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Param,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import {
  NotificationRequestDto,
  NotificationResponseDto,
} from "../dto/notification.dto";
import { RabbitMQService } from "../services/rabbitmq.service";
import {
  StatusStorageService,
  MessageStatus,
} from "../services/status-storage.service";

@ApiTags("notifications")
@Controller("api")
export class NotificationController {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly statusStorageService: StatusStorageService
  ) {}

  @Post("notificar")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Enviar notificação para processamento",
    description:
      "Aceita uma mensagem e a envia para processamento assíncrono via RabbitMQ",
  })
  @ApiBody({ type: NotificationRequestDto })
  @ApiResponse({
    status: 202,
    description: "Mensagem aceita para processamento",
    type: NotificationResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Dados inválidos - conteudoMensagem não pode estar vazio",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "conteudoMensagem não pode estar vazio",
        },
        error: { type: "string", example: "Bad Request" },
        statusCode: { type: "number", example: 400 },
      },
    },
  })
  async notificar(
    @Body() notificationDto: NotificationRequestDto
  ): Promise<NotificationResponseDto> {
    // Validação adicional para conteúdo vazio (além da validação do DTO)
    if (!notificationDto.conteudoMensagem?.trim()) {
      throw new BadRequestException("conteudoMensagem não pode estar vazio");
    }

    // Verifica se RabbitMQ está conectado
    if (!this.rabbitMQService.isRabbitMQConnected()) {
      throw new ServiceUnavailableException(
        "Serviço de mensageria indisponível. Tente novamente em alguns instantes."
      );
    }

    try {
      // Armazena status inicial
      this.statusStorageService.setStatus(
        notificationDto.mensagemId,
        "PENDENTE",
        notificationDto.conteudoMensagem
      );

      // Publica mensagem na fila de entrada
      await this.rabbitMQService.publishToEntrada({
        mensagemId: notificationDto.mensagemId,
        conteudoMensagem: notificationDto.conteudoMensagem,
        timestamp: new Date(),
      });

      return {
        mensagemId: notificationDto.mensagemId,
        message: "Mensagem aceita para processamento",
      };
    } catch (error) {
      // Remove do storage se falhou ao publicar
      throw new ServiceUnavailableException(
        "Erro ao processar mensagem. Tente novamente."
      );
    }
  }

  @Get("status/:mensagemId")
  @ApiOperation({
    summary: "Consultar status de uma mensagem",
    description:
      "Retorna o status atual de processamento de uma mensagem específica",
  })
  @ApiResponse({
    status: 200,
    description: "Status da mensagem encontrado",
    schema: {
      type: "object",
      properties: {
        mensagemId: { type: "string" },
        status: {
          type: "string",
          enum: [
            "PENDENTE",
            "PROCESSANDO",
            "PROCESSADO_SUCESSO",
            "FALHA_PROCESSAMENTO",
          ],
        },
        conteudoMensagem: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
        processedAt: { type: "string", format: "date-time", nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Mensagem não encontrada",
  })
  getStatus(@Param("mensagemId") mensagemId: string): MessageStatus {
    const status = this.statusStorageService.getStatus(mensagemId);
    if (!status) {
      throw new BadRequestException("Mensagem não encontrada");
    }
    return status;
  }

  @Get("status")
  @ApiOperation({
    summary: "Listar todos os status",
    description: "Retorna o status de todas as mensagens processadas",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de todos os status",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          mensagemId: { type: "string" },
          status: {
            type: "string",
            enum: [
              "PENDENTE",
              "PROCESSANDO",
              "PROCESSADO_SUCESSO",
              "FALHA_PROCESSAMENTO",
            ],
          },
          conteudoMensagem: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          processedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  })
  getAllStatuses(): MessageStatus[] {
    return this.statusStorageService.getAllStatuses();
  }

  @Get("info")
  @ApiOperation({
    summary: "Informações do sistema",
    description: "Retorna informações sobre as filas RabbitMQ configuradas",
  })
  @ApiResponse({
    status: 200,
    description: "Informações do sistema",
    schema: {
      type: "object",
      properties: {
        queueNames: {
          type: "object",
          properties: {
            entrada: { type: "string" },
            status: { type: "string" },
          },
        },
        totalMessages: { type: "number" },
      },
    },
  })
  getInfo() {
    return {
      queueNames: this.rabbitMQService.getQueueNames(),
      totalMessages: this.statusStorageService.getAllStatuses().length,
    };
  }
}
