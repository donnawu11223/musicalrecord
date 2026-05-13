import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from 'antd-mobile'
import { getShows, getShowYears } from '../services/show'
import DefaultPoster from '../components/DefaultPoster'
import type { ShowCard, MusicalType } from '../types'

const TYPE_OPTIONS: { label: string; value: MusicalType | '' }[] = [
  { label: '全部', value: '' },
  { label: '中国音乐剧', value: '中国音乐剧' },
  { label: '非中音乐剧', value: '非中音乐剧' },
  { label: '话剧', value: '话剧' },
  { label: '舞剧', value: '舞剧' }
]

export default function Shows() {
  const navigate = useNavigate()
  const [shows, setShows] = useState<ShowCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState<'year' | 'type' | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedType, setSelectedType] = useState<MusicalType | ''>('')
  const [years, setYears] = useState<string[]>([])
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadShows()
    loadYears()
  }, [selectedYear, selectedType])

  useEffect(() => {
    if (filterVisible && filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect()
      setFilterPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      })
    }
  }, [filterVisible])

  const loadYears = async () => {
    try {
      const yearList = await getShowYears()
      setYears(yearList)
    } catch (error) {
      console.error('加载年份失败:', error)
    }
  }

  const loadShows = async () => {
    try {
      setLoading(true)
      const data = await getShows({
        year: selectedYear || undefined,
        type: selectedType || undefined
      })
      setShows(data)
    } catch (error) {
      console.error('加载场次列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0, width: 0 })

  const handleCardClick = (id: string) => {
    navigate(`/shows/${id}`)
  }

  const handleAddClick = () => {
    navigate('/shows/new')
  }

  const handleOpenFilter = () => {
    if (filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect()
      setFilterPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      })
    }
    setFilterVisible(true)
    setFilterExpanded(null)
  }

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    setFilterVisible(false)
    setFilterExpanded(null)
  }

  const handleTypeSelect = (type: MusicalType | '') => {
    setSelectedType(type)
    setFilterVisible(false)
    setFilterExpanded(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleOpenFilter}>
          <span className="material-symbols-outlined">filter_list</span>
        </button>
        <h1 style={styles.title}>场次记录</h1>
        <button style={styles.iconBtn} onClick={handleAddClick}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Filter Popup */}
      {filterVisible && (
        <div style={styles.overlay} onClick={() => {
          setFilterVisible(false)
          setFilterExpanded(null)
        }}>
          <div style={{
            ...styles.filterPopup,
            top: filterPosition.top,
            left: filterPosition.left,
            width: filterPosition.width
          }} onClick={e => e.stopPropagation()}>
            <div style={styles.filterRow} onClick={() => setFilterExpanded(filterExpanded === 'year' ? null : 'year')}>
              <span style={styles.filterRowText}>年份</span>
              <span className="material-symbols-outlined" style={{
                ...styles.filterRowArrow,
                transform: filterExpanded === 'year' ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>expand_more</span>
            </div>
            {filterExpanded === 'year' && (
              <div style={styles.filterOptions}>
                <div
                  style={{
                    ...styles.filterOption,
                    ...(selectedYear === '' ? styles.filterOptionActive : {})
                  }}
                  onClick={() => handleYearSelect('')}
                >
                  全部
                </div>
                {years.map(year => (
                  <div
                    key={year}
                    style={{
                      ...styles.filterOption,
                      ...(selectedYear === year ? styles.filterOptionActive : {})
                    }}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
            <div style={styles.filterRow} onClick={() => setFilterExpanded(filterExpanded === 'type' ? null : 'type')}>
              <span style={styles.filterRowText}>类型</span>
              <span className="material-symbols-outlined" style={{
                ...styles.filterRowArrow,
                transform: filterExpanded === 'type' ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>expand_more</span>
            </div>
            {filterExpanded === 'type' && (
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
        ) : shows.length === 0 ? (
          <Empty description="暂无场次记录" />
        ) : (
          <div style={styles.grid}>
            {shows.map(show => (
              <article
                key={show.id}
                style={styles.card}
                onClick={() => handleCardClick(show.id)}
              >
                <div style={styles.posterWrapper}>
                  {show.musical_poster ? (
                    <img
                      src={show.musical_poster}
                      alt={show.musical_name}
                      style={styles.poster}
                    />
                  ) : (
                    <DefaultPoster size={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardName}>{show.musical_name}</h3>
                  <p style={styles.cardDate}>{formatDate(show.show_time)}</p>
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
    position: 'fixed',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
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
  posterWrapper: {
    aspectRatio: '3/4',
    backgroundColor: '#e3e2e0',
    overflow: 'hidden',
    borderRadius: '5px'
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardInfo: {
    padding: '0 2px 5px'
  },
  cardName: {
    fontSize: '10px',
    fontWeight: 400,
    color: '#1a1c1a',
    margin: '5px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardDate: {
    fontSize: '8px',
    color: '#707979',
    margin: '4px 0 0'
  }
}
