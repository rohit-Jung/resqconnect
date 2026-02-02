import type { KAFKA_TOPICS } from '@/constants/kafka.constants';

import { safeSend } from './kafka.service';

export async function publishWithRetry(
  topic: KAFKA_TOPICS,
  message: { key: string; value: string },
  retries = 3,
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await safeSend({ topic, messages: [message] });
      return true;
    } catch (error) {
      console.error(`Kafka publish failed (attempt ${i + 1}):`, error);
      if (i < retries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, i)),
        );
      }
    }
  }
  return false;
}
