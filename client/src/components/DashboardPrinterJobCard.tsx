import { Link } from 'react-router-dom';
import type { PrintJob } from '@ha-addon/types';
import { getApiBaseURL } from '../services/api';
import ProgressBar from './ProgressBar';
import './DashboardPrinterJobCard.css';

function projectImageSrc(projectImage: string | null): string | undefined {
  if (!projectImage) return undefined;
  if (projectImage.startsWith('http://') || projectImage.startsWith('https://')) return projectImage;
  const base = getApiBaseURL();
  return base.endsWith('/') ? base + projectImage.replace(/^\//, '') : base + (projectImage.startsWith('/') ? projectImage : '/' + projectImage);
}

function formatFilamentFromLive(live: string | null | undefined, jobUsed: number | null | undefined): string {
  if (live != null && String(live).trim() !== '') {
    const cleaned = String(live).replace(/g/gi, '').trim();
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n)) return `${Math.round(n)}g`;
    return String(live).trim();
  }
  if (jobUsed != null) return `${Math.round(jobUsed)}g`;
  return '—';
}

export interface DashboardPrinterJobCardProps {
  job: PrintJob | null;
  live?: { eta: string | null; filamentGrams: string | null } | null;
}

export default function DashboardPrinterJobCard({ job, live }: DashboardPrinterJobCardProps) {
  if (!job) {
    return (
      <div className="dashboard-printer-job-card dashboard-printer-job-card--idle">
        <span className="dashboard-printer-job-idle">No active print</span>
        <Link to="/history" className="dashboard-printer-job-link">History</Link>
      </div>
    );
  }

  const img = projectImageSrc(job.projectImage);
  const hasProgress = job.progress != null && !Number.isNaN(job.progress);
  const progress = hasProgress ? job.progress! : 0;
  const eta = live?.eta != null && String(live.eta).trim() !== '' ? String(live.eta).trim() : '—';
  const filament = formatFilamentFromLive(live?.filamentGrams, job.filamentUsed);

  return (
    <div className="dashboard-printer-job-card">
      <div className="dashboard-printer-job-media">
        {img ? (
          <img src={img} alt="" className="dashboard-printer-job-image" />
        ) : (
          <div className="dashboard-printer-job-image dashboard-printer-job-image--placeholder" aria-hidden />
        )}
      </div>
      <div className="dashboard-printer-job-body">
        <div className="dashboard-printer-job-head">
          <h4 className="dashboard-printer-job-title" title={job.projectName}>{job.projectName}</h4>
          <Link to="/history?status=in_progress" className="dashboard-printer-job-link">Open</Link>
        </div>
        <div className="dashboard-printer-job-progress">
          <ProgressBar
            value={progress}
            max={100}
            size="sm"
            showPercent
            indeterminate={!hasProgress}
          />
        </div>
        <dl className="dashboard-printer-job-stats">
          <div className="dashboard-printer-job-stat">
            <dt>ETA</dt>
            <dd>{eta}</dd>
          </div>
          <div className="dashboard-printer-job-stat">
            <dt>Filament used</dt>
            <dd>{filament}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
