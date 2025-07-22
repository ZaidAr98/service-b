import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KafkaConsumerService } from '../kafka/kafka.service';
import { SummationRecord } from './summation-record.entity.module';
import {
  AdditionEvent,
  KafkaMessage,
  SummationResponse,
  SummationHistory,
  SummationStats,
} from './interfaces/summation.interface';

@Injectable()
export class SummationService implements OnModuleInit {
  private readonly logger = new Logger(SummationService.name);
  private lateMessageReceived: Date | null = null;
  private totalMessagesProcessed: number = 0;
  private kafkaConnected: boolean = false;

  constructor(
    @InjectRepository(SummationRecord)
    private readonly summationRepository: Repository<SummationRecord>,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  async onModuleInit() {
    await this.initializeKafkaConsumer();
  }

  private async initializeKafkaConsumer() {
    try {
      await this.kafkaConsumerService.subscribeToTopic(
        'calculator-events',
        'summation-service-group',
        (message: KafkaMessage) => this.handleAddationEvent(message)
      );
      this.kafkaConnected = true;
      this.logger.log('Successfully subscribed to calculator-events topic');
    } catch (error) {
      this.kafkaConnected = false;
      this.logger.error(
        `Failed to subscribe to Kafka topic: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleAddationEvent(message: KafkaMessage) {
    try {
      this.logger.log(`Received message: ${JSON.stringify(message)}`);
      if (message.eventType === 'addition_performed') {
        const event: AdditionEvent = message.payload;

        // Store the addition result in database
        const summationRecord = new SummationRecord();
        summationRecord.number1 = event.number1;
        summationRecord.number2 = event.number2;
        summationRecord.result = event.result;
        summationRecord.eventId = `${Date.now()}-${Math.random()}`;
        summationRecord.operationTimestamp = new Date(event.timestamp);

        await this.summationRepository.save(summationRecord);

        this.lateMessageReceived = new Date();
        this.totalMessagesProcessed++;

        this.logger.log(
          `Stored addition: ${event.number1} + ${event.number2} = ${event.result}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing addition event: ${error.message}`,
        error.stack,
      );
    }
  }

   async getSummation(): Promise<SummationResponse> {
    const result = await this.summationRepository
      .createQueryBuilder('record')
      .select('SUM(record.result)', 'totalSum')
      .addSelect('COUNT(*)', 'operationCount')
      .addSelect('MAX(record.processedAt)', 'lastUpdated')
      .getRawOne();

    const totalSum = parseFloat(result.totalSum) || 0;
    const operationCount = parseInt(result.operationCount) || 0;
    const averageResult = operationCount > 0 ? totalSum / operationCount : 0;

    return {
      totalSum,
      operationCount,
      lastUpdated: result.lastUpdated || new Date(),
      averageResult,
    };
  }


  async getStats(limit: number = 10): Promise<SummationStats> {
    // Get basic stats
    const basicStats = await this.getSummation();
    
    // Get min/max results
    const minMaxResult = await this.summationRepository
      .createQueryBuilder('record')
      .select('MIN(record.result)', 'minResult')
      .addSelect('MAX(record.result)', 'maxResult')
      .getRawOne();
    
    // Get recent operations
    const recentOperations = await this.summationRepository.find({
      order: { processedAt: 'DESC' },
      take: limit,
    });

    return {
      ...basicStats,
      minResult: parseFloat(minMaxResult.minResult) || 0,
      maxResult: parseFloat(minMaxResult.maxResult) || 0,
      recentOperations: recentOperations.map(record => ({
        id: record.id,
        number1: parseFloat(record.number1.toString()),
        number2: parseFloat(record.number2.toString()),
        result: parseFloat(record.result.toString()),
        operationTimestamp: record.operationTimestamp,
        processedAt: record.processedAt,
      })),
    };
  }


  async getAllRecords(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [records, total] = await this.summationRepository.findAndCount({
      order: { processedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      records: records.map(record => ({
        id: record.id,
        number1: parseFloat(record.number1.toString()),
        number2: parseFloat(record.number2.toString()),
        result: parseFloat(record.result.toString()),
        operationTimestamp: record.operationTimestamp,
        processedAt: record.processedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      kafkaConnected: this.kafkaConnected,
      lastMessageReceived: this.lateMessageReceived,
      totalMessagesProcessed: this.totalMessagesProcessed,
      service: 'summation-service',
      timestamp: new Date(),
    };
  }
}
