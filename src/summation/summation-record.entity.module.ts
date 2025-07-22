import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('summation_records')
export class SummationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  number1: number;

  @Column('decimal', { precision: 10, scale: 2 })
  number2: number;

  @Column('decimal', { precision: 10, scale: 2 })
  result: number;

  @Column({ name: 'event_id' })
  eventId: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;

  @Column({ name: 'operation_timestamp' })
  operationTimestamp: Date;
}