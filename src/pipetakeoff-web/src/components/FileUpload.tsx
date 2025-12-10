import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { uploadPdf } from '../services/api';
import type { PdfUploadResult } from '../types';

interface FileUploadProps {
  onUploadComplete: (result: PdfUploadResult) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadPdf(file);
      onUploadComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200 ${
        isDragActive ? 'border-blue-500 bg-blue-50' :
        uploading ? 'border-gray-300 bg-gray-50 cursor-wait' :
        'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Processing PDF...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isDragActive ? (
            <FileText className="h-12 w-12 text-blue-500" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}
          <p className="mt-4 text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop PDF here' : 'Drag & drop a PDF or click to browse'}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Supports piping plans, P&IDs, and construction drawings (max 50MB)
          </p>
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
