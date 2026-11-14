import React from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'success' | 'warning' | 'primary';
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'primary',
  icon,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'var(--game-danger-soft)',
          iconColor: 'var(--game-danger)',
          confirmBtnBg: 'var(--game-danger-strong)',
          confirmBtnBorder: 'var(--game-danger)',
          confirmBtnColor: 'var(--game-on-color)',
          defaultIcon: <AlertTriangle size={24} color="var(--game-danger)" />,
        };
      case 'success':
        return {
          iconBg: 'var(--game-accent-soft)',
          iconColor: 'var(--game-accent)',
          confirmBtnBg: 'var(--game-accent)',
          confirmBtnBorder: 'var(--game-success)',
          confirmBtnColor: 'var(--game-on-accent)',
          defaultIcon: <CheckCircle2 size={24} color="var(--game-accent)" />,
        };
      case 'warning':
        return {
          iconBg: 'var(--game-gold-soft)',
          iconColor: 'var(--game-gold)',
          confirmBtnBg: 'var(--game-gold-strong)',
          confirmBtnBorder: 'var(--game-gold)',
          confirmBtnColor: 'var(--game-on-color)',
          defaultIcon: <AlertCircle size={24} color="var(--game-gold)" />,
        };
      case 'primary':
      default:
        return {
          iconBg: 'var(--game-accent-soft)',
          iconColor: 'var(--game-accent)',
          confirmBtnBg: 'var(--game-accent)',
          confirmBtnBorder: 'var(--game-success)',
          confirmBtnColor: 'var(--game-on-accent)',
          defaultIcon: <HelpCircle size={24} color="var(--game-accent)" />,
        };
    }
  };

  const vStyles = getVariantStyles();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--game-scrim)',
        backdropFilter: 'blur(6px)',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--game-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--game-line)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.25rem 0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: vStyles.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon || vStyles.defaultIcon}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.12rem',
                  fontWeight: 800,
                  color: 'var(--game-ink)',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            style={{
              background: 'var(--game-raised)',
              border: 'none',
              borderRadius: '8px',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--game-muted)',
              transition: 'all 0.15s',
            }}
            title={t('common.close', 'Đóng')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '0.75rem 1.25rem 1.25rem',
            fontSize: '0.9rem',
            color: 'var(--game-text)',
            lineHeight: 1.55,
          }}
        >
          {message}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--game-input)',
            borderTop: '1px solid var(--game-line)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="btn btn-sm btn-outline"
            style={{
              padding: '0.55rem 1.15rem',
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.88rem',
              background: 'var(--game-surface)',
              borderColor: 'var(--game-line-strong)',
              color: 'var(--game-text)',
            }}
          >
            {cancelText || t('common.cancel', 'Hủy Bỏ')}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="btn btn-sm flex-center"
            style={{
              padding: '0.55rem 1.35rem',
              fontWeight: 800,
              borderRadius: '8px',
              fontSize: '0.88rem',
              background: vStyles.confirmBtnBg,
              borderColor: vStyles.confirmBtnBorder,
              color: vStyles.confirmBtnColor,
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                <span>{t('common.processing', 'Đang xử lý...')}</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

