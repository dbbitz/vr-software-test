import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Configuração de validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle("API NestJS com RabbitMQ")
    .setDescription(
      "API para processamento assíncrono de notificações com RabbitMQ"
    )
    .setVersion("1.0")
    .addTag("hello-world", "Endpoints básicos")
    .addTag("notifications", "Sistema de notificações com RabbitMQ")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3000);
  console.log(`🚀 Server running on http://${process.env.HOST}:3000`);
  console.log(`📚 Swagger docs available at http://${process.env.HOST}:3000/api/docs`);
  console.log("🐰 RabbitMQ integration active");
}
bootstrap();
