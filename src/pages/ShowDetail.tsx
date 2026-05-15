import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getShowById, deleteShow } from '../services/show'
import { cache } from '../hooks/useCache'
import { showToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { calcShowAvg } from '../lib/score'
import type { ShowDetail, MusicalType } from '../types'

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

const SCORE_LABELS: Record<MusicalType, string> = {
  '中国音乐剧': '演唱',
  '非中音乐剧': '演唱',
  '话剧': '感受',
  '舞剧': '舞蹈'
}

export default function ShowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [show, setShow] = useState<ShowDetail | null>(() => id ? cache.get<ShowDetail>(`musical_show_${id}`) : null)
  const [loading, setLoading] = useState(!show)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadShow = useCallback(async (showId: string) => {
    try {
      const data = await getShowById(showId)
      setShow(data)
      cache.set(`musical_show_${showId}`, data)
    } catch (error) {
      console.error('加载场次详情失败:', error)
      if (!show) {
        const cached = cache.get<ShowDetail>(`musical_show_${showId}`, true)
        if (cached) setShow(cached)
      }
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => {
    if (id) loadShow(id)
  }, [id, loadShow, location.key])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    setShowMenu(false)
    navigate(`/shows/${id}/edit`)
  }

  const handleDelete = () => {
    setShowMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteShow(id!)
      cache.remove(`musical_show_${id}`)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('musical_shows_cache')) cache.remove(key)
        if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        if (key.startsWith('musical_artists_cache')) cache.remove(key)
        if (key.startsWith('musical_years_cache')) cache.remove(key)
      })
      navigate('/')
    } catch (error: any) {
      showToast({ content: error.message || '删除失败', icon: 'fail' })
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAvgScore = () => {
    if (!show) return 0
    return Math.round(calcShowAvg(show) * 2 * 10) / 10
  }

  const getRadarPoints = () => {
    if (!show) return ''
    const scores = [
      show.plot_score ?? 0,
      show.visual_score ?? 0,
      show.acting_score ?? 0,
      show.script_score ?? 0,
      show.singing_score ?? 0
    ]
    // 五边形顶点坐标（满分位置），顺序：剧情(上)、舞美(右上)、演技(右下)、台词(左下)、演唱(左上)
    const vertices = [
      { x: 50, y: 5 },    // 剧情 - 上
      { x: 92.8, y: 36.1 }, // 舞美 - 右上
      { x: 76.4, y: 86.4 }, // 演技 - 右下
      { x: 23.6, y: 86.4 }, // 台词 - 左下
      { x: 7.2, y: 36.1 }   // 演唱 - 左上
    ]
    const center = { x: 50, y: 50 }

    const points = vertices.map((v, i) => {
      const ratio = scores[i] / 5
      const x = center.x + (v.x - center.x) * ratio
      const y = center.y + (v.y - center.y) * ratio
      return `${x},${y}`
    })
    return points.join(' ')
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    )
  }

  if (!show) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>场次不存在</div>
      </div>
    )
  }

  const fifthScoreLabel = SCORE_LABELS[show.musical.type]

  return (
    <div style={styles.container}>
      {showMenu && <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />}
      {/* 顶部导航栏 */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={styles.title}>{show.musical.name}</h1>
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
        {/* 场次信息卡片 */}
        <section style={styles.infoCard}>
          <div style={styles.infoContent}>
            <button style={styles.nameButton} onClick={() => navigate(`/musicals/${show.musical.id}`)}>{show.musical.name}</button>
            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>calendar_today</span>
                <span style={styles.infoText}>{formatDateTime(show.show_time)}</span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>location_on</span>
                <span style={styles.infoText}>{show.city} · {show.theater}</span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>event_seat</span>
                <span style={styles.infoText}>{show.seat}</span>
              </div>
              <div style={styles.infoRow}>
                <span className="material-symbols-outlined" style={styles.infoIcon}>category</span>
                <span style={{ ...styles.typeTag, ...TYPE_TAG_STYLES[show.musical.type] }}>
                  {show.musical.type}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 场次评分 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span className="material-symbols-outlined" style={styles.sectionIcon}>star</span>
            场次评分
          </h2>
          <div style={styles.scoreCard}>
            <div style={styles.radarContainer}>
              <svg viewBox="-10 -10 120 120" style={styles.radar}>
                {/* 背景网格 */}
                <polygon fill="none" points="50,5 92.8,36.1 76.4,86.4 23.6,86.4 7.2,36.1" stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" />
                <polygon fill="none" points="50,14 84.2,38.9 71.1,79.1 28.9,79.1 15.8,38.9" stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" />
                <polygon fill="none" points="50,23 75.7,41.7 65.8,71.8 34.2,71.8 24.3,41.7" stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" />
                <polygon fill="none" points="50,32 67.1,44.4 60.5,64.6 39.5,64.6 32.9,44.4" stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" />
                <polygon fill="none" points="50,41 58.6,47.2 55.3,57.3 44.7,57.3 41.4,47.2" stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" />
                {/* 连接线 */}
                <line stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" x1="50" y1="50" x2="50" y2="5" />
                <line stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" x1="50" y1="50" x2="92.8" y2="36.1" />
                <line stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" x1="50" y1="50" x2="76.4" y2="86.4" />
                <line stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" x1="50" y1="50" x2="23.6" y2="86.4" />
                <line stroke="#c0c8c8" strokeOpacity="0.2" strokeWidth="0.5" x1="50" y1="50" x2="7.2" y2="36.1" />
                {/* 分数填充区域 */}
                <polygon
                  fill="rgba(168, 218, 220, 0.5)"
                  stroke="#a8dadc"
                  strokeWidth="1"
                  points={getRadarPoints()}
                />
                {/* 标签 */}
                <text fill="#356668" fontSize="6" textAnchor="middle" x="50" y="3">剧情</text>
                <text fill="#356668" fontSize="6" textAnchor="start" x="94" y="38">舞美</text>
                <text fill="#356668" fontSize="6" textAnchor="middle" x="78" y="92">演技</text>
                <text fill="#356668" fontSize="6" textAnchor="middle" x="22" y="92">台词</text>
                <text fill="#356668" fontSize="6" textAnchor="end" x="6" y="38">{fifthScoreLabel}</text>
              </svg>
            </div>
            <div style={styles.avgScoreContainer}>
              <span style={styles.avgScoreValue}>{getAvgScore().toFixed(1)}</span>
            </div>
          </div>
        </section>

        {/* 剧目评价 */}
        {show.note && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>rate_review</span>
              剧目评价
            </h2>
            <div style={styles.noteCard}>
              <p style={styles.noteText}>{show.note}</p>
            </div>
          </section>
        )}

        {/* 演员评价 */}
        {show.actor_reviews.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>groups</span>
              演员评价
            </h2>
            <div style={styles.actorList}>
              {show.actor_reviews.map(review => (
                <div key={review.id} style={styles.actorCard}>
                  <div style={styles.actorHeader}>
                    <div style={styles.actorInfo}>
                      <button
                        style={styles.actorNameBtn}
                        onClick={() => navigate(`/artists/${review.artist.id}`)}
                      >
                        {review.artist.name}
                      </button>
                      {review.role && <span style={styles.roleText}>饰 {review.role}</span>}
                    </div>
                    <span style={{
                      ...styles.actorTypeTag,
                      ...(review.actor_type === '主演' ? styles.actorTypeMain : styles.actorTypeEnsemble)
                    }}>
                      {review.actor_type}
                    </span>
                  </div>
                  {review.review && <p style={styles.reviewText}>{review.review}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <ConfirmDialog
        visible={showDeleteConfirm}
        content="确定要删除这个场次吗？删除后将无法找回。"
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
  nameButton: {
    backgroundColor: '#a8dadc',
    color: '#306163',
    fontSize: '16px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    marginBottom: '16px',
    cursor: 'pointer'
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
  scoreCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  radarContainer: {
    width: '50%',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radar: {
    width: '100%',
    height: '100%',
    color: '#a8dadc'
  },
  avgScoreContainer: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avgScoreValue: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#1a1c1a',
    lineHeight: 1
  },
  noteCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)'
  },
  noteText: {
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap'
  },
  actorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  actorCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.04)',
    border: '1px solid rgba(192, 200, 200, 0.3)'
  },
  actorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)',
    marginBottom: '12px'
  },
  actorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  actorNameBtn: {
    backgroundColor: '#b8e2d6',
    color: '#3f665c',
    fontSize: '16px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer'
  },
  roleText: {
    fontSize: '14px',
    color: '#707979'
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
  reviewText: {
    fontSize: '14px',
    color: '#404848',
    lineHeight: 1.6
  }
}
