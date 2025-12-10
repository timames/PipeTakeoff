export type MaterialCategory = 'Pipe' | 'Fitting' | 'Valve' | 'Equipment' | 'Specialty';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface MaterialItem {
  id: string;
  category: MaterialCategory | string;
  description: string;
  size: string;
  material: string;
  quantity: number;
  unit: string;
  confidence: ConfidenceLevel | string;
  notes: string | null;
  isManualEntry: boolean;
}

export interface TakeoffResult {
  materials: MaterialItem[];
  drawingNotes: string | null;
  analyzedAt: string;
}

export interface PdfUploadResult {
  sessionId: string;
  fileName: string;
  pageCount: number;
}

export interface Settings {
  apiKey: string;
  model: string;
  customPrompt: string;
}
