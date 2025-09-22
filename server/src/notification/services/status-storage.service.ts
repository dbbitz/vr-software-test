import { Injectable } from "@nestjs/common";

export interface MessageStatus {
  mensagemId: string;
  status:
    | "PENDENTE"
    | "PROCESSANDO"
    | "PROCESSADO_SUCESSO"
    | "FALHA_PROCESSAMENTO";
  conteudoMensagem: string;
  timestamp: Date;
  processedAt?: Date;
}

@Injectable()
export class StatusStorageService {
  private readonly statusMap = new Map<string, MessageStatus>();

  setStatus(
    mensagemId: string,
    status: MessageStatus["status"],
    conteudoMensagem: string
  ): void {
    const existingStatus = this.statusMap.get(mensagemId);

    this.statusMap.set(mensagemId, {
      mensagemId,
      status,
      conteudoMensagem,
      timestamp: existingStatus?.timestamp || new Date(),
      processedAt:
        status !== "PENDENTE" && status !== "PROCESSANDO"
          ? new Date()
          : undefined,
    });
  }

  getStatus(mensagemId: string): MessageStatus | undefined {
    return this.statusMap.get(mensagemId);
  }

  getAllStatuses(): MessageStatus[] {
    return Array.from(this.statusMap.values());
  }

  updateProcessingStatus(
    mensagemId: string,
    finalStatus: "PROCESSADO_SUCESSO" | "FALHA_PROCESSAMENTO"
  ): void {
    const currentStatus = this.statusMap.get(mensagemId);
    if (currentStatus) {
      this.statusMap.set(mensagemId, {
        ...currentStatus,
        status: finalStatus,
        processedAt: new Date(),
      });
    }
  }
}
