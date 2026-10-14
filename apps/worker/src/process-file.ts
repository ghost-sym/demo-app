import { createHash } from 'crypto';
import { dataSource } from './data-source';
import { FileRecord } from './file.entity';
import { downloadBlob } from './blob-storage';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTextLike(mimeType: string): boolean {
  return mimeType.startsWith('text/') || mimeType === 'application/json';
}

function analyze(buffer: Buffer, mimeType: string) {
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const result: Record<string, unknown> = {
    sha256,
    sizeBytes: buffer.length,
  };

  if (isTextLike(mimeType)) {
    const text = buffer.toString('utf-8');
    result.lineCount = text.split(/\r\n|\r|\n/).length;
    result.wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    result.charCount = text.length;
  }

  return result;
}

// Atomically flip the oldest pending row to "processing" and return it.
// SKIP LOCKED keeps this safe if the worker is ever scaled past one replica.
export async function claimNextPending(): Promise<Pick<FileRecord, 'id' | 'blobName' | 'mimeType'> | null> {
  const rows = await dataSource.query(
    `UPDATE files SET status = 'processing', "updatedAt" = now()
     WHERE id = (
       SELECT id FROM files
       WHERE status = 'pending'
       ORDER BY "createdAt"
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, "blobName", "mimeType"`,
  );
  // pg driver returns [rows, affectedCount] for UPDATE ... RETURNING
  const claimed = Array.isArray(rows[0]) ? rows[0] : rows;
  return claimed[0] ?? null;
}

export async function processFile(record: Pick<FileRecord, 'id' | 'blobName' | 'mimeType'>) {
  const repo = dataSource.getRepository(FileRecord);
  try {
    const buffer = await downloadBlob(record.blobName);
    // simulate non-trivial work so the "processing" state is visible in the UI
    await sleep(1500 + Math.random() * 1500);
    const result = analyze(buffer, record.mimeType);

    await repo.update(record.id, { status: 'completed', result, error: null });
  } catch (err) {
    await repo.update(record.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
