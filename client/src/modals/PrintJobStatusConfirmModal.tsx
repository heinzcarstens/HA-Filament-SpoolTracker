import type { PrintJob, PrintJobStatus } from '@ha-addon/types';
import './Modal.css';

export type StatusChangeApplyOptions = {
  skipFilamentDeduction?: boolean;
  restoreFilament?: boolean;
};

const STATUS_LABEL: Record<PrintJobStatus, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

interface PrintJobStatusConfirmModalProps {
  job: PrintJob;
  nextStatus: PrintJobStatus;
  onCancel: () => void;
  onApply: (options: StatusChangeApplyOptions) => void;
}

export default function PrintJobStatusConfirmModal({
  job,
  nextStatus,
  onCancel,
  onApply,
}: PrintJobStatusConfirmModalProps) {
  const prev = job.status as PrintJobStatus;
  const nextLabel = STATUS_LABEL[nextStatus];
  const spoolName = job.spool?.name;
  const g = job.filamentUsed != null && job.filamentUsed > 0 ? Math.round(job.filamentUsed) : null;

  const isComplete = nextStatus === 'completed';
  const leavingComplete = prev === 'completed' && nextStatus !== 'completed';
  const canDeduct = isComplete && !!job.spoolId && g != null;
  const canRestore = leavingComplete && !!job.spoolId && g != null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Change print status</h3>
        <p className="modal-message">
          Set <strong>{job.projectName}</strong> from <strong>{STATUS_LABEL[prev]}</strong> to{' '}
          <strong>{nextLabel}</strong>.
        </p>
        {canDeduct && (
          <p className="modal-message print-job-status-confirm-hint">
            This job is linked to {spoolName ? <strong>{spoolName}</strong> : 'a spool'} with{' '}
            <strong>{g}g</strong> recorded as used. Completing can <strong>deduct</strong> that amount from the
            spool&apos;s remaining weight, or you can complete <strong>without</strong> changing the spool.
          </p>
        )}
        {canRestore && (
          <p className="modal-message print-job-status-confirm-hint">
            This job was completed with <strong>{g}g</strong> recorded
            {spoolName ? <> on <strong>{spoolName}</strong></> : ''}. If filament was deducted when it was
            completed, you can <strong>restore</strong> that weight to the spool; otherwise choose status only.
          </p>
        )}
        <div className="print-job-status-modal-actions">
          {canDeduct && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onApply({})}>
                Complete and deduct {g}g{spoolName ? ` from ${spoolName}` : ''}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onApply({ skipFilamentDeduction: true })}
              >
                Complete without deducting filament
              </button>
            </>
          )}
          {canRestore && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onApply({ restoreFilament: true })}>
                Restore {g}g{spoolName ? ` to ${spoolName}` : ''} and set to {nextLabel}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onApply({})}
              >
                Set to {nextLabel} only (no filament change)
              </button>
            </>
          )}
          {!canDeduct && !canRestore && (
            <button type="button" className="btn btn-primary" onClick={() => onApply({})}>
              Confirm
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
