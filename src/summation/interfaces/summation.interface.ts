export interface AdditionEvent {
  number1: number;
  number2: number;
  result: number;
  timestamp: Date;
}

export interface KafkaMessage {
  eventType: string;
  payload: AdditionEvent;
  timestamp: Date;
}

export interface SummationResponse {
  totalSum: number;
  operationCount: number;
  lastUpdated: Date;
  averageResult: number;
}

export interface SummationStats {
  totalSum: number;
  operationCount: number;
  lastUpdated: Date;
  averageResult: number;
  minResult: number;
  maxResult: number;
  recentOperations: SummationHistory[];
}

export interface SummationHistory {
  id: number;
  number1: number;
  number2: number;
  result: number;
  operationTimestamp: Date;
  processedAt: Date;
}