import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from 'antd-mobile'
import { getMusicals } from '../services/musical'
import DefaultPoster from '../components/DefaultPoster'
import type { MusicalCard, MusicalType } from '../types'

const TYPE_OPTIONS: { label: string; value: MusicalType | '' }[] = [
  { label: '全部', value: '' },
  { label: '中国音乐剧', value: '中国音乐剧' },
  { label: '非中音乐剧', value: '非中音乐剧' },
  { label: '话剧', value: '话剧' },
  { label: '舞剧', value: '舞剧' }
]

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

export default function Musicals() {
  const navigate = useNavigate()
  const [musicals, setMusicals] = useState<MusicalCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [selectedType, setSelectedType] = useState<MusicalType | ''>('')

  useEffect(() => {
    loadMusicals()
  }, [selectedType])

  const loadMusicals = async () => {
    try {
      setLoading(true)
      const data = await getMusicals(selectedType || undefined)
      data.sort((a, b) => {
        if (b.watch_count !== a.watch_count) {
          return b.watch_count - a.watch_count
        }
        return b.avg_score - a.avg_score
      })
      setMusicals(data)
    } catch (error) {
      console.error('加载剧目列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (id: string) => {
    navigate(`/musicals/${id}`)
  }

  const handleAddClick = () => {
    navigate('/musicals/new')
  }

  const handleOpenFilter = () => {
    setFilterVisible(true)
    setFilterExpanded(false)
  }

  const handleTypeSelect = (type: MusicalType | '') => {
    setSelectedType(type)
    setFilterVisible(false)
    setFilterExpanded(false)
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleOpenFilter}>
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <h1 style={styles.title}>剧目记录</h1>
        <button style={styles.iconBtn} onClick={handleAddClick}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Filter Popup */}
      {filterVisible && (
        <div style={styles.overlay} onClick={() => {
          setFilterVisible(false)
          setFilterExpanded(false)
        }}>
          <div style={styles.filterPopup} onClick={e => e.stopPropagation()}>
            <div style={styles.filterRow} onClick={() => setFilterExpanded(!filterExpanded)}>
              <span style={styles.filterRowText}>剧目类型</span>
              <span className="material-symbols-outlined" style={{
                ...styles.filterRowArrow,
                transform: filterExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>expand_more</span>
            </div>
            {filterExpanded && (
              <div style={styles.filterOptions}>
                {TYPE_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    style={{
                      ...styles.filterOption,
                      ...(selectedType === option.value ? styles.filterOptionActive : {})
                    }}
                    onClick={() => handleTypeSelect(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={styles.content}>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : musicals.length === 0 ? (
          <Empty description="暂无剧目记录" />
        ) : (
          <div style={styles.grid}>
            {musicals.map(musical => (
              <article
                key={musical.id}
                style={styles.card}
                onClick={() => handleCardClick(musical.id)}
              >
                <div style={styles.posterWrapper}>
                  {musical.poster ? (
                    <img
                      src={musical.poster}
                      alt={musical.name}
                      style={styles.poster}
                    />
                  ) : (
                    <DefaultPoster size={90} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={styles.cardContent}>
                  <div>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardName}>{musical.name}</h3>
                      <span style={{
                        ...styles.typeTag,
                        ...TYPE_TAG_STYLES[musical.type]
                      }}>
                        {musical.type}
                      </span>
                    </div>
                    {musical.brand && (
                      <p style={styles.cardBrand}>{musical.brand}</p>
                    )}
                  </div>
                  <div style={styles.cardStats}>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={styles.statIcon}>visibility</span>
                      <span style={styles.statText}>{musical.watch_count ?? 0}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined fill" style={{...styles.statIcon, color: '#356668'}}>star</span>
                      <span style={{...styles.statText, color: '#356668', fontWeight: 600}}>{(musical.avg_score || 0).toFixed(1)}</span>
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
    minWidth: '140px',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    height: '48px',
    boxSizing: 'border-box'
  },
  filterRowText: {
    fontSize: '14px',
    color: '#1a1c1a',
    fontWeight: 500
  },
  filterRowArrow: {
    fontSize: '20px',
    color: '#707979'
  },
  filterOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px 12px'
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    height: '120px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.06)',
    cursor: 'pointer',
    transition: 'transform 0.3s'
  },
  posterWrapper: {
    width: '90px',
    height: '120px',
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: '#e3e2e0'
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardContent: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  cardName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1c1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1
  },
  typeTag: {
    flexShrink: 0,
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '3px',
    fontWeight: 500
  },
  cardBrand: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#404848'
  },
  cardStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statIcon: {
    fontSize: '14px',
    color: '#404848'
  },
  statText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#404848'
  }
}
