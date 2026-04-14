import { useRef, useCallback, useState } from 'react';
import { submitGeneration, pollOperation } from '../services/veoApi';
import {
  updateFragmentStatus,
  setFragmentOperation,
  setFragmentCompleted,
  setFragmentFailed,
  incrementRetryCount,
  getNextPendingFragments,
  cancelPendingFragments,
} from '../services/fragmentService';
import { updateProjectStatus, updateProjectCounts } from '../services/projectService';
import { withRetry, isRateLimited, sleep } from '../services/retryEngine';
import type { Fragment, TimeoutConfig, LogEntry } from '../lib/types';

interface ProcessorOptions {
  projectId: string;
  apiKey: string;
  timeoutConfig: TimeoutConfig;
  maxConcurrent: number;
  model?: string;
  referenceImageUrl?: string;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onFragmentUpdate: (fragment: Partial<Fragment> & { id: string }) => void;
}

export function useFragmentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const batchStartTimeRef = useRef<number>(0);

  const processFragment = useCallback(
    async (fragment: Fragment, options: ProcessorOptions) => {
      const { apiKey, timeoutConfig, model, referenceImageUrl, onLog, onFragmentUpdate } = options;
      const signal = abortControllerRef.current?.signal;

      try {
        await updateFragmentStatus(fragment.id, 'submitting', {
          submitted_at: new Date().toISOString(),
        } as Partial<Fragment>);
        onFragmentUpdate({ id: fragment.id, status: 'submitting' });
        onLog({
          level: 'info',
          message: `Fragment #${fragment.sequence_order}: Submitting to Veo API`,
          fragmentId: fragment.id,
        });

        const isFirstFragment = fragment.sequence_order === 1;

        const generateResponse = await withRetry(
          () =>
            submitGeneration(
              {
                prompt: fragment.prompt,
                aspectRatio: fragment.aspect_ratio,
                durationSeconds: fragment.duration_seconds,
                resolution: fragment.resolution,
                personGeneration: fragment.person_generation,
                apiKey,
                model,
                referenceImageUrl: isFirstFragment ? referenceImageUrl : undefined,
              },
              timeoutConfig.submission_timeout_ms,
              signal
            ),
          {
            maxRetries: timeoutConfig.rate_limit_max_retries,
            baseDelay: timeoutConfig.rate_limit_base_delay_ms,
            maxDelay: timeoutConfig.rate_limit_max_delay_ms,
            signal,
            onRetry: (attempt, delay, error) => {
              const isRate = isRateLimited(error);
              onLog({
                level: 'warn',
                message: `Fragment #${fragment.sequence_order}: ${isRate ? 'Rate limited' : 'Retrying'}, attempt ${attempt}, waiting ${Math.round(delay / 1000)}s`,
                fragmentId: fragment.id,
              });
            },
          }
        );

        await setFragmentOperation(fragment.id, generateResponse.operationName);
        onFragmentUpdate({
          id: fragment.id,
          status: 'polling',
          veo_operation_name: generateResponse.operationName,
        });
        onLog({
          level: 'info',
          message: `Fragment #${fragment.sequence_order}: Polling for completion`,
          fragmentId: fragment.id,
        });

        const pollingStart = Date.now();

        while (true) {
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

          const elapsed = Date.now() - pollingStart;
          if (elapsed > timeoutConfig.polling_timeout_ms) {
            throw new Error(
              `Polling timeout: ${Math.round(timeoutConfig.polling_timeout_ms / 1000)}s exceeded`
            );
          }

          const pollResponse = await withRetry(
            () =>
              pollOperation(
                { operationName: generateResponse.operationName, apiKey },
                15000,
                signal
              ),
            {
              maxRetries: timeoutConfig.rate_limit_max_retries,
              baseDelay: timeoutConfig.rate_limit_base_delay_ms,
              maxDelay: timeoutConfig.rate_limit_max_delay_ms,
              signal,
              onRetry: (attempt, delay) => {
                onLog({
                  level: 'warn',
                  message: `Fragment #${fragment.sequence_order}: Poll retry ${attempt}, waiting ${Math.round(delay / 1000)}s`,
                  fragmentId: fragment.id,
                });
              },
            }
          );

          if (pollResponse.done) {
            if (pollResponse.videoUrl) {
              await setFragmentCompleted(
                fragment.id,
                pollResponse.videoUrl,
                pollResponse.videoUri
              );
              onFragmentUpdate({
                id: fragment.id,
                status: 'completed',
                video_url: pollResponse.videoUrl,
              });
              onLog({
                level: 'success',
                message: `Fragment #${fragment.sequence_order}: Video generated (${Math.round(elapsed / 1000)}s)`,
                fragmentId: fragment.id,
              });
            } else {
              throw new Error('Video generation completed but no video URL returned');
            }
            return;
          }

          await sleep(timeoutConfig.polling_interval_ms, signal);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          onLog({
            level: 'warn',
            message: `Fragment #${fragment.sequence_order}: Cancelled`,
            fragmentId: fragment.id,
          });
          return;
        }

        const errorMsg = error instanceof Error ? error.message : String(error);

        if (fragment.retry_count < fragment.max_retries) {
          await incrementRetryCount(fragment.id);
          onFragmentUpdate({ id: fragment.id, status: 'pending' });
          onLog({
            level: 'warn',
            message: `Fragment #${fragment.sequence_order}: Failed (${errorMsg}), retrying (${fragment.retry_count + 1}/${fragment.max_retries})`,
            fragmentId: fragment.id,
          });
        } else {
          const status = errorMsg.includes('timeout') ? 'timed_out' : 'failed';
          await setFragmentFailed(fragment.id, errorMsg);
          await updateFragmentStatus(fragment.id, status);
          onFragmentUpdate({ id: fragment.id, status, error_message: errorMsg });
          onLog({
            level: 'error',
            message: `Fragment #${fragment.sequence_order}: ${status === 'timed_out' ? 'Timed out' : 'Failed'} - ${errorMsg}`,
            fragmentId: fragment.id,
          });
        }
      }
    },
    []
  );

  const start = useCallback(async (options: ProcessorOptions) => {
    const { projectId, maxConcurrent, timeoutConfig, onLog } = options;
    cancelledRef.current = false;
    pausedRef.current = false;
    batchStartTimeRef.current = Date.now();

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    setIsPaused(false);

    await updateProjectStatus(projectId, 'running');
    onLog({ level: 'info', message: 'Batch processing started' });

    const activeSet = new Set<string>();

    const updateActive = (id: string, add: boolean) => {
      if (add) activeSet.add(id);
      else activeSet.delete(id);
      setActiveIds(new Set(activeSet));
    };

    try {
      while (!cancelledRef.current) {
        if (pausedRef.current) {
          await sleep(1000, abortControllerRef.current.signal);
          continue;
        }

        const batchElapsed = Date.now() - batchStartTimeRef.current;
        if (batchElapsed > timeoutConfig.max_total_batch_time_ms) {
          onLog({
            level: 'error',
            message: `Batch timeout: ${Math.round(timeoutConfig.max_total_batch_time_ms / 3600000)}h exceeded`,
          });
          await cancelPendingFragments(projectId);
          break;
        }

        const slotsAvailable = maxConcurrent - activeSet.size;
        if (slotsAvailable <= 0) {
          await sleep(1000, abortControllerRef.current.signal);
          continue;
        }

        const pending = await getNextPendingFragments(projectId, slotsAvailable);

        if (pending.length === 0 && activeSet.size === 0) {
          break;
        }

        if (pending.length === 0) {
          await sleep(2000, abortControllerRef.current.signal);
          continue;
        }

        for (const fragment of pending) {
          updateActive(fragment.id, true);

          processFragment(fragment, options).then(async () => {
            updateActive(fragment.id, false);
            await updateProjectCounts(projectId);
          });
        }

        await sleep(500, abortControllerRef.current.signal);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        onLog({
          level: 'error',
          message: `Batch error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    while (activeSet.size > 0) {
      await new Promise((r) => setTimeout(r, 500));
    }

    await updateProjectCounts(projectId);

    const finalStatus = cancelledRef.current ? 'failed' : 'completed';
    await updateProjectStatus(projectId, finalStatus);

    onLog({
      level: finalStatus === 'completed' ? 'success' : 'warn',
      message: `Batch ${finalStatus}`,
    });

    setIsProcessing(false);
    setIsPaused(false);
    setActiveIds(new Set());
  }, [processFragment]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  const cancel = useCallback(async (projectId: string) => {
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    await cancelPendingFragments(projectId);
  }, []);

  return { isProcessing, isPaused, activeIds, start, pause, resume, cancel };
}
