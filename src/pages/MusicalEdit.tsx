import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { getMusicalById, createMusical, updateMusical, getMusicalNames } from '../services/musical'
import { cache } from '../hooks/useCache'
import type { MusicalType } from '../types'

const TYPE_OPTIONS: MusicalType[] = ['中国音乐剧', '非中音乐剧', '话剧', '舞剧']

export default function MusicalEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const typePickerRef = useRef<HTMLDivElement>(null)
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0, width: 0 })

  const [formData, setFormData] = useState({
    name: '',
    type: '' as MusicalType | '',
    brand: '',
    plot: ''
  })
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      loadMusical(id)
    }
  }, [id, isEdit])

  const loadMusical = async (musicalId: string) => {
    try {
      const data = await getMusicalById(musicalId)
      setFormData({
        name: data.name,
        type: data.type,
        brand: data.brand,
        plot: data.plot
      })
    } catch (error) {
      console.error('加载剧目失败:', error)
      showToast({ content: '加载失败', icon: 'fail' })
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleSubmit = async () => {
    if (submitting) return
    // 校验剧目名称不为空
    if (!formData.name.trim()) {
      showToast({ content: '请填写剧目名称', icon: 'fail' })
      return
    }

    // 校验剧目名称不重复
    try {
      const existingMusicals = await getMusicalNames()
      const isDuplicate = existingMusicals.some(m =>
        m.name === formData.name.trim() && m.id !== id
      )
      if (isDuplicate) {
        showToast({ content: '剧目名称不可重复', icon: 'fail' })
        return
      }
    } catch (error) {
      console.error('检查剧目名称失败:', error)
    }

    // 校验剧目类型不为空
    if (!formData.type) {
      showToast({ content: '请选择剧目类型', icon: 'fail' })
      return
    }

    setSubmitting(true)
    try {
      const musicalData = {
        name: formData.name.trim(),
        type: formData.type,
        brand: formData.brand.trim(),
        plot: formData.plot.trim()
      }

      if (isEdit && id) {
        await updateMusical(id, musicalData)
        showToast({ content: '保存成功', icon: 'success' })
      } else {
        await createMusical(musicalData)
        showToast({ content: '创建成功', icon: 'success' })
      }

      // 清除缓存
      if (id) cache.remove(`musical_detail_${id}`)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        if (key.startsWith('musical_shows_cache')) cache.remove(key)
        if (key.startsWith('musical_artists_cache')) cache.remove(key)
      })

      navigate(-1)
    } catch (error) {
      console.error('保存失败:', error)
      showToast({ content: '保存失败', icon: 'fail' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTypeSelect = (type: MusicalType) => {
    setFormData({ ...formData, type })
    setShowTypePicker(false)
  }

  const handleOpenTypePicker = () => {
    if (typePickerRef.current) {
      const rect = typePickerRef.current.getBoundingClientRect()
      setPickerPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      })
    }
    setShowTypePicker(true)
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={styles.title}>{isEdit ? '编辑剧目' : '新增剧目'}</h1>
        <button style={{ ...styles.iconBtn, opacity: submitting ? 0.5 : 1 }} onClick={handleSubmit} disabled={submitting}>
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        {/* Form Section */}
        <section style={styles.form}>
          <div style={styles.formItem}>
            <label style={styles.label}>剧目名称</label>
            <input
              type="text"
              style={{
                ...styles.input,
                color: formData.name ? '#1a1c1a' : '#707979'
              }}
              placeholder="请输入剧目名称"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={styles.formItem}>
            <label style={styles.label}>剧目类型</label>
            <div ref={typePickerRef} style={styles.pickerRow} onClick={handleOpenTypePicker}>
              <span style={{
                ...styles.pickerValue,
                color: formData.type ? '#1a1c1a' : '#707979'
              }}>
                {formData.type || '请选择剧目类型'}
              </span>
              <span className="material-symbols-outlined" style={styles.pickerArrow}>expand_more</span>
            </div>
          </div>

          <div style={styles.formItem}>
            <label style={styles.label}>出品方</label>
            <input
              type="text"
              style={{
                ...styles.input,
                color: formData.brand ? '#1a1c1a' : '#707979'
              }}
              placeholder="请输入出品方"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          <div style={styles.formItem}>
            <label style={styles.label}>剧情介绍</label>
            <textarea
              style={{
                ...styles.textarea,
                color: formData.plot ? '#1a1c1a' : '#707979'
              }}
              placeholder="请输入剧情介绍"
              value={formData.plot}
              onChange={e => setFormData({ ...formData, plot: e.target.value })}
            />
          </div>
        </section>
      </main>

      {/* Type Picker Popup */}
      {showTypePicker && (
        <div style={styles.overlay} onClick={() => setShowTypePicker(false)}>
          <div style={{
            ...styles.pickerPopup,
            top: pickerPosition.top,
            left: pickerPosition.left,
            width: pickerPosition.width
          }} onClick={e => e.stopPropagation()}>
            <div style={styles.pickerTitle}>
              <span>剧目类型</span>
              <span className="material-symbols-outlined" style={styles.pickerExpandArrow}>expand_more</span>
            </div>
            <div style={styles.pickerOptions}>
              {TYPE_OPTIONS.map(type => (
                <div
                  key={type}
                  style={{
                    ...styles.pickerOption,
                    ...(formData.type === type ? styles.pickerOptionActive : {})
                  }}
                  onClick={() => handleTypeSelect(type)}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf8f7',
    paddingBottom: '96px'
  },
  header: {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 40,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    height: '64px',
    backgroundColor: '#faf8f7'
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#356668',
    fontSize: '24px',
    cursor: 'pointer',
    borderRadius: '50%',
    transition: 'all 0.2s'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#356668'
  },
  content: {
    padding: '86px 16px 24px',
    maxWidth: '512px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
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
  pickerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  pickerValue: {
    fontSize: '14px'
  },
  pickerArrow: {
    fontSize: '20px',
    color: '#707979'
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    resize: 'none',
    minHeight: '100px',
    lineHeight: 1.5
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100
  },
  pickerPopup: {
    position: 'fixed',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  pickerTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1c1a',
    cursor: 'pointer'
  },
  pickerExpandArrow: {
    fontSize: '20px',
    color: '#707979'
  },
  pickerOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px 12px'
  },
  pickerOption: {
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1c1a',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  pickerOptionActive: {
    backgroundColor: '#356668',
    color: '#ffffff'
  }
}
