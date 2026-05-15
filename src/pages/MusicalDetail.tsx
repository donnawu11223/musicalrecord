import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getMusicalById, deleteMusical } from '../services/musical'
import { cache } from '../hooks/useCache'
import { showToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import type { MusicalDetail, MusicalType } from '../types'

const TYPE_TAG_STYLES: Record<MusicalType, React.CSSProperties> = {
  '中国音乐剧': {
    backgroundColor: 'rgba(168, 218, 220, 0.3)',
    color: '#356668'
  },
  '非中音乐剧': {
    backgroundColor: 'rgba(255, 182, 193, 0.4)',
    color: '#874e58'
  },
  '话剧': {
    backgroundColor: 'rgba(211, 203, 255, 0.2)',
    color: '#5f559a'
  },
  '舞剧': {
    backgroundColor: '#FFE4D6',
    color: '#E67E22'
  }
}

export default function MusicalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [musical, setMusical] = useState<MusicalDetail | null>(() => id ? cache.get<MusicalDetail>(`musical_detail_${id}`) : null)
  const [loading, setLoading] = useState(!musical)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadMusical = useCallback(async (musicalId: string) => {
    try {
      const data = await getMusicalById(musicalId)
      setMusical(data)
      cache.set(`musical_detail_${musicalId}`, data)
    } catch (error) {
      console.error('加载剧目详情失败:', error)
      if (!musical) {
        const cached = cache.get<MusicalDetail>(`musical_detail_${musicalId}`, true)
        if (cached) setMusical(cached)
      }
    } finally {
      setLoading(false)
    }
  }, [musical])

  useEffect(() => {
    if (id) loadMusical(id)
  }, [id, loadMusical, location.key])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigate(`/musicals/${id}/edit`)
  }

  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteMusical(id!)
      cache.remove(`musical_detail_${id}`)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        if (key.startsWith('musical_shows_cache')) cache.remove(key)
        if (key.startsWith('musical_artists_cache')) cache.remove(key)
      })
      navigate('/musicals')
    } catch (error: any) {
      showToast({ content: error.message || '删除失败', icon: 'fail' })
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    )
  }

  if (!musical) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>剧目不存在</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {showMenu && <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />}
      {/* 顶部导航栏 */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={styles.title}>{musical.name}</h1>
        <button style={styles.iconBtn} onClick={() => setShowMenu(!showMenu)}>
          <span className="material-symbols-outlined">more_vert</span>
        </button>
        {showMenu && (
          <div style={styles.menu}>
            <div style={styles.menuItem} onClick={handleEdit}>
              <span className="material-symbols-outlined" style={styles.menuIcon}>edit</span>
              编辑
            </div>
            <div style={{ ...styles.menuItem, color: '#ba1a1a' }} onClick={handleDelete}>
              <span className="material-symbols-outlined" style={styles.menuIcon}>delete</span>
              删除
            </div>
          </div>
        )}
      </header>

      {/* 内容区域 */}
      <main style={styles.content}>
        {/* 剧目信息卡片 */}
        <section style={styles.infoCard}>
          <div style={styles.infoContent}>
            <span style={styles.nameLabel}>{musical.name}</span>
            <div style={styles.infoList}>
              {musical.brand && (
                <div style={styles.infoRow}>
                  <span className="material-symbols-outlined" style={styles.infoIcon}>apartment</span>
                  <span style={styles.infoText}>{musical.brand}</span>
                </div>
              )}
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>category</span>
                <span style={{ ...styles.typeTag, ...TYPE_TAG_STYLES[musical.type] }}>
                  {musical.type}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>star</span>
                <span style={styles.infoText}>{musical.avg_score.toFixed(1)}</span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>confirmation_number</span>
                <span style={styles.infoText}>{musical.watch_count} 场</span>
              </div>
            </div>
          </div>
        </section>

        {/* 剧情介绍 */}
        {musical.plot && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>description</span>
              剧情介绍
            </h2>
            <div style={styles.plotCard}>
              <p style={styles.plotText}>{musical.plot}</p>
            </div>
          </section>
        )}

        {/* 演员统计 */}
        {musical.artist_stats.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>bar_chart</span>
              演员统计
            </h2>
            <div style={styles.artistList}>
              {musical.artist_stats.map(artist => (
                <span
                  key={artist.artist_id}
                  style={styles.artistTag}
                  onClick={() => navigate(`/artists/${artist.artist_id}`)}
                >
                  {artist.artist_name} {artist.count} 场
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 场次评价 */}
        {musical.shows.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>rate_review</span>
              场次评价
            </h2>
            <div style={styles.showList}>
              {musical.shows.map(show => (
                <div
                  key={show.id}
                  style={styles.showCard}
                  onClick={() => navigate(`/shows/${show.id}`)}
                >
                  <div style={styles.showHeader}>
                    <div style={styles.showInfo}>
                      <div style={styles.showDate}>
                        {new Date(show.show_time).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div style={styles.showTheater}>{show.city} · {show.theater}</div>
                    </div>
                    <div style={styles.showScore}>
                      <span className="material-symbols-outlined fill" style={styles.scoreIcon}>star</span>
                      <span style={styles.scoreText}>{show.avg_score.toFixed(1)}</span>
                    </div>
                  </div>
                  {show.note && <p style={styles.showNote}>{show.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <ConfirmDialog
        visible={showDeleteConfirm}
        content="确定要删除这个剧目吗？删除后将无法找回。"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf8f7',
    paddingBottom: '96px'
  },
  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 199
  },
  header: {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    padding: '0 20px',
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
    flex: 1,
    fontSize: '16px',
    fontWeight: 600,
    color: '#356668',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 16px'
  },
  menu: {
    position: 'absolute',
    right: '20px',
    top: '56px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.12)',
    overflow: 'hidden',
    zIndex: 200,
    minWidth: '128px',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1a1c1a',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  menuIcon: {
    fontSize: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#707979'
  },
  content: {
    padding: '86px 16px 24px',
    maxWidth: '512px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  infoCard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.06)',
    overflow: 'hidden',
    border: '1px solid rgba(192, 200, 200, 0.3)'
  },
  infoContent: {
    width: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  nameLabel: {
    backgroundColor: '#a8dadc',
    color: '#306163',
    fontSize: '16px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  infoList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  infoIcon: {
    fontSize: '20px',
    color: '#356668'
  },
  infoText: {
    fontSize: '14px',
    color: '#404848'
  },
  typeTag: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '3px',
    fontWeight: 500
  },
  section: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#356668',
    padding: '0 4px'
  },
  sectionIcon: {
    fontSize: '20px'
  },
  artistList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  artistTag: {
    padding: '8px 16px',
    backgroundColor: 'rgba(168, 218, 220, 0.3)',
    color: '#306163',
    fontSize: '14px',
    borderRadius: '9999px',
    cursor: 'pointer'
  },
  plotCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)'
  },
  plotText: {
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap'
  },
  showList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  showCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  showHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)'
  },
  showInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  showDate: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1c1a'
  },
  showTheater: {
    fontSize: '12px',
    color: '#707979'
  },
  showScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  scoreIcon: {
    fontSize: '18px',
    color: '#356668'
  },
  scoreText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#356668'
  },
  showNote: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.5
  }
}
