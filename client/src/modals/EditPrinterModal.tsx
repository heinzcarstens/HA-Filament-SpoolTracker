import { useState, useEffect, useCallback } from 'react';
import type { Printer, HADiscoveredEntity } from '@ha-addon/types';
import './Modal.css';

const ENTITY_SUFFIXES = {
  entityPrintStatus: '_print_status',
  entityTaskName: '_task_name',
  entityPrintWeight: '_print_weight',
  entityCoverImage: '_cover_image',
} as const;

export type EditPrinterSaveData = {
  name: string;
  entityPrefix: string;
  haDeviceId: string;
  model?: string;
  entityPrintStatus?: string | null;
  entityTaskName?: string | null;
  entityPrintWeight?: string | null;
  entityCoverImage?: string | null;
};

interface EditPrinterModalProps {
  printer: Printer;
  onSave: (data: EditPrinterSaveData) => void;
  onClose: () => void;
  onDiscover?: () => Promise<HADiscoveredEntity[]>;
  /** Optional: fetch current HA state for entity IDs. Used to show "current value" in monitored entities. */
  onFetchEntityStates?: (entityIds: string[]) => Promise<Record<string, string | null>>;
}

function pickEntityBySuffix(entities: string[], suffix: string): string | null {
  const found = entities.find((e) => e.endsWith(suffix));
  return found ?? null;
}

export default function EditPrinterModal({ printer, onSave, onClose, onDiscover, onFetchEntityStates }: EditPrinterModalProps) {
  const [name, setName] = useState(printer.name);
  const [entityPrefix, setEntityPrefix] = useState(printer.entityPrefix);
  const [haDeviceId, setHaDeviceId] = useState(printer.haDeviceId);
  const [model, setModel] = useState(printer.model || '');
  const [entityPrintStatus, setEntityPrintStatus] = useState(printer.entityPrintStatus ?? '');
  const [entityTaskName, setEntityTaskName] = useState(printer.entityTaskName ?? '');
  const [entityPrintWeight, setEntityPrintWeight] = useState(printer.entityPrintWeight ?? '');
  const [entityCoverImage, setEntityCoverImage] = useState(printer.entityCoverImage ?? '');
  const [discovering, setDiscovering] = useState(false);
  const [entityStates, setEntityStates] = useState<Record<string, string | null>>({});
  const [entityStatesLoading, setEntityStatesLoading] = useState(false);

  useEffect(() => {
    setName(printer.name);
    setEntityPrefix(printer.entityPrefix);
    setHaDeviceId(printer.haDeviceId);
    setModel(printer.model || '');
    setEntityPrintStatus(printer.entityPrintStatus ?? '');
    setEntityTaskName(printer.entityTaskName ?? '');
    setEntityPrintWeight(printer.entityPrintWeight ?? '');
    setEntityCoverImage(printer.entityCoverImage ?? '');
  }, [printer]);

  const prefix = entityPrefix.trim();
  const derived = (suffix: string) => (prefix ? `sensor.${prefix}${suffix}` : '—');

  const effectiveEntity = (
    override: string,
    suffix: string,
  ) => (override.trim() ? override.trim() : (prefix ? `sensor.${prefix}${suffix}` : ''));

  const getEffectiveIds = useCallback(() => {
    const p = entityPrefix.trim();
    const e = (o: string, s: string) => (o.trim() ? o.trim() : p ? `sensor.${p}${s}` : '');
    return [
      e(entityPrintStatus, ENTITY_SUFFIXES.entityPrintStatus) || (p ? `sensor.${p}${ENTITY_SUFFIXES.entityPrintStatus}` : ''),
      e(entityTaskName, ENTITY_SUFFIXES.entityTaskName) || (p ? `sensor.${p}${ENTITY_SUFFIXES.entityTaskName}` : ''),
      e(entityPrintWeight, ENTITY_SUFFIXES.entityPrintWeight) || (p ? `sensor.${p}${ENTITY_SUFFIXES.entityPrintWeight}` : ''),
      e(entityCoverImage, ENTITY_SUFFIXES.entityCoverImage) || (p ? `sensor.${p}${ENTITY_SUFFIXES.entityCoverImage}` : ''),
    ].filter(Boolean) as string[];
  }, [entityPrefix, entityPrintStatus, entityTaskName, entityPrintWeight, entityCoverImage]);

  const fetchEntityStates = useCallback(() => {
    const ids = getEffectiveIds();
    if (!onFetchEntityStates || ids.length === 0) return;
    setEntityStatesLoading(true);
    onFetchEntityStates(ids)
      .then((data) => setEntityStates(data))
      .catch(() => setEntityStates({}))
      .finally(() => setEntityStatesLoading(false));
  }, [onFetchEntityStates, getEffectiveIds]);

  useEffect(() => {
    if (onFetchEntityStates && getEffectiveIds().length > 0) fetchEntityStates();
    else setEntityStates({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch only when modal opens for this printer
  }, [printer.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      entityPrefix: prefix,
      haDeviceId: haDeviceId.trim(),
      model: model.trim() || undefined,
      entityPrintStatus: entityPrintStatus.trim() || null,
      entityTaskName: entityTaskName.trim() || null,
      entityPrintWeight: entityPrintWeight.trim() || null,
      entityCoverImage: entityCoverImage.trim() || null,
    });
  };

  const handleDiscover = async () => {
    if (!onDiscover) return;
    const prefix = entityPrefix.trim();
    const deviceId = haDeviceId.trim();
    if (!prefix && !deviceId) return;
    setDiscovering(true);
    try {
      const list = await onDiscover();
      const match = list.find((e) => e.deviceId === prefix || e.deviceId === deviceId);
      if (!match) {
        setDiscovering(false);
        return;
      }
      const defaultId = (suffix: string) => (prefix ? `sensor.${prefix}${suffix}` : '');
      const setOverride = (
        discovered: string | null,
        suffix: string,
        setter: (v: string) => void,
      ) => {
        const def = defaultId(suffix);
        if (!discovered || discovered === def) setter('');
        else setter(discovered);
      };
      setOverride(pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityPrintStatus), ENTITY_SUFFIXES.entityPrintStatus, setEntityPrintStatus);
      setOverride(pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityTaskName), ENTITY_SUFFIXES.entityTaskName, setEntityTaskName);
      setOverride(pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityPrintWeight), ENTITY_SUFFIXES.entityPrintWeight, setEntityPrintWeight);
      setOverride(pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityCoverImage), ENTITY_SUFFIXES.entityCoverImage, setEntityCoverImage);
      if (onFetchEntityStates) {
        const ids = [
          defaultId(ENTITY_SUFFIXES.entityPrintStatus),
          defaultId(ENTITY_SUFFIXES.entityTaskName),
          defaultId(ENTITY_SUFFIXES.entityPrintWeight),
          defaultId(ENTITY_SUFFIXES.entityCoverImage),
        ].filter(Boolean);
        const overrides = [
          pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityPrintStatus),
          pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityTaskName),
          pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityPrintWeight),
          pickEntityBySuffix(match.entities, ENTITY_SUFFIXES.entityCoverImage),
        ];
        const effectiveIds = ids.map((def, i) => overrides[i] && overrides[i] !== def ? overrides[i]! : def).filter(Boolean);
        if (effectiveIds.length > 0) {
          onFetchEntityStates(effectiveIds).then((data) => setEntityStates(data)).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to re-discover entities:', err);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Printer</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bambu X1C"
            />
          </div>
          <div className="form-group">
            <label>Entity Prefix</label>
            <input
              type="text"
              value={entityPrefix}
              onChange={(e) => setEntityPrefix(e.target.value)}
              placeholder="e.g., p2s_00m09a360200242"
            />
            <span className="form-hint">
              Prefix used to match state changes. Must match your HA entity IDs (e.g. sensor.<strong>{entityPrefix || '…'}</strong>_print_status).
            </span>
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., X1 Carbon"
            />
          </div>
          <div className="form-group">
            <label>HA Device ID</label>
            <input
              type="text"
              value={haDeviceId}
              onChange={(e) => setHaDeviceId(e.target.value)}
              placeholder="e.g., p2s_00m09a360200242"
            />
            <span className="form-hint">
              Unique device identifier in Home Assistant. Usually same as Entity Prefix.
            </span>
          </div>

          <div className="form-group monitored-entities">
            <div className="monitored-entities-header">
              <label>Monitored entities</label>
              <div className="monitored-entities-header-actions">
                {onDiscover && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDiscover}
                    disabled={discovering}
                  >
                    {discovering ? 'Loading…' : 'Re-discover'}
                  </button>
                )}
                {onFetchEntityStates && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={fetchEntityStates}
                    disabled={entityStatesLoading || !prefix}
                  >
                    {entityStatesLoading ? 'Loading…' : 'Refresh values'}
                  </button>
                )}
              </div>
            </div>
            <p className="form-hint">
              Entity IDs used for print status, task name, print weight, and cover image. Leave override empty to use the default <code>sensor.{prefix || '…'}_*</code>.
            </p>
            <div className="monitored-entity-rows">
              <div className="monitored-entity-row">
                <span className="monitored-entity-label">Print status</span>
                <div className="monitored-entity-effective-line">
                  <code className="monitored-entity-effective">
                    {effectiveEntity(entityPrintStatus, ENTITY_SUFFIXES.entityPrintStatus) || derived(ENTITY_SUFFIXES.entityPrintStatus)}
                  </code>
                  {(effectiveEntity(entityPrintStatus, ENTITY_SUFFIXES.entityPrintStatus) || (prefix && `sensor.${prefix}${ENTITY_SUFFIXES.entityPrintStatus}`)) && (
                    <span className="monitored-entity-current">
                      · Current value: {entityStatesLoading ? '…' : (entityStates[effectiveEntity(entityPrintStatus, ENTITY_SUFFIXES.entityPrintStatus) || `sensor.${prefix}${ENTITY_SUFFIXES.entityPrintStatus}`] ?? '—')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={entityPrintStatus}
                  onChange={(e) => setEntityPrintStatus(e.target.value)}
                  placeholder={derived(ENTITY_SUFFIXES.entityPrintStatus)}
                  className="monitored-entity-override"
                />
              </div>
              <div className="monitored-entity-row">
                <span className="monitored-entity-label">Task name</span>
                <div className="monitored-entity-effective-line">
                  <code className="monitored-entity-effective">
                    {effectiveEntity(entityTaskName, ENTITY_SUFFIXES.entityTaskName) || derived(ENTITY_SUFFIXES.entityTaskName)}
                  </code>
                  {(effectiveEntity(entityTaskName, ENTITY_SUFFIXES.entityTaskName) || (prefix && `sensor.${prefix}${ENTITY_SUFFIXES.entityTaskName}`)) && (
                    <span className="monitored-entity-current">
                      · Current value: {entityStatesLoading ? '…' : (entityStates[effectiveEntity(entityTaskName, ENTITY_SUFFIXES.entityTaskName) || `sensor.${prefix}${ENTITY_SUFFIXES.entityTaskName}`] ?? '—')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={entityTaskName}
                  onChange={(e) => setEntityTaskName(e.target.value)}
                  placeholder={derived(ENTITY_SUFFIXES.entityTaskName)}
                  className="monitored-entity-override"
                />
              </div>
              <div className="monitored-entity-row">
                <span className="monitored-entity-label">Print weight</span>
                <div className="monitored-entity-effective-line">
                  <code className="monitored-entity-effective">
                    {effectiveEntity(entityPrintWeight, ENTITY_SUFFIXES.entityPrintWeight) || derived(ENTITY_SUFFIXES.entityPrintWeight)}
                  </code>
                  {(effectiveEntity(entityPrintWeight, ENTITY_SUFFIXES.entityPrintWeight) || (prefix && `sensor.${prefix}${ENTITY_SUFFIXES.entityPrintWeight}`)) && (
                    <span className="monitored-entity-current">
                      · Current value: {entityStatesLoading ? '…' : (entityStates[effectiveEntity(entityPrintWeight, ENTITY_SUFFIXES.entityPrintWeight) || `sensor.${prefix}${ENTITY_SUFFIXES.entityPrintWeight}`] ?? '—')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={entityPrintWeight}
                  onChange={(e) => setEntityPrintWeight(e.target.value)}
                  placeholder={derived(ENTITY_SUFFIXES.entityPrintWeight)}
                  className="monitored-entity-override"
                />
              </div>
              <div className="monitored-entity-row">
                <span className="monitored-entity-label">Cover image</span>
                <div className="monitored-entity-effective-line">
                  <code className="monitored-entity-effective">
                    {effectiveEntity(entityCoverImage, ENTITY_SUFFIXES.entityCoverImage) || derived(ENTITY_SUFFIXES.entityCoverImage)}
                  </code>
                  {(effectiveEntity(entityCoverImage, ENTITY_SUFFIXES.entityCoverImage) || (prefix && `sensor.${prefix}${ENTITY_SUFFIXES.entityCoverImage}`)) && (
                    <span className="monitored-entity-current">
                      · Current value: {entityStatesLoading ? '…' : (entityStates[effectiveEntity(entityCoverImage, ENTITY_SUFFIXES.entityCoverImage) || `sensor.${prefix}${ENTITY_SUFFIXES.entityCoverImage}`] ?? '—')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={entityCoverImage}
                  onChange={(e) => setEntityCoverImage(e.target.value)}
                  placeholder={derived(ENTITY_SUFFIXES.entityCoverImage)}
                  className="monitored-entity-override"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
