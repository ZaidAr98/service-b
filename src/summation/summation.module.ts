import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummationController } from './summation.controller';
import { SummationService } from './summation.service';
import { KafkaModule } from '../kafka/kafka.module';
import { SummationRecord } from './summation-record.entity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SummationRecord]),
    KafkaModule,
  ],
  controllers: [SummationController],
  providers: [SummationService],
})
export class SummationModule {}