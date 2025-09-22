import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ConfigService } from './config.service';

export interface NotificationRequest {
  mensagemId: string;
  conteudoMensagem: string;
}

export interface NotificationResponse {
  mensagemId: string;
  message: string;
}

export interface NotificationStatus {
  mensagemId: string;
  status:
    | 'PENDENTE'
    | 'PROCESSANDO'
    | 'PROCESSADO_SUCESSO'
    | 'FALHA_PROCESSAMENTO'
    | 'AGUARDANDO_PROCESSAMENTO';
  conteudoMensagem: string;
  timestamp: string;
  processedAt?: string;
}

export interface StatusUpdate {
  mensagemId: string;
  status: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket!: Socket;
  private statusUpdatesSubject = new Subject<StatusUpdate>();

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    const config = this.configService.websocketConfig;

    this.socket = io(this.configService.websocketUrl, {
      transports: config.transports as any,
      autoConnect: config.autoConnect,
    });

    this.socket.on('connect', () => {
      if (this.configService.enableConsoleLog) {
        console.log('Conectado ao WebSocket');
      }
    });

    this.socket.on('disconnect', () => {
      if (this.configService.enableConsoleLog) {
        console.log('Desconectado do WebSocket');
      }
    });

    this.socket.on('status-update', (data: StatusUpdate) => {
      if (this.configService.enableConsoleLog) {
        console.log('Atualização de status recebida:', data);
      }
      this.statusUpdatesSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      if (this.configService.enableConsoleLog) {
        console.error('Erro de conexão WebSocket:', error);
      }
    });
  }

  // Enviar notificação para a API
  enviarNotificacao(
    request: NotificationRequest
  ): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.configService.apiUrl}/notificar`,
      request
    );
  }

  // Consultar status de uma mensagem específica
  consultarStatus(mensagemId: string): Observable<NotificationStatus> {
    return this.http.get<NotificationStatus>(
      `${this.configService.apiUrl}/status/${mensagemId}`
    );
  }

  // Consultar todos os status
  consultarTodosStatus(): Observable<NotificationStatus[]> {
    return this.http.get<NotificationStatus[]>(
      `${this.configService.apiUrl}/status`
    );
  }

  // Observable para receber atualizações de status via WebSocket
  getStatusUpdates(): Observable<StatusUpdate> {
    return this.statusUpdatesSubject.asObservable();
  }

  // Método para desconectar do WebSocket (cleanup)
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Verificar se está conectado ao WebSocket
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}
