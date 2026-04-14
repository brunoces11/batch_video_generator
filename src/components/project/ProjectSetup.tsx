import { useState, useRef } from 'react';
import { Plus, Sparkles, Image, Trash2, GripVertical, Upload, Link, X } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { createProject } from '../../services/projectService';
import { createFragments } from '../../services/fragmentService';
import { uploadReferenceImage } from '../../services/imageUploadService';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { TimeoutSettings } from '../settings/TimeoutSettings';
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  DURATIONS,
  MAX_CONCURRENT_OPTIONS,
} from '../../lib/constants';

interface ExpansionEntry {
  id: string;
  prompt: string;
}

function createExpansion(): ExpansionEntry {
  return { id: crypto.randomUUID(), prompt: '' };
}

type ImageMode = 'none' | 'url' | 'file';

export function ProjectSetup() {
  const { apiKey, setProject, setFragments, setView } = useBatch();
  const [name, setName] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<ImageMode>('none');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expansions, setExpansions] = useState<ExpansionEntry[]>([createExpansion()]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState('720p');
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validExpansions = expansions.filter((e) => e.prompt.trim().length > 0);

  const updateExpansionPrompt = (id: string, prompt: string) => {
    setExpansions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, prompt } : e))
    );
  };

  const removeExpansion = (id: string) => {
    if (expansions.length <= 1) return;
    setExpansions((prev) => prev.filter((e) => e.id !== id));
  };

  const addExpansion = () => {
    setExpansions((prev) => [...prev, createExpansion()]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImageMode('file');
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const clearImage = () => {
    setImageMode('none');
    setReferenceImageUrl('');
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewSrc =
    imageMode === 'file' ? filePreview :
    imageMode === 'url' && referenceImageUrl ? referenceImageUrl :
    null;

  const handleCreate = async () => {
    if (!apiKey) {
      setError('Enter your Gemini API Key in the top bar first');
      return;
    }
    if (validExpansions.length === 0) {
      setError('Add at least one video expansion with a prompt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalImageUrl: string | undefined;

      if (imageMode === 'file' && selectedFile) {
        setUploading(true);
        const uploaded = await uploadReferenceImage(selectedFile);
        finalImageUrl = uploaded.publicUrl;
        setUploading(false);
      } else if (imageMode === 'url' && referenceImageUrl.trim()) {
        finalImageUrl = referenceImageUrl.trim();
      }

      const project = await createProject(name || 'Untitled Video Project', {
        aspectRatio,
        durationSeconds: duration,
        resolution,
        maxConcurrent,
        apiKeyHint: apiKey.slice(-4),
        referenceImageUrl: finalImageUrl,
      });

      const fragments = await createFragments(
        project.id,
        validExpansions.map((e) => ({ prompt: e.prompt.trim() })),
        { aspectRatio, durationSeconds: duration, resolution }
      );

      setProject({ ...project, total_fragments: fragments.length });
      setFragments(fragments);
      setView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video project');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New Video Project</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Video Project"
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Reference Image
              </label>

              {imageMode === 'none' ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-200"
                  >
                    <Link className="h-4 w-4" />
                    Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-200"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0 overflow-hidden">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt="Reference"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <Image className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {imageMode === 'url' ? (
                        <input
                          type="url"
                          value={referenceImageUrl}
                          onChange={(e) => setReferenceImageUrl(e.target.value)}
                          placeholder="https://example.com/image.png"
                          autoFocus
                          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-sky-400 focus:ring-sky-200"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                          <Upload className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {selectedFile?.name}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {selectedFile && formatFileSize(selectedFile.size)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {imageMode === 'url' && (
                          <button
                            type="button"
                            onClick={() => {
                              clearImage();
                              setImageMode('file');
                              setTimeout(() => fileInputRef.current?.click(), 50);
                            }}
                            className="text-xs text-sky-600 hover:text-sky-700 transition-colors"
                          >
                            Upload file instead
                          </button>
                        )}
                        {imageMode === 'file' && (
                          <button
                            type="button"
                            onClick={() => {
                              clearImage();
                              setImageMode('url');
                            }}
                            className="text-xs text-sky-600 hover:text-sky-700 transition-colors"
                          >
                            Use URL instead
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Optional. Used as a visual reference for the first video expansion only. Subsequent expansions automatically use the previous video output.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select
                label="Aspect Ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                options={ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
              />
              <Select
                label="Duration"
                value={String(duration)}
                onChange={(e) => setDuration(Number(e.target.value))}
                options={DURATIONS.map((d) => ({
                  value: String(d),
                  label: `${d}s`,
                }))}
              />
              <Select
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
              />
              <Select
                label="Concurrent"
                value={String(maxConcurrent)}
                onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                options={MAX_CONCURRENT_OPTIONS.map((n) => ({
                  value: String(n),
                  label: `${n}`,
                }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Video Expansions</CardTitle>
              <span className="text-xs text-gray-500">
                {validExpansions.length} expansion{validExpansions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>

          <div className="space-y-3">
            {expansions.map((expansion, index) => (
              <div
                key={expansion.id}
                className="group relative flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2 pt-2.5 flex-shrink-0">
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <span className="text-xs font-mono text-gray-400 w-6 text-right">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <textarea
                    value={expansion.prompt}
                    onChange={(e) => {
                      updateExpansionPrompt(expansion.id, e.target.value);
                      e.target.style.height = 'auto';
                      const lineHeight = 20;
                      const maxHeight = lineHeight * 10 + 20;
                      e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                    }}
                    onFocus={(e) => {
                      e.target.style.height = 'auto';
                      const lineHeight = 20;
                      const maxHeight = lineHeight * 10 + 20;
                      e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                    }}
                    placeholder={
                      index === 0
                        ? 'Describe the first video clip...'
                        : `Describe expansion #${index + 1} (continues from previous clip)...`
                    }
                    rows={1}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-sky-400 focus:ring-sky-200 resize-none overflow-y-auto scrollbar-thin"
                    style={{ maxHeight: '220px' }}
                  />
                  {index === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {imageMode !== 'none'
                        ? 'This clip will use your reference image'
                        : 'First clip - generated from prompt only'}
                    </p>
                  )}
                  {index > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Continues from expansion #{index}
                    </p>
                  )}
                </div>

                {expansions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpansion(expansion.id)}
                    className="p-2 mt-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addExpansion}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Video Expansion
          </button>
        </Card>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          icon={loading ? undefined : <Sparkles className="h-5 w-5" />}
          loading={loading}
          onClick={handleCreate}
          disabled={!apiKey || validExpansions.length === 0}
        >
          {uploading
            ? 'Uploading image...'
            : `Create Video Project (${validExpansions.length} expansion${validExpansions.length !== 1 ? 's' : ''})`}
        </Button>
      </div>

      <div className="space-y-6">
        <TimeoutSettings />

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <Plus className="h-3.5 w-3.5 mt-0.5 text-sky-500 flex-shrink-0" />
              Each video expansion extends the previous fragment
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-3.5 w-3.5 mt-0.5 text-sky-500 flex-shrink-0" />
              The reference image is only used for the first clip
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-3.5 w-3.5 mt-0.5 text-sky-500 flex-shrink-0" />
              Keep prompts descriptive and specific
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-3.5 w-3.5 mt-0.5 text-sky-500 flex-shrink-0" />
              Lower concurrency reduces rate limit risk
            </li>
            <li className="flex items-start gap-2">
              <Plus className="h-3.5 w-3.5 mt-0.5 text-sky-500 flex-shrink-0" />
              Generated video URLs expire after 2 days
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
