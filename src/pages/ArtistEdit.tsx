import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { getArtistById, createArtist, updateArtist, uploadAvatar, deleteAvatar, getArtistNames } from '../services/artist'

export default function ArtistEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    avatar: ''
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      loadArtist(id)
    }
  }, [id, isEdit])

  const loadArtist = async (artistId: string) => {
    try {
      const data = await getArtistById(artistId)
      setFormData({
        name: data.name,
        avatar: data.avatar
      })
    } catch (error) {
      console.error('加载演员失败:', error)
      showToast({ content: '加载失败', icon: 'fail' })
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast({ content: '请选择图片文件', icon: 'fail' })
      return
    }

    if (file.size > 50 * 1024) {
      showToast({ content: '图片大小不能超过50KB', icon: 'fail' })
      return
    }

    try {
      setUploading(true)
      const oldAvatar = formData.avatar
      const url = await uploadAvatar(file)
      setFormData({ ...formData, avatar: url })
      // 删除旧图片
      if (oldAvatar) {
        await deleteAvatar(oldAvatar)
      }
      showToast({ content: '上传成功', icon: 'success' })
    } catch (error) {
      console.error('上传失败:', error)
      showToast({ content: '上传失败', icon: 'fail' })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    // 校验演员名称不为空
    if (!formData.name.trim()) {
      showToast({ content: '请填写演员名称', icon: 'fail' })
      return
    }

    // 校验演员名称不重复
    try {
      const existingArtists = await getArtistNames()
      const isDuplicate = existingArtists.some(a =>
        a.name === formData.name.trim() && a.id !== id
      )
      if (isDuplicate) {
        showToast({ content: '演员名称不可重复', icon: 'fail' })
        return
      }
    } catch (error) {
      console.error('检查演员名称失败:', error)
    }

    try {
      const artistData = {
        name: formData.name.trim(),
        avatar: formData.avatar
      }

      if (isEdit && id) {
        await updateArtist(id, artistData)
        showToast({ content: '保存成功', icon: 'success' })
      } else {
        await createArtist(artistData)
        showToast({ content: '创建成功', icon: 'success' })
      }
      navigate(-1)
    } catch (error) {
      console.error('保存失败:', error)
      showToast({ content: '保存失败', icon: 'fail' })
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
        <button style={styles.iconBtn} onClick={handleSubmit}>
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        {/* Photo Upload Section */}
        <section style={styles.uploadSection}>
          <button
            style={{
              ...styles.uploadBtn,
              ...(formData.avatar ? styles.uploadBtnWithImage : {})
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.avatar ? (
              <img src={formData.avatar} alt="头像" style={styles.avatarImage} />
            ) : (
              <>
                <div style={styles.uploadIconWrapper}>
                  <span className="material-symbols-outlined" style={styles.uploadIcon}>add_a_photo</span>
                </div>
                <span style={styles.uploadText}>上传头像</span>
              </>
            )}
            {uploading && <div style={styles.uploading}>上传中...</div>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </section>

        {/* Form Section */}
        <section style={styles.form}>
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
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf8f7'
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
    alignItems: 'center',
    gap: '24px'
  },
  uploadSection: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '16px'
  },
  uploadBtn: {
    position: 'relative',
    width: '150px',
    height: '200px',
    borderRadius: '12px',
    backgroundColor: '#efeeeb',
    border: '2px dashed #c0c8c8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    overflow: 'hidden'
  },
  uploadBtnWithImage: {
    border: 'none',
    backgroundColor: '#ffffff'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px'
  },
  uploadIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(168, 218, 220, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#356668'
  },
  uploadIcon: {
    fontSize: '24px'
  },
  uploadText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#404848'
  },
  uploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 248, 247, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#356668'
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
  }
}
