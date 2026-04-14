import type { VeoGenerateRequest, VeoGenerateResponse, VeoPollRequest, VeoPollResponse } from '../lib/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function buildUrl(functionName: string): string {
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function submitGeneration(
  request: VeoGenerateRequest,
  timeoutMs: number = 30000,
  signal?: AbortSignal
): Promise<VeoGenerateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const combinedSignal = signal
    ? AbortSignal.any([controller.signal, signal])
    : controller.signal;

  try {
    const response = await fetch(buildUrl('veo-generate'), {
      method: 'POST',
      headers: buildHeaders(),
      signal: combinedSignal,
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: Record<string, unknown> = {
        status: response.status,
        message: data.error || 'Veo generation failed',
        details: data.details,
      };
      throw error;
    }

    return data as VeoGenerateResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function pollOperation(
  request: VeoPollRequest,
  timeoutMs: number = 15000,
  signal?: AbortSignal
): Promise<VeoPollResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const combinedSignal = signal
    ? AbortSignal.any([controller.signal, signal])
    : controller.signal;

  try {
    const response = await fetch(buildUrl('veo-poll'), {
      method: 'POST',
      headers: buildHeaders(),
      signal: combinedSignal,
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: Record<string, unknown> = {
        status: response.status,
        message: data.error || 'Veo polling failed',
        details: data.details,
      };
      throw error;
    }

    return data as VeoPollResponse;
  } finally {
    clearTimeout(timeout);
  }
}
