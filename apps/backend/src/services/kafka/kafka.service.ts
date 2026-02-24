import Redis from 'ioredis';
import { type Consumer, Kafka, type Producer, logLevel } from 'kafkajs';

import { KAFKA_CONSUMER_ID, KAFKA_TOPICS } from '@/constants/kafka.constants';

export const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const kafka = new Kafka({
  clientId: 'resqconnect',
  brokers: ['localhost:9092'],
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

export const producer: Producer = kafka.producer({
  allowAutoTopicCreation: true,
});

export const notificationConsumer: Consumer = kafka.consumer({
  groupId: KAFKA_CONSUMER_ID.NOTIFICATION,
});

export const assignResponderConsumer: Consumer = kafka.consumer({
  groupId: KAFKA_CONSUMER_ID.ASSIGN_RESPONDER,
});

let connectPromise: Promise<void> | null = null;
let isShuttingDown = false;

async function connectKafkaOnce() {
  if (!connectPromise) {
    connectPromise = (async () => {
      console.log('Connecting to Kafka...');
      await producer.connect();
      await notificationConsumer.connect();
      await assignResponderConsumer.connect();
      console.log('Kafka connected');
    })();
  }
  return connectPromise;
}

export async function initInfra() {
  try {
    await connectKafkaOnce();

    await notificationConsumer.subscribe({
      topics: [KAFKA_TOPICS.MEDICAL_EVENTS, KAFKA_TOPICS.FIRE_EVENTS],
      fromBeginning: false,
    });

    await assignResponderConsumer.subscribe({
      topics: [KAFKA_TOPICS.MEDICAL_EVENTS, KAFKA_TOPICS.FIRE_EVENTS],
      fromBeginning: false,
    });

    console.log('Infrastructure initialized');
  } catch (err) {
    console.error('Infra init failed:', err);
    process.exit(1);
  }
}

export async function safeSend(params: {
  topic: KAFKA_TOPICS;
  messages: Array<{ key?: string; value: string }>;
}) {
  if (isShuttingDown) {
    throw new Error('Kafka is shutting down, refusing to send');
  }

  await connectKafkaOnce();

  try {
    await producer.send(params);
  } catch (err) {
    console.error('Kafka send failed:', err);
    throw err;
  }
}

export async function shutdownInfra() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down Kafka...');
  try {
    await producer.disconnect();
    await notificationConsumer.disconnect();
    await assignResponderConsumer.disconnect();
    await redis.quit();
    console.log('Shutdown complete');
  } catch (err) {
    console.error('Shutdown error:', err);
  }
}
