import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsUUID } from "class-validator";

export class NotificationRequestDto {
  @ApiProperty({
    description: "ID único da mensagem",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID(4, { message: "mensagemId deve ser um UUID válido" })
  mensagemId: string;

  @ApiProperty({
    description: "Conteúdo da mensagem a ser processada",
    example: "Esta é uma mensagem de teste para processamento",
  })
  @IsString({ message: "conteudoMensagem deve ser uma string" })
  @IsNotEmpty({ message: "conteudoMensagem não pode estar vazio" })
  conteudoMensagem: string;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: "ID da mensagem aceita para processamento",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  mensagemId: string;

  @ApiProperty({
    description: "Mensagem de confirmação",
    example: "Mensagem aceita para processamento",
  })
  message: string;
}

export class MessageStatusDto {
  mensagemId: string;
  conteudoMensagem: string;
  timestamp?: Date;
}

export class StatusUpdateDto {
  mensagemId: string;
  status: "PROCESSADO_SUCESSO" | "FALHA_PROCESSAMENTO";
  timestamp: Date;
}
