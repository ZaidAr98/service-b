import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { KafkaMessage } from '../summation/interfaces/summation.interface';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumers: Consumer[] = [];

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'service-b',
      brokers: [this.configService.get('KAFKA_BROKER', 'localhost:9092')],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async subscribeToTopic(
    topic: string,
    groupId: string,
    messageHandler: (message: KafkaMessage) => void,
  ): Promise<void> {
    const consumer = this.kafka.consumer({ 
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    try {
      await consumer.connect();
      this.logger.log(`Connected to Kafka with group ID: ${groupId}`);

      await consumer.subscribe({ 
        topic,
        fromBeginning: true,
      });
      
      this.logger.log(`Subscribed to topic: ${topic}`);

      await consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const value = message.value?.toString();
            if (!value) {
              this.logger.warn('Received empty message');
              return;
            }

            this.logger.log(
              `Received message from topic ${topic}, partition ${partition}, offset ${message.offset}`
            );

            const kafkaMessage: KafkaMessage = JSON.parse(value);
            messageHandler(kafkaMessage);
          } catch (error) {
            this.logger.error(
              `Error processing message from topic ${topic}: ${error.message}`,
              error.stack,
            );
          }
        },
      });

      this.consumers.push(consumer);
      this.logger.log(`Started consuming messages from topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka consumers...');
    
    for (const consumer of this.consumers) {
      try {
        await consumer.disconnect();
        this.logger.log('Kafka consumer disconnected successfully');
      } catch (error) {
        this.logger.error(`Error disconnecting Kafka consumer: ${error.message}`, error.stack);
      }
    }
  }
}