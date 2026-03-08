import { useState, useEffect } from 'react';
import { printersApi, haApi } from '@services/api';
import type { Printer, HAConnectionStatus, HADiscoveredEntity } from '@ha-addon/types';
import './index.css';

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [haStatus, setHaStatus] = useState<HAConnectionStatus | null>(null);
  const [discoveredEntities, setDiscoveredEntities] = useState<HADiscoveredEntity[]>([]);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [printersRes, haStatusRes] = await Promise.all([
          printersApi.getAll(),
          haApi.getStatus(),
        ]);
        setPrinters(printersRes.data);
        setHaStatus(haStatusRes.data);
      } catch (err) {
        console.error('Failed to load printers:', err);
      }
    };
    loadAll();
  }, []);

  const handleDiscoverEntities = async () => {
    setDiscovering(true);
    try {
      const response = await haApi.getEntities();
      setDiscoveredEntities(response.data);
    } catch (err) {
      console.error('Failed to discover entities:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const handleRegisterPrinter = async (entity: HADiscoveredEntity) => {
    try {
      await printersApi.create({
        name: entity.deviceName,
        haDeviceId: entity.deviceId,
        entityPrefix: entity.deviceId,
        model: entity.model || undefined,
      });
      const res = await printersApi.getAll();
      setPrinters(res.data);
    } catch (err) {
      console.error('Failed to register printer:', err);
    }
  };

  const handleDeletePrinter = async (id: string) => {
    try {
      await printersApi.delete(id);
      setPrinters((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete printer:', err);
    }
  };

  const unregistered = discoveredEntities.filter(
    (e) => !printers.some((p) => p.haDeviceId === e.deviceId)
  );

  return (
    <div className="printers-page">
      <h2 className="page-title">Printers</h2>
      <p className="page-subtitle">Manage your Bambu Lab printers connected to Home Assistant</p>

      <div className="printers-section">
        <div className="ha-connection-bar">
          <span className={`ha-dot ${haStatus?.connected ? 'connected' : 'disconnected'}`} />
          <span>{haStatus?.connected ? 'Connected to Home Assistant' : 'Not connected'}</span>
          {haStatus?.connected && (
            <span className="ha-detected">{haStatus.printerCount} printer(s) detected</span>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleDiscoverEntities} disabled={discovering}>
            {discovering ? 'Discovering...' : 'Discover Printers'}
          </button>
        </div>
      </div>

      {printers.length > 0 && (
        <div className="printers-section">
          <h3 className="section-title">Registered Printers</h3>
          <div className="printer-cards">
            {printers.map((printer) => (
              <div key={printer.id} className="printer-card">
                <div className="printer-card-icon">🖨️</div>
                <div className="printer-card-info">
                  <span className="printer-card-name">{printer.name}</span>
                  <span className="printer-card-model">{printer.model || 'Unknown model'}</span>
                  <span className="printer-card-entity">{printer.entityPrefix}</span>
                </div>
                <div className="printer-card-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePrinter(printer.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unregistered.length > 0 && (
        <div className="printers-section">
          <h3 className="section-title">Available to Register</h3>
          <div className="printer-cards">
            {unregistered.map((entity) => (
              <div key={entity.deviceId} className="printer-card printer-card-discovered">
                <div className="printer-card-icon">🔍</div>
                <div className="printer-card-info">
                  <span className="printer-card-name">{entity.deviceName}</span>
                  <span className="printer-card-model">{entity.model || 'Bambu Lab'}</span>
                  <span className="printer-card-entity">{entity.entities.length} entities</span>
                </div>
                <div className="printer-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleRegisterPrinter(entity)}>
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {printers.length === 0 && unregistered.length === 0 && (
        <div className="printers-empty">
          <p>No printers found. Click "Discover Printers" to find Bambu Lab printers from Home Assistant.</p>
        </div>
      )}
    </div>
  );
}
