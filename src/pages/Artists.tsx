import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from 'antd-mobile'
import { getArtists } from '../services/artist'
import DefaultAvatar from '../components/DefaultAvatar'
import type { Artist } from '../types'

type ArtistCard = Artist & { watch_count: number; avg_score: number }

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
            {artists.map(artist => (
              <article
                key={artist.id}
                style={styles.card}
                onClick={() => handleCardClick(artist.id)}
              >
                <div style={styles.avatarWrapper}>
                  {artist.avatar ? (
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      style={styles.avatar}
                    />
                  ) : (
                    <DefaultAvatar size={100} style={styles.avatar} />
                  )}
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardName}>{artist.name}</h3>
                  <div style={styles.cardStats}>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined fill" style={styles.statIcon}>star</span>
                      <span style={styles.statText}>{artist.avg_score.toFixed(1)}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={styles.statIcon}>visibility</span>
                      <span style={styles.statText}>{artist.watch_count}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
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
    padding: '0 20px',
    paddingTop: '70px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#707979'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '5px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.06)',
    cursor: 'pointer',
    transition: 'transform 0.3s'
  },
  avatarWrapper: {
    aspectRatio: '3/4',
    backgroundColor: '#e3e2e0',
    overflow: 'hidden'
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardInfo: {
    padding: '4px 4px 8px',
    textAlign: 'center'
  },
  cardName: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1a1c1a',
    margin: '5px 0 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 3px'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  statIcon: {
    fontSize: '12px',
    color: '#404848'
  },
  statText: {
    fontSize: '10px',
    fontWeight: 500,
    color: '#404848'
  }
}
