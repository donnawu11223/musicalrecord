import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

interface LoginProps {
  onSuccess: () => void
}

export default function Login({ onSuccess }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
      return
    }
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        onSuccess()
      } else {
        await signUp(email.trim(), password)
        setSuccessMsg('注册成功！请查看邮箱确认后登录。')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>观剧记录</h1>
        <p style={styles.subtitle}>{mode === 'login' ? '登录你的账号' : '创建新账号'}</p>

        {error && <div style={styles.error}>{error}</div>}
        {successMsg && <div style={styles.success}>{successMsg}</div>}

        <div style={styles.form}>
          <div style={styles.formItem}>
            <label style={styles.label}>邮箱</label>
            <input
              type="email"
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div style={styles.formItem}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </div>

        <div style={styles.switchRow}>
          <span style={styles.switchText}>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            style={styles.switchBtn}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccessMsg('') }}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf9f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '32px 24px',
    boxShadow: '0 8px 32px rgba(53, 102, 104, 0.08)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#356668',
    textAlign: 'center',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#707979',
    textAlign: 'center',
    marginBottom: '24px'
  },
  error: {
    padding: '10px 14px',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#ba1a1a',
    marginBottom: '16px'
  },
  success: {
    padding: '10px 14px',
    backgroundColor: 'rgba(53, 102, 104, 0.08)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#356668',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a1c1a',
    padding: '0 4px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#356668',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    marginTop: '20px'
  },
  switchText: {
    fontSize: '13px',
    color: '#707979'
  },
  switchBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#356668',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px'
  }
}
