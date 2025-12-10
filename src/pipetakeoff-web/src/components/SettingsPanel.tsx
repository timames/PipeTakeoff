import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Save, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { Settings as SettingsType } from '../types';

interface SettingsPanelProps {
  settings: SettingsType;
  onUpdate: (updates: Partial<SettingsType>) => void;
  onClear: () => void;
}

export function SettingsPanel({ settings, onUpdate, onClear }: SettingsPanelProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localKey, setLocalKey] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalKey(settings.apiKey);
  }, [settings.apiKey]);

  const handleSaveKey = () => {
    onUpdate({ apiKey: localKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isKeyValid = localKey.startsWith('sk-') && localKey.length > 20;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center gap-2 p-4 border-b">
        <Settings className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="sk-..."
                className={`w-full p-2 pr-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${localKey && !isKeyValid ? 'border-orange-300' : 'border-gray-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              disabled={!localKey}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Your API key is stored in your browser's localStorage and never sent to our servers.
              Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI's dashboard</a>.
            </p>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={settings.model}
            onChange={e => onUpdate({ model: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gpt-4o">GPT-4o (Recommended - Best quality)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (Faster, lower cost)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            GPT-4o provides the best accuracy for construction drawings. GPT-4o Mini is faster and cheaper but may miss some details.
          </p>
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prompt (Optional)
          </label>
          <textarea
            value={settings.customPrompt}
            onChange={e => onUpdate({ customPrompt: e.target.value })}
            placeholder="Override the default analysis prompt. Leave empty to use the default piping takeoff prompt."
            rows={6}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-gray-500">
            The default prompt is optimized for civil piping and mechanical drawings. Only customize if you have specific requirements.
          </p>
        </div>

        {/* Clear Settings */}
        <div className="pt-4 border-t">
          <button
            onClick={onClear}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
          >
            <Trash2 className="h-4 w-4" /> Clear all settings
          </button>
          <p className="mt-1 text-xs text-gray-500">
            This will remove your API key and reset all settings to defaults.
          </p>
        </div>
      </div>
    </div>
  );
}
