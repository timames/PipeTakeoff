import type { PdfUploadResult, TakeoffResult, MaterialItem } from '../types';

const API_BASE = '/api';

export async function uploadPdf(file: File): Promise<PdfUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export async function analyzePage(
  sessionId: string,
  pageNumber: number,
  apiKey: string,
  customPrompt?: string
): Promise<TakeoffResult> {
  const response = await fetch(`${API_BASE}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, pageNumber, apiKey, customPrompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Analysis failed' }));
    throw new Error(error.message || 'Analysis failed');
  }

  return response.json();
}

export async function exportToExcel(materials: MaterialItem[]): Promise<void> {
  const response = await fetch(`${API_BASE}/export/excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materials }),
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  const blob = await response.blob();
  downloadBlob(blob, `takeoff-${formatDate()}.xlsx`);
}

export async function exportToCsv(materials: MaterialItem[]): Promise<void> {
  const response = await fetch(`${API_BASE}/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materials }),
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  const blob = await response.blob();
  downloadBlob(blob, `takeoff-${formatDate()}.csv`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getPageImageUrl(sessionId: string, pageNumber: number): string {
  return `${API_BASE}/upload/${sessionId}/page/${pageNumber}`;
}
