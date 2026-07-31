import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, PullToRefresh } from 'antd-mobile'
import { getArtists } from '../services/artist'
import { cache } from '../hooks/useCache'
import type { Artist } from '../types'

type ArtistCard = Artist & { watch_count: number; avg_score: number; avg_order: number }

const CACHE_KEY = 'musical_artists_cache'

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
  const [artists, setArtists] = useState<ArtistCard[]>(() => cache.get<ArtistCard[]>(CACHE_KEY) || [])
  const [loading, setLoading] = useState(!artists.length)
  const [filterVisible, setFilterVisible] = useState(false)
  const [selectedArtistName, setSelectedArtistName] = useState<string>('')
  const [nameSearch, setNameSearch] = useState('')

  const sortArtists = (data: ArtistCard[]) => {
    return [...data].sort((a, b) => {
      if (b.watch_count !== a.watch_count) return b.watch_count - a.watch_count
      if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score
      return a.avg_order - b.avg_order
    })
  }

  const loadArtists = useCallback(async (forceRefresh: boolean = false) => {
    if (!forceRefresh) {
      const cached = cache.get<ArtistCard[]>(CACHE_KEY)
      if (cached) {
        setArtists(sortArtists(cached))
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const data = await getArtists()
      setArtists(sortArtists(data))
      cache.set(CACHE_KEY, data)
    } catch (error) {
      console.error('加载演员列表失败:', error)
      const cached = cache.get<ArtistCard[]>(CACHE_KEY, true)
      if (cached) setArtists(sortArtists(cached))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArtists()
  }, [loadArtists])

  const handleRefresh = async () => {
    await loadArtists(true)
  }

  const handleCardClick = (name: string) => {
    navigate(`/artists/${encodeURIComponent(name)}`)
  }

  const handleAddClick = () => {
    navigate('/artists/new')
  }

  const handleOpenFilter = () => {
    setFilterVisible(true)
    setNameSearch('')
  }

  const handleArtistSelect = (artist: ArtistCard) => {
    setSelectedArtistName(artist.name)
    setFilterVisible(false)
  }

  const handleClearFilter = () => {
    setSelectedArtistName('')
    setFilterVisible(false)
  }

  const filteredArtistsByName = artists.filter(a =>
    a.name.toLowerCase().includes(nameSearch.toLowerCase())
  )

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleOpenFilter}>
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <h1 style={styles.title}>演员记录</h1>
        <button style={styles.iconBtn} onClick={handleAddClick}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Filter Popup */}
      {filterVisible && (
        <div style={styles.overlay} onClick={() => setFilterVisible(false)}>
          <div style={styles.filterPopup} onClick={e => e.stopPropagation()}>
            <div style={styles.filterRow}>
              <span style={styles.filterRowText}>演员名称</span>
              <span style={styles.filterRowValue}>
                {selectedArtistName || ''}
              </span>
            </div>
            <div style={styles.filterSearchSection}>
              <input
                type="text"
                style={styles.searchInput}
                placeholder="搜索演员..."
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                autoFocus
              />
              <div style={styles.filterOptionsScrollable}>
                <div
                  style={{
                    ...styles.filterOption,
                    ...(!selectedArtistName ? styles.filterOptionActive : {})
                  }}
                  onClick={handleClearFilter}
                >
                  全部
                </div>
                {filteredArtistsByName.map(artist => (
                  <div
                    key={artist.name}
                    style={{
                      ...styles.filterOption,
                      ...(selectedArtistName === artist.name ? styles.filterOptionActive : {})
                    }}
                    onClick={() => handleArtistSelect(artist)}
                  >
                    {artist.name}
                  </div>
                ))}
                {filteredArtistsByName.length === 0 && (
                  <div style={styles.filterEmpty}>暂无匹配演员</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={styles.content}>
        <PullToRefresh
          onRefresh={handleRefresh}
          pullingText="下拉刷新"
          canReleaseText="释放刷新"
          refreshingText="加载中..."
          completeText="刷新成功"
        >
        {loading && !artists.length ? (
          <div style={styles.loading}>加载中...</div>
        ) : (selectedArtistName ? artists.filter(a => a.name === selectedArtistName) : artists).length === 0 ? (
          <Empty description="暂无演员记录" />
        ) : (
          <div style={styles.grid}>
            {(selectedArtistName ? artists.filter(a => a.name === selectedArtistName) : artists).map(artist => {
              const color = getArtistColor(artist.name)
              return (
                <article
                  key={artist.name}
                  style={{
                    ...styles.card,
                    backgroundColor: color.bg
                  }}
                  onClick={() => handleCardClick(artist.name)}
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
        </PullToRefresh>
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
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100
  },
  filterPopup: {
    position: 'absolute',
    top: '8px',
    left: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.12)',
    minWidth: '200px',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    height: '48px',
    boxSizing: 'border-box'
  },
  filterRowText: {
    fontSize: '14px',
    color: '#1a1c1a',
    fontWeight: 500
  },
  filterRowValue: {
    flex: 1,
    fontSize: '12px',
    color: '#707979',
    textAlign: 'right' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: '0 8px'
  },
  filterSearchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px 12px'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid rgba(192, 200, 200, 0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  filterOptionsScrollable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '320px',
    overflowY: 'auto'
  },
  filterOption: {
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1c1a',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  filterOptionActive: {
    backgroundColor: '#356668',
    color: '#ffffff'
  },
  filterEmpty: {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#707979',
    textAlign: 'center'
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
