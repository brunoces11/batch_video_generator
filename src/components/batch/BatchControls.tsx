import { useState } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useBatch } from '../../context/BatchContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function BatchControls() {
  const {
    isProcessing,
    isPaused,
    project,
    apiKey,
    startBatch,
    pauseBatch,
    resumeBatch,
    cancelBatch,
  } = useBatch();
  const [showCancel, setShowCancel] = useState(false);

  const canStart =
    !isProcessing && project?.status !== 'completed' && apiKey.length > 0;

  return (
    <>
      <div className="flex items-center gap-3">
        {!isProcessing && canStart && (
          <Button
            variant="success"
            icon={<Play className="h-4 w-4" />}
            onClick={startBatch}
          >
            {project?.status === 'paused' ? 'Resume' : 'Start Processing'}
          </Button>
        )}

        {isProcessing && !isPaused && (
          <Button
            variant="warning"
            icon={<Pause className="h-4 w-4" />}
            onClick={pauseBatch}
          >
            Pause
          </Button>
        )}

        {isProcessing && isPaused && (
          <Button
            variant="success"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={resumeBatch}
          >
            Resume
          </Button>
        )}

        {isProcessing && (
          <Button
            variant="danger"
            icon={<Square className="h-4 w-4" />}
            onClick={() => setShowCancel(true)}
          >
            Cancel
          </Button>
        )}

        {!isProcessing && !apiKey && project?.status !== 'completed' && (
          <p className="text-sm text-amber-600">
            Enter your API key in the top bar to start
          </p>
        )}
      </div>

      <Modal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Processing"
      >
        <p className="text-sm text-gray-600 mb-4">
          This will cancel all pending video expansions. In-progress expansions
          will complete. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCancel(false)}>
            Keep Running
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              cancelBatch();
              setShowCancel(false);
            }}
          >
            Cancel Processing
          </Button>
        </div>
      </Modal>
    </>
  );
}
