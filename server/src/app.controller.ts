import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("hello-world")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "Retorna uma mensagem Hello World",
    description: "Endpoint simples que retorna uma mensagem de saudação",
  })
  @ApiResponse({
    status: 200,
    description: "Mensagem retornada com sucesso",
    schema: {
      type: "string",
      example: "Hello World!",
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
