import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { getArtistByName, createArtist, updateArtist, getArtistNames } from '../services/artist'
import { cache } from '../hooks/useCache'

export default function ArtistEditPage() {
  const { name: routeName } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const decodedName = routeName ? decodeURIComponent(routeName) : ''
  const isEdit = !!decodedName

  const [formData, setFormData] = useState({
    name: ''
  })
  const [batchText, setBatchText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && decodedName) {
      loadArtist(decodedName)
    }
  }, [decodedName, isEdit])

  const loadArtist = async (artistName: string) => {
    try {
      const data = await getArtistByName(artistName)
      setFormData({
        name: data.name
      })
    } catch (error) {
      console.error('加载演员失败:', error)
      showToast({ content: '加载失败', icon: 'fail' })
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  // 将批量文本拆分为演员名称数组
  const parseNames = (text: string): string[] => {
    return text
      .split(/[,，\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  // 去除数组内重复名称，保留首次出现
  const dedupeNames = (names: string[]): string[] => {
    const seen = new Set<string>()
    return names.filter(name => {
      if (seen.has(name)) return false
      seen.add(name)
      return true
    })
  }

  const handleSubmit = async () => {
    if (submitting) return

    if (isEdit) {
      // 编辑模式：单一名称校验与保存
      if (!formData.name.trim()) {
        showToast({ content: '请填写演员名称', icon: 'fail' })
        return
      }

      try {
        const existingArtists = await getArtistNames()
        const isDuplicate = existingArtists.some(a =>
          a.name === formData.name.trim() && a.name !== decodedName
        )
        if (isDuplicate) {
          showToast({ content: '演员名称不可重复', icon: 'fail' })
          return
        }
      } catch (error) {
        console.error('检查演员名称失败:', error)
      }

      setSubmitting(true)
      try {
        await updateArtist(decodedName, { name: formData.name.trim() })
        showToast({ content: '保存成功', icon: 'success' })

        cache.remove(`musical_artist_${decodedName}`)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('musical_artists_cache')) cache.remove(key)
          if (key.startsWith('musical_shows_cache')) cache.remove(key)
          if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        })

        navigate(-1)
      } catch (error) {
        console.error('保存失败:', error)
        showToast({ content: '保存失败', icon: 'fail' })
      } finally {
        setSubmitting(false)
      }
    } else {
      // 新增模式：批量录入
      const names = dedupeNames(parseNames(batchText))
      if (names.length === 0) {
        showToast({ content: '请填写演员名称', icon: 'fail' })
        return
      }

      setSubmitting(true)
      try {
        const existingArtists = await getArtistNames()
        const existingNameSet = new Set(existingArtists.map(a => a.name))

        const newNames: string[] = []
        const duplicateNames: string[] = []

        names.forEach(name => {
          if (existingNameSet.has(name)) {
            duplicateNames.push(name)
          } else {
            newNames.push(name)
          }
        })

        // 依次创建不重复的演员
        let successCount = 0
        for (const name of newNames) {
          try {
            await createArtist({ name })
            successCount++
          } catch (error) {
            console.error(`创建演员「${name}」失败:`, error)
            duplicateNames.push(name)
          }
        }

        // 提示结果
        if (duplicateNames.length > 0) {
          showToast({ content: `${duplicateNames.join('、')} 名称重复，未新增`, icon: 'fail' })
        }
        if (successCount > 0) {
          showToast({ content: `成功新增 ${successCount} 位演员`, icon: 'success' })
        }

        // 清除缓存
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('musical_artists_cache')) cache.remove(key)
          if (key.startsWith('musical_shows_cache')) cache.remove(key)
          if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        })

        if (successCount > 0) {
          navigate(-1)
        }
      } catch (error) {
        console.error('批量创建失败:', error)
        showToast({ content: '创建失败', icon: 'fail' })
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={styles.title}>{isEdit ? '编辑演员' : '新增演员'}</h1>
        <button style={{ ...styles.iconBtn, opacity: submitting ? 0.5 : 1 }} onClick={handleSubmit} disabled={submitting}>
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        <section style={styles.form}>
          {isEdit ? (
            <div style={styles.formItem}>
              <label style={styles.label}>演员名称</label>
              <input
                type="text"
                style={{
                  ...styles.input,
                  color: formData.name ? '#1a1c1a' : '#707979'
                }}
                placeholder="请输入演员全名"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          ) : (
            <div style={styles.formItem}>
              <label style={styles.label}>演员名称</label>
              <textarea
                style={{
                  ...styles.input,
                  ...styles.textarea,
                  color: batchText ? '#1a1c1a' : '#707979'
                }}
                placeholder="请输入演员名称，多个名称用逗号或换行分隔"
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
              />
              <span style={styles.hint}>支持逗号或换行分隔，自动过滤重复名称</span>
            </div>
          )}
        </section>
      </main>
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
  textarea: {
    minHeight: '160px',
    resize: 'vertical',
    lineHeight: '1.6',
    fontFamily: 'inherit'
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    padding: '0 4px'
  }
}
