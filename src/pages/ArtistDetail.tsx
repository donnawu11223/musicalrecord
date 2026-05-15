import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getArtistById, deleteArtist } from '../services/artist'
import { cache } from '../hooks/useCache'
import { showToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { calcShowAvg } from '../lib/score'
import type { ArtistDetail } from '../types'

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [artist, setArtist] = useState<ArtistDetail | null>(() => id ? cache.get<ArtistDetail>(`musical_artist_${id}`) : null)
  const [loading, setLoading] = useState(!artist)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadArtist = useCallback(async (artistId: string) => {
    try {
      const data = await getArtistById(artistId)
      setArtist(data)
      cache.set(`musical_artist_${artistId}`, data)
    } catch (error) {
      console.error('加载演员详情失败:', error)
      if (!artist) {
        const cached = cache.get<ArtistDetail>(`musical_artist_${artistId}`, true)
        if (cached) setArtist(cached)
      }
    } finally {
      setLoading(false)
    }
  }, [artist])

  useEffect(() => {
    if (id) loadArtist(id)
  }, [id, loadArtist, location.key])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigate(`/artists/${id}/edit`)
  }

  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteArtist(id!)
      cache.remove(`musical_artist_${id}`)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('musical_artists_cache')) cache.remove(key)
        if (key.startsWith('musical_shows_cache')) cache.remove(key)
        if (key.startsWith('musical_musicals_cache')) cache.remove(key)
      })
      navigate('/artists')
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

  if (!artist) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>演员不存在</div>
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
        <h1 style={styles.title}>{artist.name}</h1>
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
        {/* 演员信息卡片 */}
        <section style={styles.infoCard}>
          <div style={styles.infoContent}>
            <h2 style={styles.artistName}>{artist.name}</h2>
            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>star</span>
                <span style={styles.infoText}>{artist.avg_score.toFixed(1)}</span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>confirmation_number</span>
                <span style={styles.infoText}>{artist.watch_count} 场</span>
              </div>
            </div>
          </div>
        </section>

        {/* 场次统计 */}
        {artist.musical_stats.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>bar_chart</span>
              场次统计
            </h2>
            <div style={styles.musicalList}>
              {artist.musical_stats.map(stat => (
                <span
                  key={stat.musical_id}
                  style={styles.musicalTag}
                  onClick={() => navigate(`/musicals/${stat.musical_id}`)}
                >
                  {stat.musical_name} {stat.count} 场
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 场次评价 */}
        {artist.shows.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>rate_review</span>
              场次评价
            </h2>
            <div style={styles.showList}>
              {artist.shows.map(show => (
                <div
                  key={show.id}
                  style={styles.showCard}
                  onClick={() => navigate(`/shows/${show.show_id}`)}
                >
                  <div style={styles.showHeader}>
                    <div style={styles.showTitle}>
                      <span style={styles.musicalName}>{show.musical_name}</span>
                      {show.role && <span style={styles.roleText}>饰 {show.role}</span>}
                    </div>
                    <span style={{
                      ...styles.actorTypeTag,
                      ...(show.actor_type === '主演' ? styles.actorTypeMain : styles.actorTypeEnsemble)
                    }}>
                      {show.actor_type}
                    </span>
                  </div>
                  <div style={styles.showFooter}>
                    <div style={styles.showDate}>
                      {new Date(show.show_time).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={styles.showScore}>
                      <span className="material-symbols-outlined fill" style={styles.scoreIcon}>star</span>
                      <span style={styles.scoreText}>
                        {(Math.round(calcShowAvg(show) * 2 * 10) / 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {show.review && <div style={styles.showDivider} />}
                  {show.review && <p style={styles.showNote}>{show.review}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <ConfirmDialog
        visible={showDeleteConfirm}
        content="确定要删除这个演员吗？删除后将无法找回。"
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
  artistName: {
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
    gap: '12px',
    paddingLeft: '8px'
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
    fontWeight: 600,
    color: '#356668'
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
  musicalList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  musicalTag: {
    padding: '6px 12px',
    backgroundColor: 'rgba(168, 218, 220, 0.2)',
    color: '#306163',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '9999px',
    cursor: 'pointer'
  },
  showList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
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
    gap: '8px'
  },
  showTitle: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    flex: 1,
    minWidth: 0
  },
  musicalName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1c1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  roleText: {
    fontSize: '12px',
    color: '#707979',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  actorTypeTag: {
    padding: '1px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 600
  },
  actorTypeMain: {
    backgroundColor: 'rgba(168, 218, 220, 0.3)',
    color: '#306163'
  },
  actorTypeEnsemble: {
    backgroundColor: 'rgba(211, 203, 255, 0.2)',
    color: '#5f559a'
  },
  showFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px'
  },
  showDate: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1c1a'
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
  showDivider: {
    borderTop: '1px solid rgba(192, 200, 200, 0.3)',
    margin: '8px 0'
  },
  showNote: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.5
  }
}
