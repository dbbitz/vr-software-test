import { Module } from "@nestjs/common";
import { NotificationController } from "./controllers/notification.controller";
import { RabbitMQService } from "./services/rabbitmq.service";
import { StatusStorageService } from "./services/status-storage.service";
import { MessageConsumerService } from "./services/message-consumer.service";
import { NotificationGateway } from "./gateways/notification.gateway";

@Module({
  controllers: [NotificationController],
  providers: [
    RabbitMQService,
    StatusStorageService,
    MessageConsumerService,
    NotificationGateway,
  ],
  exports: [RabbitMQService, StatusStorageService],
})
export class NotificationModule {}
