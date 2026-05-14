import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Dialog } from 'antd-mobile'
import { getArtistById, deleteArtist } from '../services/artist'
import type { ArtistDetail } from '../types'

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [artist, setArtist] = useState<ArtistDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (id) {
      loadArtist(id)
    }
  }, [id])

  const loadArtist = async (artistId: string) => {
    try {
      setLoading(true)
      const data = await getArtistById(artistId)
      setArtist(data)
    } catch (error) {
      console.error('加载演员详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigate(`/artists/${id}/edit`)
  }

  const handleDelete = async () => {
    setShowMenu(false)
    const confirmed = await Dialog.confirm({
      content: '确定要删除这个演员吗？删除后将无法找回。',
      confirmText: '确定',
      cancelText: '取消'
    })
    if (confirmed) {
      try {
        await deleteArtist(id!)
        navigate('/artists')
      } catch (error: any) {
        Dialog.alert({ content: error.message || '删除失败' })
      }
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
                    <div style={styles.showHeaderTop}>
                      <button style={styles.musicalNameBtn}>{show.musical_name}</button>
                      <span style={{
                        ...styles.actorTypeTag,
                        ...(show.actor_type === '主演' ? styles.actorTypeMain : styles.actorTypeEnsemble)
                      }}>
                        {show.actor_type}
                      </span>
                    </div>
                    <div style={styles.showInfo}>
                      <div style={styles.showDateTime}>
                        <span className="material-symbols-outlined" style={styles.calendarIcon}>calendar_today</span>
                        <span>{new Date(show.show_time).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <div style={styles.scoreWrapper}>
                        <span className="material-symbols-outlined fill" style={styles.scoreIcon}>star</span>
                        <span style={styles.scoreText}>
                          {((show.plot_score + show.visual_score + show.acting_score + show.script_score + show.singing_score) / 5).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {show.role && <div style={styles.roleText}>饰 {show.role}</div>}
                  </div>
                  {show.review && <p style={styles.reviewText}>{show.review}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
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
    borderRadius: '15px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  showHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)'
  },
  showHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  musicalNameBtn: {
    backgroundColor: '#b8e2d6',
    color: '#3f665c',
    fontSize: '16px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'default'
  },
  actorTypeTag: {
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
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
  showInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  showDateTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#707979'
  },
  calendarIcon: {
    fontSize: '16px'
  },
  scoreWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: '#e9e8e5',
    padding: '2px 8px',
    borderRadius: '5px'
  },
  scoreIcon: {
    fontSize: '14px',
    color: '#356668'
  },
  scoreText: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1c1a'
  },
  roleText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1c1a'
  },
  reviewText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.6
  }
}
