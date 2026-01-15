import Redis from 'ioredis';
import { Kafka, logLevel } from 'kafkajs';
import type { Consumer, Producer } from 'kafkajs';

export const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const kafka = new Kafka({
  clientId: 'resqconnect',
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const producer: Producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
});

export const consumer: Consumer = kafka.consumer({
  groupId: 'location-updates-group',
});

// Track producer connection state
let isProducerConnected = false;

// Producer event handlers
producer.on('producer.connect', () => {
  console.log('✅ Kafka Producer connected');
  isProducerConnected = true;
});

producer.on('producer.disconnect', () => {
  console.log('❌ Kafka Producer disconnected');
  isProducerConnected = false;
});

/**
 * Check if producer is connected
 */
export function isKafkaProducerConnected(): boolean {
  return isProducerConnected;
}

/**
 * Ensure producer is connected before sending
 */
export async function ensureProducerConnected(): Promise<void> {
  if (!isProducerConnected) {
    console.log('🔄 Reconnecting Kafka producer...');
    await producer.connect();
  }
}

/**
 * Safe send message with automatic reconnection
 */
export async function safeSend(params: {
  topic: string;
  messages: Array<{ key?: string; value: string }>;
}): Promise<void> {
  try {
    await ensureProducerConnected();
    await producer.send(params);
  } catch (error: any) {
    // If disconnected, try to reconnect and send again
    if (
      error.message?.includes('disconnected') ||
      error.name === 'KafkaJSError'
    ) {
      console.log('🔄 Producer disconnected, attempting reconnect...');
      isProducerConnected = false;
      await producer.connect();
      await producer.send(params);
    } else {
      throw error;
    }
  }
}

export async function initInfra() {
  try {
    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({
      topic: 'ambulance-locations',
      fromBeginning: false,
    });

    console.log(`✅ Infra initiated: Redis and Kafka connected`);
  } catch (error) {
    console.error('❌ Failed to initialize infrastructure:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownInfra() {
  try {
    console.log('🔄 Shutting down Kafka...');
    await producer.disconnect();
    await consumer.disconnect();
    await redis.quit();
    console.log('✅ Infrastructure shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}
