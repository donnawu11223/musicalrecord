import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from 'antd-mobile'
import { getArtists } from '../services/artist'
import type { Artist } from '../types'

type ArtistCard = Artist & { watch_count: number; avg_score: number }

// 4种颜色
const CARD_COLORS = [
  { bg: '#a8dadc', text: '#1a4e50' },  // 青绿色
  { bg: '#ffb6c1', text: '#6b3741' },  // 粉红色
  { bg: '#d3cbff', text: '#473d81' },  // 浅紫色
  { bg: '#b9ecee', text: '#002021' },  // 浅青色
]

// 根据演员名称生成固定的颜色索引
const getArtistColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length]
}

export default function Artists() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState<ArtistCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArtists()
  }, [])

  const loadArtists = async () => {
    try {
      setLoading(true)
      const data = await getArtists()
      // 按观看次数和评分倒序排序
      data.sort((a, b) => {
        if (b.watch_count !== a.watch_count) {
          return b.watch_count - a.watch_count
        }
        return b.avg_score - a.avg_score
      })
      setArtists(data)
    } catch (error) {
      console.error('加载演员列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (id: string) => {
    navigate(`/artists/${id}`)
  }

  const handleAddClick = () => {
    navigate('/artists/new')
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn}>
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <h1 style={styles.title}>演员记录</h1>
        <button style={styles.iconBtn} onClick={handleAddClick}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : artists.length === 0 ? (
          <Empty description="暂无演员记录" />
        ) : (
          <div style={styles.grid}>
            {artists.map(artist => {
              const color = getArtistColor(artist.name)
              return (
                <article
                  key={artist.id}
                  style={{
                    ...styles.card,
                    backgroundColor: color.bg
                  }}
                  onClick={() => handleCardClick(artist.id)}
                >
                  {/* 上方：演员名称 */}
                  <div style={styles.cardMain}>
                    <h2 style={{ ...styles.cardName, color: color.text }}>{artist.name}</h2>
                  </div>

                  {/* 分隔线 */}
                  <div style={styles.separator}>
                    <div style={{ ...styles.separatorLine, borderColor: `${color.text}30` }}></div>
                  </div>

                  {/* 下方：观看次数和平均分数 */}
                  <div style={styles.cardStub}>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={{ ...styles.statIcon, color: color.text }}>visibility</span>
                      <span style={{ ...styles.statText, color: color.text }}>{artist.watch_count}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={{ ...styles.statIcon, color: color.text }}>star</span>
                      <span style={{ ...styles.statText, color: color.text }}>{artist.avg_score.toFixed(1)}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#faf9f6',
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
    padding: '0 20px',
    height: '64px',
    backgroundColor: '#faf9f6'
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
    padding: '96px 20px 32px',
    maxWidth: '448px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#707979'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px'
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(53, 102, 104, 0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    overflow: 'hidden'
  },
  cardMain: {
    flex: 1,
    padding: '10px 8px 4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardName: {
    fontSize: '12px',
    fontWeight: 600,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    width: '100%'
  },
  separator: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 0',
    width: '100%'
  },
  separatorLine: {
    width: 'calc(100% - 12px)',
    borderTop: '1.5px dashed',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    position: 'absolute'
  },
  cardStub: {
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  statIcon: {
    fontSize: '10px'
  },
  statText: {
    fontSize: '10px',
    fontWeight: 600
  }
}
