interface ConfirmDialogProps {
  visible: boolean
  content: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ visible, content, confirmText = '确定', cancelText = '取消', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.body}>
          <p style={styles.content}>{content}</p>
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  dialog: {
    width: '72vw',
    minWidth: '280px',
    maxWidth: '320px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  body: {
    padding: '24px 20px 16px',
    display: 'flex',
    justifyContent: 'center'
  },
  content: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#1a1c1a',
    textAlign: 'center',
    margin: 0
  },
  footer: {
    display: 'flex',
    borderTop: '1px solid rgba(192, 200, 200, 0.3)'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    color: '#707979',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  confirmBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderLeft: '1px solid rgba(192, 200, 200, 0.3)',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: 600,
    color: '#ba1a1a',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
}
