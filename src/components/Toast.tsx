import { useState, useEffect, useCallback } from 'react'

interface ToastConfig {
  content: string
  icon?: 'success' | 'fail'
}

let showToastFn: ((config: ToastConfig) => void) | null = null

export function showToast(config: ToastConfig) {
  if (showToastFn) {
    showToastFn(config)
  }
}

export default function ToastContainer() {
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState<'success' | 'fail'>('fail')

  const show = useCallback((config: ToastConfig) => {
    setContent(config.content)
    setIcon(config.icon || 'fail')
    setVisible(true)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => {
      showToastFn = null
    }
  }, [show])

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.toast}>
        {icon === 'success' ? (
          <span className="material-symbols-outlined" style={{ ...styles.icon, color: '#356668' }}>check_circle</span>
        ) : (
          <span className="material-symbols-outlined" style={{ ...styles.icon, color: '#ba1a1a' }}>error</span>
        )}
        <span style={styles.text}>{content}</span>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    pointerEvents: 'none'
  },
  toast: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '14px 24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '80%'
  },
  icon: {
    fontSize: '20px'
  },
  text: {
    fontSize: '14px',
    color: '#1a1c1a',
    fontWeight: 500
  }
}
