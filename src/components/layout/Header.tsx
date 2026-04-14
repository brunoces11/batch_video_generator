import { useState } from 'react';
import { Wifi, WifiOff, ArrowLeft, ChevronDown, Clapperboard, Key, Plus, Trash2 } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { VEO_MODELS } from '../../lib/constants';

export function Header() {
  const {
    wakeLock,
    isProcessing,
    view,
    setView,
    apiKeys,
    selectedKeyId,
    apiKeysLoading,
    selectApiKey,
    addApiKey,
    removeApiKey,
    model,
    setModel,
  } = useBatch();

  const [manageOpen, setManageOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddKey = async () => {
    if (!newLabel.trim() || !newKey.trim()) return;
    setAdding(true);
    try {
      await addApiKey(newLabel.trim(), newKey.trim());
      setNewLabel('');
      setNewKey('');
    } catch {
      //
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              {view !== 'list' && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => setView('list')}
                />
              )}
              <div className="flex items-center gap-2.5">
                <Clapperboard className="h-8 w-8 text-sky-600" />
                <h1 className="text-4xl font-semibold tracking-tight text-sky-600">
                  AUTOVID
                </h1>
              </div>

              {isProcessing && (
                <div className="ml-3">
                  {wakeLock.isActive ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs">
                      <Wifi className="h-3.5 w-3.5" />
                      <span className="font-medium hidden sm:inline">Screen Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs">
                      <WifiOff className="h-3.5 w-3.5" />
                      <span className="font-medium hidden sm:inline">No Wake Lock</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={selectedKeyId || ''}
                    onChange={(e) => {
                      if (e.target.value === '__manage__') {
                        setManageOpen(true);
                        return;
                      }
                      selectApiKey(e.target.value);
                    }}
                    disabled={apiKeysLoading}
                    className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-colors cursor-pointer min-w-[140px]"
                  >
                    {apiKeys.length === 0 && (
                      <option value="">No API keys</option>
                    )}
                    {apiKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                    <option value="__manage__">+ Manage Keys...</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-colors cursor-pointer"
                  >
                    {VEO_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="Manage API Keys">
        <div className="space-y-4">
          {apiKeys.length > 0 && (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Key className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{k.label}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        ...{k.api_key.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedKeyId === k.id && (
                      <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeApiKey(k.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {apiKeys.length === 0 && (
            <div className="text-center py-6 text-sm text-gray-500">
              No API keys added yet. Add your first key below.
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Add New API Key</p>
            <div className="space-y-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. VEO_API_2)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-colors"
              />
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="API Key (AIza...)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-colors font-mono"
              />
              <Button
                size="md"
                className="w-full"
                icon={<Plus className="h-4 w-4" />}
                loading={adding}
                onClick={handleAddKey}
                disabled={!newLabel.trim() || !newKey.trim()}
              >
                Add Key
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
