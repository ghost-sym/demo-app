import type { FileRecord } from './types';

// In dev this is '/api' (Vite proxies it to the API). In the deployed `web`
// container it's baked at build time to the API app's public URL + '/api'.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function fetchFiles(): Promise<FileRecord[]> {
  const res = await fetch(`${API_BASE}/files`);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}

export async function uploadFile(file: File): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  return res.json();
}

export function downloadUrl(id: string): string {
  return `${API_BASE}/files/${id}/download`;
}
