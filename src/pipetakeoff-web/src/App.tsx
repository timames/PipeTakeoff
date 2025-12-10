import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DrawingPreview } from './components/DrawingPreview';
import { TakeoffTable } from './components/TakeoffTable';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportButton } from './components/ExportButton';
import { useSettings } from './hooks/useSettings';
import { analyzePage, exportToExcel, exportToCsv } from './services/api';
import type { PdfUploadResult, MaterialItem } from './types';
import { FileText, Table, Settings, AlertCircle, X, Loader2 } from 'lucide-react';
import './App.css';

type Tab = 'upload' | 'results' | 'settings';

function App() {
  const { settings, updateSettings, clearSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [uploadResult, setUploadResult] = useState<PdfUploadResult | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawingNotes, setDrawingNotes] = useState<string | null>(null);

  const handleUpload = useCallback((result: PdfUploadResult) => {
    setUploadResult(result);
    setSelectedPage(1);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!uploadResult) {
      setError('Please upload a PDF first');
      return;
    }
    if (!settings.apiKey) {
      setError('Please set your OpenAI API key in Settings');
      setActiveTab('settings');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzePage(
        uploadResult.sessionId,
        selectedPage,
        settings.apiKey,
        settings.customPrompt || undefined
      );
      setMaterials(prev => [...prev, ...result.materials]);
      setDrawingNotes(result.drawingNotes);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [uploadResult, selectedPage, settings]);

  const handleUpdateMaterial = useCallback((id: string, updates: Partial<MaterialItem>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const handleDeleteMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleAddMaterial = useCallback((item: Omit<MaterialItem, 'id'>) => {
    setMaterials(prev => [...prev, { ...item, id: crypto.randomUUID() } as MaterialItem]);
  }, []);

  const handleClearResults = useCallback(() => {
    if (confirm('Are you sure you want to clear all materials?')) {
      setMaterials([]);
      setDrawingNotes(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">PipeTakeoff</h1>
              <p className="text-xs text-gray-500">AI-Powered Materials Takeoff</p>
            </div>
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Table className="h-4 w-4" />
              Results
              {materials.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {materials.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${!settings.apiKey ? 'text-orange-600' : ''}`}
            >
              <Settings className="h-4 w-4" />
              Settings
              {!settings.apiKey && (
                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Drawing</h2>
                <FileUpload onUploadComplete={handleUpload} />
              </div>

              {uploadResult && (
                <div className="p-4 bg-white rounded-lg shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800">{uploadResult.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {uploadResult.pageCount} page{uploadResult.pageCount !== 1 ? 's' : ''} |
                        Viewing page {selectedPage}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                      ${analyzing
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyzing with GPT-4o...
                      </>
                    ) : (
                      <>Analyze Page {selectedPage}</>
                    )}
                  </button>

                  {!settings.apiKey && (
                    <p className="mt-2 text-xs text-orange-600 text-center">
                      Set your OpenAI API key in Settings before analyzing
                    </p>
                  )}
                </div>
              )}
            </div>

            {uploadResult ? (
              <div className="h-[600px]">
                <DrawingPreview
                  sessionId={uploadResult.sessionId}
                  pageCount={uploadResult.pageCount}
                  selectedPage={selectedPage}
                  onPageChange={setSelectedPage}
                />
              </div>
            ) : (
              <div className="h-[600px] bg-white rounded-lg shadow flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Upload a PDF to preview</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Materials Takeoff</h2>
                {drawingNotes && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Notes:</span> {drawingNotes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {materials.length > 0 && (
                  <button
                    onClick={handleClearResults}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                )}
                <ExportButton
                  materials={materials}
                  onExportExcel={() => exportToExcel(materials)}
                  onExportCsv={() => exportToCsv(materials)}
                />
              </div>
            </div>

            <TakeoffTable
              materials={materials}
              onUpdate={handleUpdateMaterial}
              onDelete={handleDeleteMaterial}
              onAdd={handleAddMaterial}
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <SettingsPanel
              settings={settings}
              onUpdate={updateSettings}
              onClear={clearSettings}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-sm text-gray-400">
        PipeTakeoff - AI-powered materials takeoff for construction drawings
      </footer>
    </div>
  );
}

export default App;
