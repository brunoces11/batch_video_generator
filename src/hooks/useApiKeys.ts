import { useState, useEffect, useCallback } from 'react';
import type { ApiKeyEntry } from '../lib/types';
import {
  listApiKeys,
  addApiKey as addApiKeyService,
  deleteApiKey as deleteApiKeyService,
  setDefaultApiKey,
  seedApiKeyFromEnv,
} from '../services/apiKeyService';

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await seedApiKeyFromEnv();
      const data = await listApiKeys();
      setKeys(data);

      const defaultKey = data.find((k) => k.is_default);
      if (defaultKey) {
        setSelectedKeyId(defaultKey.id);
      } else if (data.length > 0) {
        setSelectedKeyId(data[0].id);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedKey = keys.find((k) => k.id === selectedKeyId) || null;
  const apiKey = selectedKey?.api_key || '';

  const selectKey = useCallback(
    (id: string) => {
      setSelectedKeyId(id);
      setDefaultApiKey(id).catch(() => {});
    },
    []
  );

  const addKey = useCallback(
    async (label: string, key: string) => {
      const entry = await addApiKeyService(label, key);
      setKeys((prev) => [...prev, entry]);
      if (!selectedKeyId) {
        setSelectedKeyId(entry.id);
      }
      return entry;
    },
    [selectedKeyId]
  );

  const removeKey = useCallback(
    async (id: string) => {
      await deleteApiKeyService(id);
      setKeys((prev) => {
        const next = prev.filter((k) => k.id !== id);
        if (selectedKeyId === id && next.length > 0) {
          setSelectedKeyId(next[0].id);
        } else if (next.length === 0) {
          setSelectedKeyId(null);
        }
        return next;
      });
    },
    [selectedKeyId]
  );

  return {
    keys,
    selectedKey,
    selectedKeyId,
    apiKey,
    loading,
    selectKey,
    addKey,
    removeKey,
  };
}
