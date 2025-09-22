import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { Subscription } from 'rxjs';

import {
  NotificationService,
  NotificationStatus,
  StatusUpdate,
} from '../../services/notification.service';

@Component({
  selector: 'app-notificacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notificacao.component.html',
  styleUrls: ['./notificacao.component.scss'],
})
export class NotificacaoComponent implements OnInit, OnDestroy {
  mensagem: string = '';
  notificacoes: NotificationStatus[] = [];
  isLoading: boolean = false;
  isConnected: boolean = false;

  private statusUpdateSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Verifica conexão WebSocket
    this.checkWebSocketConnection();

    // Subscreve às atualizações de status via WebSocket
    this.statusUpdateSubscription = this.notificationService
      .getStatusUpdates()
      .subscribe((statusUpdate: StatusUpdate) => {
        this.handleStatusUpdate(statusUpdate);
      });

    // Carrega notificações existentes
    this.carregarNotificacoesExistentes();
  }

  ngOnDestroy(): void {
    if (this.statusUpdateSubscription) {
      this.statusUpdateSubscription.unsubscribe();
    }
    this.notificationService.disconnect();
  }

  private checkWebSocketConnection(): void {
    this.isConnected = this.notificationService.isConnected();

    // Verifica periodicamente a conexão
    setInterval(() => {
      this.isConnected = this.notificationService.isConnected();
    }, 2000);
  }

  private carregarNotificacoesExistentes(): void {
    this.notificationService.consultarTodosStatus().subscribe({
      next: (notificacoes) => {
        this.notificacoes = notificacoes;
      },
      error: (error) => {
        console.error('Erro ao carregar notificações existentes:', error);
      },
    });
  }

  enviarNotificacao(): void {
    if (!this.mensagem.trim()) {
      alert('Por favor, digite uma mensagem!');
      return;
    }

    this.isLoading = true;
    const mensagemId = uuidv4();

    // Adiciona imediatamente à lista com status "AGUARDANDO_PROCESSAMENTO"
    const novaNotificacao: NotificationStatus = {
      mensagemId: mensagemId,
      conteudoMensagem: this.mensagem.trim(),
      status: 'AGUARDANDO_PROCESSAMENTO',
      timestamp: new Date().toISOString(),
    };

    this.notificacoes.unshift(novaNotificacao);

    // Envia para a API
    this.notificationService
      .enviarNotificacao({
        mensagemId: mensagemId,
        conteudoMensagem: this.mensagem.trim(),
      })
      .subscribe({
        next: (response) => {
          console.log('Notificação enviada com sucesso:', response);
          // Atualiza o status para PENDENTE após confirmação da API
          const index = this.notificacoes.findIndex(
            (n) => n.mensagemId === mensagemId
          );
          if (index !== -1) {
            this.notificacoes[index].status = 'PENDENTE';
          }

          this.mensagem = ''; // Limpa o campo
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao enviar notificação:', error);

          // Remove da lista em caso de erro
          const index = this.notificacoes.findIndex(
            (n) => n.mensagemId === mensagemId
          );
          if (index !== -1) {
            this.notificacoes.splice(index, 1);
          }

          alert('Erro ao enviar notificação. Tente novamente.');
          this.isLoading = false;
        },
      });
  }

  private handleStatusUpdate(statusUpdate: StatusUpdate): void {
    console.log('Atualizando status via WebSocket:', statusUpdate);

    const index = this.notificacoes.findIndex(
      (notificacao) => notificacao.mensagemId === statusUpdate.mensagemId
    );

    if (index !== -1) {
      // Atualiza o status da notificação existente
      this.notificacoes[index] = {
        ...this.notificacoes[index],
        status: statusUpdate.status as any,
        processedAt:
          statusUpdate.status !== 'PROCESSANDO'
            ? statusUpdate.timestamp.toString()
            : undefined,
      };
    } else {
      // Se a notificação não existe na lista, busca na API
      this.notificationService
        .consultarStatus(statusUpdate.mensagemId)
        .subscribe({
          next: (notificacao) => {
            this.notificacoes.unshift(notificacao);
          },
          error: (error) => {
            console.error('Erro ao buscar notificação:', error);
          },
        });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AGUARDANDO_PROCESSAMENTO':
        return 'status-aguardando';
      case 'PENDENTE':
        return 'status-pendente';
      case 'PROCESSANDO':
        return 'status-processando';
      case 'PROCESSADO_SUCESSO':
        return 'status-sucesso';
      case 'FALHA_PROCESSAMENTO':
        return 'status-falha';
      default:
        return 'status-desconhecido';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AGUARDANDO_PROCESSAMENTO':
        return 'Aguardando Processamento';
      case 'PENDENTE':
        return 'Pendente';
      case 'PROCESSANDO':
        return 'Processando';
      case 'PROCESSADO_SUCESSO':
        return 'Processado com Sucesso';
      case 'FALHA_PROCESSAMENTO':
        return 'Falha no Processamento';
      default:
        return 'Status Desconhecido';
    }
  }

  recarregarLista(): void {
    this.carregarNotificacoesExistentes();
  }

  trackByMensagemId(index: number, item: NotificationStatus): string {
    return item.mensagemId;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch (error) {
      return dateString;
    }
  }
}
