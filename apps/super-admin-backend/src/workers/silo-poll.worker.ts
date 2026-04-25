import { pollSilosOnce } from '@/services/silo-poll.service';

// (dashboard eventual consistency).
export function startSiloPollWorker() {
  const intervalMs = 60 * 60 * 1000;

  // Run once on boot.
  pollSilosOnce().catch(err => {
    console.error('silo poll failed', err);
  });

  setInterval(() => {
    pollSilosOnce().catch(err => {
      console.error('silo poll failed', err);
    });
  }, intervalMs);
}
