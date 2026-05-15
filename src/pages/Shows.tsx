import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, PullToRefresh } from 'antd-mobile'
import { getShows, getShowYears } from '../services/show'
import { cache } from '../hooks/useCache'
import type { ShowCard, MusicalType } from '../types'

const TYPE_OPTIONS: { label: string; value: MusicalType | '' }[] = [
  { label: '全部', value: '' },
  { label: '中国音乐剧', value: '中国音乐剧' },
  { label: '非中音乐剧', value: '非中音乐剧' },
  { label: '话剧', value: '话剧' },
  { label: '舞剧', value: '舞剧' }
]

const CACHE_KEY_SHOWS = 'musical_shows_cache'
const CACHE_KEY_YEARS = 'musical_years_cache'

export default function Shows() {
  const navigate = useNavigate()
  const [shows, setShows] = useState<ShowCard[]>(() => cache.get<ShowCard[]>(`${CACHE_KEY_SHOWS}__`) || [])
  const [loading, setLoading] = useState(!shows.length)
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState<'year' | 'type' | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedType, setSelectedType] = useState<MusicalType | ''>('')
  const [years, setYears] = useState<string[]>(() => cache.get<string[]>(CACHE_KEY_YEARS) || [])
  const filterRef = useRef<HTMLDivElement>(null)

  // 加载场次数据
  const loadShows = useCallback(async (forceRefresh: boolean = false) => {
    const cacheKey = `${CACHE_KEY_SHOWS}_${selectedYear}_${selectedType}`

    if (!forceRefresh) {
      const cached = cache.get<ShowCard[]>(cacheKey, true)
      if (cached) {
        setShows(cached)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const data = await getShows({
        year: selectedYear || undefined,
        type: selectedType || undefined
      })
      setShows(data)
      cache.set(cacheKey, data)
    } catch (error) {
      console.error('加载场次列表失败:', error)
      // 网络失败时尝试使用缓存
      const cached = cache.get<ShowCard[]>(cacheKey, true)
      if (cached) {
        setShows(cached)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedType])

  // 加载年份列表
  const loadYears = useCallback(async () => {
    const cached = cache.get<string[]>(CACHE_KEY_YEARS)
    if (cached) {
      setYears(cached)
    }

    try {
      const yearList = await getShowYears()
      setYears(yearList)
      cache.set(CACHE_KEY_YEARS, yearList)
    } catch (error) {
      console.error('加载年份失败:', error)
    }
  }, [])

  // 下拉刷新
  const handleRefresh = async () => {
    await loadShows(true)
    await loadYears()
  }

  useEffect(() => {
    loadShows()
    loadYears()
  }, [loadShows, loadYears])

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

  const formatDateParts = (dateStr: string) => {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      month: months[date.getMonth()],
      day: date.getDate(),
      year: date.getFullYear(),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }

  const typeColorMap: Record<MusicalType, { bg: string; text: string }> = {
    '中国音乐剧': { bg: '#a8dadc', text: '#1a4e50' },
    '非中音乐剧': { bg: '#ffb6c1', text: '#6b3741' },
    '话剧': { bg: '#d3cbff', text: '#473d81' },
    '舞剧': { bg: '#b9ecee', text: '#002021' },
  }

  const getTypeColor = (type: MusicalType) => {
    return typeColorMap[type] || { bg: '#a8dadc', text: '#1a4e50' }
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

      {/* Main Content with PullToRefresh */}
      <main style={styles.content}>
        <PullToRefresh
          onRefresh={handleRefresh}
          pullingText="下拉刷新"
          canReleaseText="释放刷新"
          refreshingText="加载中..."
          completeText="刷新成功"
        >
          {loading && !shows.length ? (
            <div style={styles.loading}>加载中...</div>
          ) : shows.length === 0 ? (
            <Empty description="暂无场次记录" />
          ) : (
            <div style={styles.grid}>
              {shows.map((show) => {
                const color = getTypeColor(show.musical_type)
                return (
                  <article
                    key={show.id}
                    style={{
                      ...styles.card,
                      backgroundColor: color.bg
                    }}
                    onClick={() => handleCardClick(show.id)}
                  >
                    {/* Main Details */}
                    <div style={styles.cardMain}>
                      <h2 style={{ ...styles.cardName, color: color.text }}>{show.musical_name}</h2>
                      <p style={{ ...styles.cardLocation, color: color.text }}>
                        {(show.city || show.theater) ? `${show.city || ''} ${show.theater || ''}`.trim() : '未知剧场'}
                      </p>
                      <div style={styles.seatWrapper}>
                        <span style={{ ...styles.seatTag, color: color.text }}>{show.seat || '未知座位'}</span>
                      </div>
                    </div>

                    {/* Stub Separator with Notches */}
                    <div style={styles.separator}>
                      <div style={{ ...styles.separatorLine, borderColor: `${color.text}30` }}></div>
                      <div style={{ ...styles.notch, left: -4 }}></div>
                      <div style={{ ...styles.notch, right: -4 }}></div>
                    </div>

                    {/* Ticket Stub (Date) */}
                    <div style={styles.cardStub}>
                      {(() => {
                        const parts = formatDateParts(show.show_time)
                        return (
                          <>
                            <div style={{ ...styles.monthText, color: color.text }}>{parts.month}</div>
                            <div style={styles.dayYearContainer}>
                              <div style={{ ...styles.dayText, color: color.text }}>{parts.day}</div>
                              <div style={{ ...styles.yearText, color: color.text }}>{parts.year}</div>
                            </div>
                            <div style={{ ...styles.timeText, color: color.text }}>{parts.time}</div>
                          </>
                        )
                      })()}
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
    color: '#356668',
    margin: 0
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
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(53, 102, 104, 0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    overflow: 'hidden'
  },
  cardMain: {
    flex: 1,
    padding: '12px 12px 6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  cardName: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0
  },
  cardLocation: {
    fontSize: '10px',
    opacity: 0.7,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0
  },
  seatWrapper: {
    marginTop: '6px',
    display: 'flex',
    gap: '4px'
  },
  seatTag: {
    padding: '2px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '999px',
    fontSize: '8px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
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
    width: 'calc(100% - 16px)',
    borderTop: '1.5px dashed',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    position: 'absolute'
  },
  notch: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#faf9f6',
    borderRadius: '50%',
    boxShadow: 'inset 2px 0 4px rgba(0, 0, 0, 0.02)'
  },
  cardStub: {
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  monthText: {
    fontSize: '8px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.7
  },
  dayYearContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: 'translateY(-2px)'
  },
  dayText: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1
  },
  yearText: {
    fontSize: '8px',
    fontWeight: 600,
    opacity: 0.7
  },
  timeText: {
    fontSize: '8px',
    fontWeight: 700,
    opacity: 0.7
  }
}
