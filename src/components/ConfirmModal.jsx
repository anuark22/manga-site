import React from 'react';
import '../styles/ConfirmModal.scss';

const ConfirmModal = ({
  isOpen,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const iconClass =
    variant === 'danger'
      ? 'fa-trash'
      : variant === 'warning'
      ? 'fa-exclamation-triangle'
      : 'fa-question-circle';

  return (
    <div
      className="oms-confirm-backdrop"
      onClick={() => !loading && onCancel?.()}
      role="dialog"
      aria-modal="true"
    >
      <div className="oms-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`oms-confirm-icon ${variant}`}>
          <i className={`fa ${iconClass}`} aria-hidden="true"></i>
        </div>

        <h3 className="oms-confirm-title">{title}</h3>
        <p className="oms-confirm-message">{message}</p>

        <div className="oms-confirm-actions">
          <button
            type="button"
            className="oms-confirm-btn cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`oms-confirm-btn confirm ${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
