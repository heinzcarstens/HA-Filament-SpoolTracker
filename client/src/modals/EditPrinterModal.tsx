import { useState, useEffect } from 'react';
import type { Printer } from '@ha-addon/types';
import './Modal.css';

interface EditPrinterModalProps {
  printer: Printer;
  onSave: (data: { name: string; entityPrefix: string; model?: string }) => void;
  onClose: () => void;
}

export default function EditPrinterModal({ printer, onSave, onClose }: EditPrinterModalProps) {
  const [name, setName] = useState(printer.name);
  const [entityPrefix, setEntityPrefix] = useState(printer.entityPrefix);
  const [model, setModel] = useState(printer.model || '');

  useEffect(() => {
    setName(printer.name);
    setEntityPrefix(printer.entityPrefix);
    setModel(printer.model || '');
  }, [printer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      entityPrefix: entityPrefix.trim(),
      model: model.trim() || undefined,
    });
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
              placeholder="e.g., bambu_x1c_01s"
            />
            <span className="form-hint">
              HA entity ID prefix used to match state changes from this printer
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
            <input type="text" value={printer.haDeviceId} disabled />
            <span className="form-hint">
              Auto-assigned during discovery, cannot be changed
            </span>
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
