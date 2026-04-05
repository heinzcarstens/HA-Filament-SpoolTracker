import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md';
  /** Animated bar when percentage is not yet known (e.g. waiting for HA). */
  indeterminate?: boolean;
}

export default function ProgressBar({
  value,
  max,
  label,
  showPercent = true,
  size = 'md',
  indeterminate = false,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const getColor = () => {
    if (percent <= 10) return 'var(--error-color)';
    if (percent <= 25) return 'var(--warning-color)';
    return 'var(--accent-primary)';
  };

  if (indeterminate) {
    return (
      <div className={`progress-bar-container ${size} progress-bar-container--indeterminate`}>
        {label && <span className="progress-bar-label">{label}</span>}
        <div className="progress-bar-track">
          <div className="progress-bar-fill progress-bar-fill--indeterminate" />
        </div>
        {showPercent && <span className="progress-bar-value progress-bar-value--muted">—</span>}
      </div>
    );
  }

  return (
    <div className={`progress-bar-container ${size}`}>
      {label && <span className="progress-bar-label">{label}</span>}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%`, backgroundColor: getColor() }}
        />
      </div>
      {showPercent && <span className="progress-bar-value">{Math.round(percent)}%</span>}
    </div>
  );
}
