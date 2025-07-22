import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './kafka.service';

@Module({
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}                 