import 'reflect-metadata';
import { dataSource } from './data-source';
import { claimNextPending, processFile } from './process-file';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 2000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let running = true;
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    running = false;
  });
}

async function main() {
  await dataSource.initialize();
  // eslint-disable-next-line no-console
  console.log(`Worker connected to Postgres, polling every ${POLL_INTERVAL_MS}ms`);

  while (running) {
    try {
      const record = await claimNextPending();
      if (!record) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      await processFile(record);
      // eslint-disable-next-line no-console
      console.log(`File ${record.id} processed`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Poll iteration failed:', err instanceof Error ? err.message : err);
      await sleep(POLL_INTERVAL_MS);
    }
  }

  await dataSource.destroy();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed to start', err);
  process.exit(1);
});
