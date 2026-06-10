import Redis from 'ioredis';
import { type Consumer, Kafka, type Producer, logLevel } from 'kafkajs';

import { envConfig, logger } from '@/config';
import { KAFKA_CONSUMER_ID, KAFKA_TOPICS } from '@/constants/kafka.constants';

export const redis = new Redis({
  host: envConfig.redis_host,
  port: envConfig.redis_port,
});

const kafka = new Kafka({
  clientId: 'resqconnect',
  brokers: String(envConfig.kafka_brokers)
    .split(',')
    .map(b => b.trim())
    .filter(Boolean),
  logLevel: logLevel.WARN,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 500,
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

export const incidentUpdateConsumer: Consumer = kafka.consumer({
  groupId: KAFKA_CONSUMER_ID.INCIDENT_STATUS_UPDATE,
});

let connectPromise: Promise<void> | null = null;
let isShuttingDown = false;

async function connectKafkaOnce() {
  if (!connectPromise) {
    connectPromise = (async () => {
      logger.debug('Connecting to Kafka...');
      await producer.connect();
      await notificationConsumer.connect();
      await assignResponderConsumer.connect();
      await incidentUpdateConsumer.connect();
      logger.debug('Kafka connected');
    })();
  }
  return connectPromise;
}

export async function initInfra() {
  try {
    await connectKafkaOnce();

    await notificationConsumer.subscribe({
      topics: [
        KAFKA_TOPICS.MEDICAL_EVENTS,
        KAFKA_TOPICS.FIRE_EVENTS,
        KAFKA_TOPICS.POLICE_EVENTS,
        KAFKA_TOPICS.RESCUE_EVENTS,
      ],
      fromBeginning: false,
    });

    await assignResponderConsumer.subscribe({
      topics: [
        KAFKA_TOPICS.MEDICAL_EVENTS,
        KAFKA_TOPICS.FIRE_EVENTS,
        KAFKA_TOPICS.POLICE_EVENTS,
        KAFKA_TOPICS.RESCUE_EVENTS,
      ],
      fromBeginning: false,
    });

    logger.debug('Infrastructure initialized');
  } catch (err) {
    logger.error('Infra init failed:', err);
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
    logger.error('Kafka send failed:', err);
    throw err;
  }
}

export async function shutdownInfra() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.debug('Shutting down Kafka...');
  try {
    await producer.disconnect();
    await notificationConsumer.disconnect();
    await assignResponderConsumer.disconnect();
    await incidentUpdateConsumer.disconnect();
    await redis.quit();
    logger.debug('Shutdown complete');
  } catch (err) {
    logger.error('Shutdown error:', err);
  }
}
