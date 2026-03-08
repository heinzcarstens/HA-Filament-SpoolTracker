import { useState, useEffect } from 'react';
import { settingsApi, haApi } from '@services/api';
import type { HAConnectionStatus } from '@ha-addon/types';
import './index.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [haStatus, setHaStatus] = useState<HAConnectionStatus | null>(null);
  const [lowThreshold, setLowThreshold] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [settingsRes, haStatusRes] = await Promise.all([
          settingsApi.getAll(),
          haApi.getStatus(),
        ]);
        setSettings(settingsRes.data);
        setHaStatus(haStatusRes.data);
        setLowThreshold(settingsRes.data['low_filament_threshold'] || '100');
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadAll();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.update({
        low_filament_threshold: lowThreshold,
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>
      <p className="page-subtitle">Configure notifications and preferences</p>

      <div className="settings-section">
        <h3 className="section-title">Home Assistant Connection</h3>
        <div className="settings-card">
          <div className="ha-status-row">
            <span className={`ha-status-indicator ${haStatus?.connected ? 'connected' : 'disconnected'}`} />
            <span>{haStatus?.connected ? 'Connected to Home Assistant' : 'Not connected'}</span>
            {haStatus?.connected && (
              <span className="ha-printer-count">{haStatus.printerCount} Bambu printer(s) detected</span>
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="section-title">Notifications</h3>
        <div className="settings-card">
          <div className="form-group">
            <label>Low Filament Threshold (grams)</label>
            <input
              type="number"
              value={lowThreshold}
              onChange={(e) => setLowThreshold(e.target.value)}
              min="0"
              max="5000"
              style={{ maxWidth: 200 }}
            />
            <span className="form-hint">
              Get notified when a spool drops below this weight. Currently: {settings['low_filament_threshold'] || '100'}g
            </span>
          </div>
          <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
