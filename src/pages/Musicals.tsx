import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, PullToRefresh } from 'antd-mobile'
import { getMusicals } from '../services/musical'
import { cache } from '../hooks/useCache'
import type { MusicalCard, MusicalType } from '../types'

const TYPE_OPTIONS: { label: string; value: MusicalType | '' }[] = [
  { label: '全部', value: '' },
  { label: '中国音乐剧', value: '中国音乐剧' },
  { label: '非中音乐剧', value: '非中音乐剧' },
  { label: '话剧', value: '话剧' },
  { label: '舞剧', value: '舞剧' }
]

// 剧目类型与颜色映射
const typeColorMap: Record<MusicalType, { bg: string; text: string }> = {
  '中国音乐剧': { bg: '#a8dadc', text: '#1a4e50' },
  '非中音乐剧': { bg: '#ffb6c1', text: '#6b3741' },
  '话剧': { bg: '#d3cbff', text: '#473d81' },
  '舞剧': { bg: '#b9ecee', text: '#002021' },
}

const getTypeColor = (type: MusicalType) => {
  return typeColorMap[type] || { bg: '#a8dadc', text: '#1a4e50' }
}

const CACHE_KEY = 'musical_musicals_cache'

export default function Musicals() {
  const navigate = useNavigate()
  const [musicals, setMusicals] = useState<MusicalCard[]>(() => cache.get<MusicalCard[]>(`${CACHE_KEY}_`) || [])
  const [loading, setLoading] = useState(!musicals.length)
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState<'type' | 'name' | null>(null)
  const [selectedType, setSelectedType] = useState<MusicalType | ''>('')
  const [selectedMusicalId, setSelectedMusicalId] = useState<string>('')
  const [selectedMusicalName, setSelectedMusicalName] = useState<string>('')
  const [nameSearch, setNameSearch] = useState('')

  const sortMusicals = (data: MusicalCard[]) => {
    return [...data].sort((a, b) => {
      if (b.watch_count !== a.watch_count) return b.watch_count - a.watch_count
      return b.avg_score - a.avg_score
    })
  }

  const loadMusicals = useCallback(async (forceRefresh: boolean = false) => {
    const cacheKey = `${CACHE_KEY}_${selectedType}`

    if (!forceRefresh) {
      const cached = cache.get<MusicalCard[]>(cacheKey)
      if (cached) {
        setMusicals(sortMusicals(cached))
        setLoading(false)
        return
      }
    }

    setLoading(true)
    try {
      const data = await getMusicals(selectedType || undefined)
      setMusicals(sortMusicals(data))
      cache.set(cacheKey, data)
    } catch (error) {
      console.error('加载剧目列表失败:', error)
      const cached = cache.get<MusicalCard[]>(cacheKey, true)
      if (cached) setMusicals(sortMusicals(cached))
    } finally {
      setLoading(false)
    }
  }, [selectedType])

  useEffect(() => {
    loadMusicals()
  }, [loadMusicals])

  const handleRefresh = async () => {
    await loadMusicals(true)
  }

  const handleCardClick = (id: string) => {
    navigate(`/musicals/${id}`)
  }

  const handleAddClick = () => {
    navigate('/musicals/new')
  }

  const handleOpenFilter = () => {
    setFilterVisible(true)
    setFilterExpanded(null)
    setNameSearch('')
  }

  const handleTypeSelect = (type: MusicalType | '') => {
    setSelectedType(type)
    setSelectedMusicalId('')
    setSelectedMusicalName('')
    setFilterVisible(false)
    setFilterExpanded(null)
  }

  const handleMusicalSelect = (musical: MusicalCard) => {
    setSelectedMusicalId(musical.id)
    setSelectedMusicalName(musical.name)
    setSelectedType('')
    setFilterVisible(false)
    setFilterExpanded(null)
  }

  const handleClearNameFilter = () => {
    setSelectedMusicalId('')
    setSelectedMusicalName('')
    setFilterVisible(false)
    setFilterExpanded(null)
  }

  // 名称筛选列表
  const filteredMusicalsByName = musicals.filter(m =>
    m.name.toLowerCase().includes(nameSearch.toLowerCase())
  )

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
          setFilterExpanded(null)
        }}>
          <div style={styles.filterPopup} onClick={e => e.stopPropagation()}>
            <div style={styles.filterRow} onClick={() => setFilterExpanded(filterExpanded === 'type' ? null : 'type')}>
              <span style={styles.filterRowText}>剧目类型</span>
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
            <div style={styles.filterRow} onClick={() => setFilterExpanded(filterExpanded === 'name' ? null : 'name')}>
              <span style={styles.filterRowText}>剧目名称</span>
              <span style={styles.filterRowValue}>
                {selectedMusicalName || ''}
              </span>
              <span className="material-symbols-outlined" style={{
                ...styles.filterRowArrow,
                transform: filterExpanded === 'name' ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>expand_more</span>
            </div>
            {filterExpanded === 'name' && (
              <div style={styles.filterSearchSection}>
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="搜索剧目..."
                  value={nameSearch}
                  onChange={e => setNameSearch(e.target.value)}
                  autoFocus
                />
                <div style={styles.filterOptionsScrollable}>
                  <div
                    style={{
                      ...styles.filterOption,
                      ...(!selectedMusicalId ? styles.filterOptionActive : {})
                    }}
                    onClick={handleClearNameFilter}
                  >
                    全部
                  </div>
                  {filteredMusicalsByName.map(musical => (
                    <div
                      key={musical.id}
                      style={{
                        ...styles.filterOption,
                        ...(selectedMusicalId === musical.id ? styles.filterOptionActive : {})
                      }}
                      onClick={() => handleMusicalSelect(musical)}
                    >
                      {musical.name}
                    </div>
                  ))}
                  {filteredMusicalsByName.length === 0 && (
                    <div style={styles.filterEmpty}>暂无匹配剧目</div>
                  )}
                </div>
              </div>
            )}
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
        {loading && !musicals.length ? (
          <div style={styles.loading}>加载中...</div>
        ) : (selectedMusicalId ? musicals.filter(m => m.id === selectedMusicalId) : musicals).length === 0 ? (
          <Empty description="暂无剧目记录" />
        ) : (
          <div style={styles.grid}>
            {(selectedMusicalId ? musicals.filter(m => m.id === selectedMusicalId) : musicals).map(musical => {
              const color = getTypeColor(musical.type)
              return (
                <article
                  key={musical.id}
                  style={{
                    ...styles.card,
                    backgroundColor: color.bg
                  }}
                  onClick={() => handleCardClick(musical.id)}
                >
                  {/* 左侧内容区 */}
                  <div style={styles.cardMain}>
                    <h2 style={{ ...styles.cardName, color: color.text }}>{musical.name}</h2>
                    <p style={{ ...styles.cardBrand, color: color.text }}>{musical.brand || '未知出品方'}</p>
                    <span style={{ ...styles.typeTag, color: color.text }}>{musical.type}</span>
                  </div>

                  {/* 分隔线与半圆缺口 */}
                  <div style={styles.separator}>
                    <div style={{ ...styles.separatorLine, borderColor: `${color.text}30` }}></div>
                    <div style={{ ...styles.notch, top: -6 }}></div>
                    <div style={{ ...styles.notch, bottom: -6 }}></div>
                  </div>

                  {/* 右侧统计区 */}
                  <div style={styles.cardStub}>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={{ ...styles.statIcon, color: color.text }}>visibility</span>
                      <span style={{ ...styles.statValue, color: color.text }}>{musical.watch_count ?? 0}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span className="material-symbols-outlined" style={{ ...styles.statIcon, color: color.text }}>star</span>
                      <span style={{ ...styles.statValue, color: color.text }}>{(musical.avg_score || 0).toFixed(1)}</span>
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
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(53, 102, 104, 0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    overflow: 'hidden'
  },
  cardMain: {
    width: '70%',
    padding: '12px 12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: '6px'
  },
  cardName: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardBrand: {
    fontSize: '10px',
    opacity: 0.7,
    margin: 0
  },
  typeTag: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '2px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '999px',
    fontSize: '8px',
    fontWeight: 600
  },
  separator: {
    position: 'absolute',
    right: '30%',
    top: 0,
    bottom: 0,
    width: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  separatorLine: {
    width: '1px',
    height: '100%',
    borderLeft: '1.5px dashed',
    borderColor: 'rgba(0, 0, 0, 0.15)'
  },
  notch: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#faf9f6',
    borderRadius: '50%',
    right: -6,
    boxShadow: 'inset 2px 0 4px rgba(0, 0, 0, 0.02)'
  },
  cardStub: {
    width: '30%',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  statIcon: {
    fontSize: '12px'
  },
  statValue: {
    fontSize: '12px',
    fontWeight: 600
  }
}
