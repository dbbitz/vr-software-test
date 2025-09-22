import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: ["http://localhost:4200"], // Angular dev server
    methods: ["GET", "POST"],
    credentials: true,
  },
  namespace: "/notifications",
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger("NotificationGateway");

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized");
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Método para enviar atualizações de status para todos os clientes conectados
  broadcastStatusUpdate(mensagemId: string, status: string) {
    this.server.emit("status-update", {
      mensagemId,
      status,
      timestamp: new Date(),
    });
    this.logger.log(`Status update broadcasted: ${mensagemId} - ${status}`);
  }

  // Método para enviar atualização para um cliente específico (se necessário)
  sendStatusToClient(clientId: string, mensagemId: string, status: string) {
    this.server.to(clientId).emit("status-update", {
      mensagemId,
      status,
      timestamp: new Date(),
    });
  }
}
