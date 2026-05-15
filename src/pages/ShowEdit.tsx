import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showToast } from '../components/Toast'
import { getShowById, createShow, updateShow, saveActorReviews } from '../services/show'
import { getMusicalNames } from '../services/musical'
import { getArtistNames } from '../services/artist'
import { cache } from '../hooks/useCache'
import type { ActorType, MusicalType } from '../types'

const SCORE_LABELS: Record<MusicalType, string> = {
  '中国音乐剧': '演唱',
  '非中音乐剧': '演唱',
  '话剧': '感受',
  '舞剧': '舞蹈'
}

interface ActorReviewInput {
  id?: string
  artist_id: string
  artist_name: string
  actor_type: ActorType
  role: string
  review: string
}

export default function ShowEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const musicalInputRef = useRef<HTMLDivElement>(null)
  const [musicalDropdownPos, setMusicalDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const [formData, setFormData] = useState({
    musical_id: '',
    musical_name: '',
    show_time: getDefaultDateTime(),
    city: '',
    theater: '',
    seat: '',
    plot_score: 0,
    visual_score: 0,
    acting_score: 0,
    script_score: 0,
    singing_score: 0,
    note: ''
  })
  const [actorReviews, setActorReviews] = useState<ActorReviewInput[]>([
    { artist_id: '', artist_name: '', actor_type: '主演', role: '', review: '' }
  ])
  const [musicalOptions, setMusicalOptions] = useState<{ id: string; name: string; type: MusicalType }[]>([])
  const [artistOptions, setArtistOptions] = useState<{ id: string; name: string }[]>([])
  const [musicalSearch, setMusicalSearch] = useState('')
  const [selectedMusicalType, setSelectedMusicalType] = useState<MusicalType | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [showMusicalDropdown, setShowMusicalDropdown] = useState(false)
  const [artistSearchIndex, setArtistSearchIndex] = useState<number | null>(null)
  const [artistSearch, setArtistSearch] = useState('')
  const [showArtistDropdown, setShowArtistDropdown] = useState(false)
  const [artistDropdownPos, setArtistDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [showActorTypeDropdown, setShowActorTypeDropdown] = useState(false)
  const [actorTypeDropdownIndex, setActorTypeDropdownIndex] = useState<number | null>(null)
  const [actorTypeDropdownPos, setActorTypeDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [showDateTimePicker, setShowDateTimePicker] = useState(false)
  const [dateTimePickerPos, setDateTimePickerPos] = useState({ top: 0, left: 0, width: 0 })
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [selectedHour, setSelectedHour] = useState(19)
  const [selectedMinute, setSelectedMinute] = useState(30)
  const [showHourDropdown, setShowHourDropdown] = useState(false)
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false)
  const dateTimeRef = useRef<HTMLDivElement>(null)

  function getDefaultDateTime() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}T19:30`
  }

  function formatDbTimeToLocal(dbTime: string) {
    const date = new Date(dbTime)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  useEffect(() => {
    loadOptions()
    if (isEdit && id) {
      loadShow(id)
    }
  }, [id, isEdit])

  const loadOptions = async () => {
    try {
      const [musicals, artists] = await Promise.all([
        getMusicalNames(),
        getArtistNames()
      ])
      setMusicalOptions(musicals)
      setArtistOptions(artists)
    } catch (error) {
      console.error('加载选项失败:', error)
    }
  }

  const loadShow = async (showId: string) => {
    try {
      const data = await getShowById(showId)
      // 将数据库返回的时间转换为本地时间格式
      const showTimeLocal = formatDbTimeToLocal(data.show_time)
      setFormData({
        musical_id: data.musical_id,
        musical_name: data.musical.name,
        show_time: showTimeLocal,
        city: data.city ?? '',
        theater: data.theater ?? '',
        seat: data.seat ?? '',
        plot_score: data.plot_score ?? 0,
        visual_score: data.visual_score ?? 0,
        acting_score: data.acting_score ?? 0,
        script_score: data.script_score ?? 0,
        singing_score: data.singing_score ?? 0,
        note: data.note ?? ''
      })
      setSelectedMusicalType(data.musical.type)
      if (data.actor_reviews.length > 0) {
        setActorReviews(data.actor_reviews.map(r => ({
          id: r.id,
          artist_id: r.artist_id,
          artist_name: r.artist.name,
          actor_type: r.actor_type,
          role: r.role,
          review: r.review
        })))
      }
    } catch (error) {
      console.error('加载场次失败:', error)
      showToast({ content: '加载失败', icon: 'fail' })
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleMusicalSelect = (musical: { id: string; name: string; type: MusicalType }) => {
    setFormData({ ...formData, musical_id: musical.id, musical_name: musical.name })
    setSelectedMusicalType(musical.type)
    setMusicalSearch('')
    setShowMusicalDropdown(false)
  }

  const handleOpenMusicalDropdown = () => {
    if (musicalInputRef.current) {
      const rect = musicalInputRef.current.getBoundingClientRect()
      setMusicalDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    }
    setShowMusicalDropdown(true)
    setMusicalSearch('')
  }

  const handleArtistSelect = (artist: { id: string; name: string }, index: number) => {
    const newReviews = [...actorReviews]
    newReviews[index] = { ...newReviews[index], artist_id: artist.id, artist_name: artist.name }
    setActorReviews(newReviews)
    setArtistSearch('')
    setShowArtistDropdown(false)
    setArtistSearchIndex(null)
  }

  const handleOpenArtistDropdown = (index: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    setArtistDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    })
    setArtistSearchIndex(index)
    setShowArtistDropdown(true)
    setArtistSearch('')
  }

  const handleActorTypeSelect = (type: ActorType, index: number) => {
    updateActorReview(index, 'actor_type', type)
    setShowActorTypeDropdown(false)
    setActorTypeDropdownIndex(null)
  }

  const handleOpenActorTypeDropdown = (index: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    setActorTypeDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width
    })
    setActorTypeDropdownIndex(index)
    setShowActorTypeDropdown(true)
  }

  const handleAddActorReview = () => {
    setActorReviews([...actorReviews, { artist_id: '', artist_name: '', actor_type: '主演', role: '', review: '' }])
  }

  const handleRemoveActorReview = (index: number) => {
    if (actorReviews.length > 1) {
      setActorReviews(actorReviews.filter((_, i) => i !== index))
    }
  }

  const updateActorReview = (index: number, field: keyof ActorReviewInput, value: string | ActorType) => {
    const newReviews = [...actorReviews]
    newReviews[index] = { ...newReviews[index], [field]: value }
    setActorReviews(newReviews)
  }

  const handleScoreChange = (field: string, score: number) => {
    setFormData({ ...formData, [field]: score })
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

  const handleOpenDateTimePicker = () => {
    if (dateTimeRef.current) {
      const rect = dateTimeRef.current.getBoundingClientRect()
      setDateTimePickerPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      })
    }
    // 初始化选择的日期和时间
    if (formData.show_time) {
      const current = new Date(formData.show_time)
      setSelectedDate(new Date(current.getFullYear(), current.getMonth(), 1))
      setSelectedHour(current.getHours())
      setSelectedMinute(current.getMinutes())
    }
    setShowDateTimePicker(true)
  }

  const handleDateSelect = (day: number) => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const newDate = new Date(year, month, day, selectedHour, selectedMinute)
    const dateStr = formatLocalDateTime(newDate)
    setFormData({ ...formData, show_time: dateStr })
  }

  const handlePrevMonth = () => {
    const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    setSelectedDate(prev)
  }

  const handleNextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    setSelectedDate(next)
  }

  const formatLocalDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  const handleConfirmDateTime = () => {
    // 使用 formData.show_time 中的日期，只更新小时和分钟
    const currentDate = formData.show_time ? new Date(formData.show_time) : new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = currentDate.getDate()
    const newDate = new Date(year, month, day, selectedHour, selectedMinute)
    const dateStr = formatLocalDateTime(newDate)
    setFormData({ ...formData, show_time: dateStr })
    setShowDateTimePicker(false)
    setShowHourDropdown(false)
    setShowMinuteDropdown(false)
  }

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour)
    setShowHourDropdown(false)
    // 立即更新 formData
    const currentDate = formData.show_time ? new Date(formData.show_time) : new Date()
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, selectedMinute)
    setFormData({ ...formData, show_time: formatLocalDateTime(newDate) })
  }

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute)
    setShowMinuteDropdown(false)
    // 立即更新 formData
    const currentDate = formData.show_time ? new Date(formData.show_time) : new Date()
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), selectedHour, minute)
    setFormData({ ...formData, show_time: formatLocalDateTime(newDate) })
  }

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const renderDateTimePicker = () => {
    const { firstDay, daysInMonth } = getDaysInMonth()
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth() + 1
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const currentDate = formData.show_time ? new Date(formData.show_time) : null
    const currentDay = currentDate ? currentDate.getDate() : null
    const currentMonth = currentDate ? currentDate.getMonth() + 1 : null
    const currentYear = currentDate ? currentDate.getFullYear() : null

    return (
      <div style={{
        ...styles.dateTimePicker,
        top: dateTimePickerPos.top,
        left: dateTimePickerPos.left,
        width: Math.max(dateTimePickerPos.width, 300)
      }} onClick={e => e.stopPropagation()}>
        {/* 月份导航 */}
        <div style={styles.dateNav}>
          <button style={styles.dateNavBtn} onClick={handlePrevMonth}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span style={styles.dateNavTitle}>{year}年{month}月</span>
          <button style={styles.dateNavBtn} onClick={handleNextMonth}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* 星期标题 */}
        <div style={styles.weekDays}>
          {weekDays.map(day => (
            <div key={day} style={styles.weekDay}>{day}</div>
          ))}
        </div>

        {/* 日期网格 */}
        <div style={styles.daysGrid}>
          {/* 空白填充 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={styles.dayEmpty} />
          ))}
          {/* 日期 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isSelected = currentDay === day && currentMonth === month && currentYear === year
            return (
              <div
                key={day}
                style={{
                  ...styles.dayItem,
                  ...(isSelected ? styles.dayItemSelected : {})
                }}
                onClick={() => handleDateSelect(day)}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* 时间选择 */}
        <div style={styles.timeSelector}>
          <div style={styles.timeDisplayGroup}>
            <div
              style={styles.timeDisplayItem}
              onClick={(e) => {
                e.stopPropagation()
                setShowHourDropdown(!showHourDropdown)
                setShowMinuteDropdown(false)
              }}
            >
              <span style={styles.timeDisplayValue}>{String(selectedHour).padStart(2, '0')}</span>
              <span style={styles.timeDisplayLabel}>时</span>
              <span className="material-symbols-outlined" style={styles.timeDisplayArrow}>expand_more</span>
            </div>
            <span style={styles.timeDisplayColon}>:</span>
            <div
              style={styles.timeDisplayItem}
              onClick={(e) => {
                e.stopPropagation()
                setShowMinuteDropdown(!showMinuteDropdown)
                setShowHourDropdown(false)
              }}
            >
              <span style={styles.timeDisplayValue}>{String(selectedMinute).padStart(2, '0')}</span>
              <span style={styles.timeDisplayLabel}>分</span>
              <span className="material-symbols-outlined" style={styles.timeDisplayArrow}>expand_more</span>
            </div>

            {/* 小时下拉 */}
            {showHourDropdown && (
              <div style={styles.timeDropdown} onClick={e => e.stopPropagation()}>
                <div style={styles.timeDropdownGrid}>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.timeDropdownItem,
                        ...(selectedHour === i ? styles.timeDropdownItemActive : {})
                      }}
                      onClick={() => handleHourSelect(i)}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 分钟下拉 */}
            {showMinuteDropdown && (
              <div style={{ ...styles.timeDropdown, left: 'auto', right: '0' }} onClick={e => e.stopPropagation()}>
                <div style={styles.timeDropdownGrid}>
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.timeDropdownItem,
                        ...(selectedMinute === i ? styles.timeDropdownItemActive : {})
                      }}
                      onClick={() => handleMinuteSelect(i)}
                    >
                      {String(i).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button style={styles.confirmBtn} onClick={handleConfirmDateTime}>确定</button>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (submitting) return
    // 校验剧目不为空
    if (!formData.musical_id) {
      showToast({ content: '请选择剧目', icon: 'fail' })
      return
    }

    setSubmitting(true)
    try {
      // 将本地时间转换为ISO格式，添加北京时间时区偏移
      const localTime = formData.show_time
      const showTimeWithTimezone = localTime + '+08:00'

      const showData = {
        musical_id: formData.musical_id,
        show_time: showTimeWithTimezone,
        city: formData.city?.trim() || undefined,
        theater: formData.theater?.trim() || undefined,
        seat: formData.seat?.trim() || undefined,
        plot_score: formData.plot_score || undefined,
        visual_score: formData.visual_score || undefined,
        acting_score: formData.acting_score || undefined,
        script_score: formData.script_score || undefined,
        singing_score: formData.singing_score || undefined,
        note: formData.note?.trim() || undefined
      }

      let showId: string
      if (isEdit && id) {
        await updateShow(id, showData)
        showId = id
        showToast({ content: '保存成功', icon: 'success' })
      } else {
        const newShow = await createShow(showData)
        showId = newShow.id
        showToast({ content: '创建成功', icon: 'success' })
      }

      // 保存演员评价
      const validReviews = actorReviews.filter(r => r.artist_id)
      await saveActorReviews(showId, validReviews.map(r => ({
        artist_id: r.artist_id,
        actor_type: r.actor_type,
        role: r.role,
        review: r.review
      })))

      // 清除缓存
      cache.remove(`musical_show_${showId}`)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('musical_shows_cache')) cache.remove(key)
        if (key.startsWith('musical_musicals_cache')) cache.remove(key)
        if (key.startsWith('musical_detail_')) cache.remove(key)
        if (key.startsWith('musical_artist_')) cache.remove(key)
        if (key.startsWith('musical_artists_cache')) cache.remove(key)
        if (key.startsWith('musical_years_cache')) cache.remove(key)
      })

      navigate(-1)
    } catch (error) {
      console.error('保存失败:', error)
      showToast({ content: '保存失败', icon: 'fail' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMusicals = musicalOptions.filter(m =>
    m.name.toLowerCase().includes(musicalSearch.toLowerCase())
  )

  const filteredArtists = artistOptions.filter(a =>
    a.name.toLowerCase().includes(artistSearch.toLowerCase())
  )

  const renderStars = (field: string, value: number) => {
    return (
      <div style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(score => (
          <span
            key={score}
            style={{
              ...styles.star,
              color: score <= value ? '#356668' : '#c0c8c8',
              cursor: 'pointer'
            }}
            onClick={() => handleScoreChange(field, score)}
          >
            {score <= value ? '★' : '☆'}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* TopAppBar */}
      <header style={styles.header}>
        <button style={styles.iconBtn} onClick={handleBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 style={styles.title}>{isEdit ? '编辑场次' : '新增场次'}</h1>
        <button style={{ ...styles.iconBtn, opacity: submitting ? 0.5 : 1 }} onClick={handleSubmit} disabled={submitting}>
          <span className="material-symbols-outlined">check</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        {/* 基本信息 */}
        <section style={styles.section}>
          {/* 剧目选择 */}
          <div style={styles.formItem}>
            <label style={styles.label}>剧目</label>
            <div ref={musicalInputRef} style={styles.pickerRow} onClick={handleOpenMusicalDropdown}>
              <span style={{ ...styles.pickerValue, color: formData.musical_name ? '#1a1c1a' : '#707979' }}>
                {formData.musical_name || '剧目'}
              </span>
              <span className="material-symbols-outlined" style={styles.pickerArrow}>expand_more</span>
            </div>
          </div>

          {/* 演出时间 */}
          <div style={styles.formItem}>
            <label style={styles.label}>演出时间</label>
            <div ref={dateTimeRef} style={styles.dateTimePickerTrigger} onClick={handleOpenDateTimePicker}>
              <span style={{ ...styles.pickerValue, color: formData.show_time ? '#1a1c1a' : '#707979' }}>
                {formData.show_time ? formatDateTime(formData.show_time) : '选择日期时间'}
              </span>
            </div>
          </div>

          {/* 城市和剧院 */}
          <div style={styles.row}>
            <div style={{ ...styles.formItem, flex: 1 }}>
              <label style={styles.label}>城市</label>
              <input
                type="text"
                style={{ ...styles.input, color: formData.city ? '#1a1c1a' : '#707979' }}
                placeholder="城市"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div style={{ ...styles.formItem, flex: 1 }}>
              <label style={styles.label}>剧院</label>
              <input
                type="text"
                style={{ ...styles.input, color: formData.theater ? '#1a1c1a' : '#707979' }}
                placeholder="剧院"
                value={formData.theater}
                onChange={e => setFormData({ ...formData, theater: e.target.value })}
              />
            </div>
          </div>

          {/* 座位 */}
          <div style={styles.formItem}>
            <label style={styles.label}>座位</label>
            <input
              type="text"
              style={{ ...styles.input, color: formData.seat ? '#1a1c1a' : '#707979' }}
              placeholder="座位"
              value={formData.seat}
              onChange={e => setFormData({ ...formData, seat: e.target.value })}
            />
          </div>
        </section>

        {/* 评分 */}
        <section style={styles.section}>
          <label style={styles.label}>评分</label>
          <div style={styles.scoreCard}>
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>剧情</span>
              {renderStars('plot_score', formData.plot_score)}
            </div>
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>舞美</span>
              {renderStars('visual_score', formData.visual_score)}
            </div>
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>演技</span>
              {renderStars('acting_score', formData.acting_score)}
            </div>
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>台词</span>
              {renderStars('script_score', formData.script_score)}
            </div>
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>{selectedMusicalType ? SCORE_LABELS[selectedMusicalType] : '演唱'}</span>
              {renderStars('singing_score', formData.singing_score)}
            </div>
          </div>
        </section>

        {/* 观后感 */}
        <section style={styles.section}>
          <label style={styles.label}>观后感</label>
          <textarea
            style={{ ...styles.textarea, color: formData.note ? '#1a1c1a' : '#707979' }}
            placeholder="记录一下这一场的整体感受..."
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
          />
        </section>

        {/* 演员评价 */}
        <section style={styles.section}>
          <label style={styles.label}>演员评价</label>
          <div style={styles.actorSection}>
            {actorReviews.map((review, index) => (
              <div key={index} style={styles.actorCard}>
                <div style={styles.actorCardHeader}>
                  <span style={styles.actorCardLabel}>卡司 {index + 1}</span>
                  <div style={styles.actorCardActions}>
                    <button style={styles.actorCardBtn} onClick={() => handleRemoveActorReview(index)}>
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    {index === actorReviews.length - 1 && (
                      <button style={styles.actorCardBtn} onClick={handleAddActorReview}>
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    )}
                  </div>
                </div>
                <div style={styles.actorCardForm}>
                  {/* 演员姓名 */}
                  <div style={{ ...styles.formItem, flex: 1 }}>
                    <label style={styles.smallLabel}>演员姓名</label>
                    <div
                      style={styles.smallPickerRow}
                      onClick={(e) => handleOpenArtistDropdown(index, e.currentTarget)}
                    >
                      <span style={{ color: review.artist_name ? '#1a1c1a' : '#707979' }}>
                        {review.artist_name || '演员'}
                      </span>
                      <span className="material-symbols-outlined" style={styles.smallPickerArrow}>expand_more</span>
                    </div>
                  </div>
                  {/* 角色类型 */}
                  <div style={{ ...styles.formItem, flex: 1 }}>
                    <label style={styles.smallLabel}>角色类型</label>
                    <div
                      style={styles.smallPickerRow}
                      onClick={(e) => handleOpenActorTypeDropdown(index, e.currentTarget)}
                    >
                      <span style={{ color: '#1a1c1a' }}>
                        {review.actor_type}
                      </span>
                      <span className="material-symbols-outlined" style={styles.smallPickerArrow}>expand_more</span>
                    </div>
                  </div>
                </div>
                {/* 饰演角色 */}
                <div style={styles.formItem}>
                  <label style={styles.smallLabel}>饰演角色</label>
                  <input
                    type="text"
                    style={styles.smallInput}
                    placeholder="角色"
                    value={review.role}
                    onChange={e => updateActorReview(index, 'role', e.target.value)}
                  />
                </div>
                {/* 表现评价 */}
                <div style={styles.formItem}>
                  <label style={styles.smallLabel}>表现评价</label>
                  <textarea
                    style={styles.smallTextarea}
                    placeholder="点评一下这位演员的表现..."
                    value={review.review}
                    onChange={e => updateActorReview(index, 'review', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 剧目下拉框 */}
      {showMusicalDropdown && (
        <div style={styles.overlay} onClick={() => setShowMusicalDropdown(false)}>
          <div
            style={{
              ...styles.dropdown,
              top: musicalDropdownPos.top,
              left: musicalDropdownPos.left,
              width: musicalDropdownPos.width
            }}
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              style={styles.searchInput}
              placeholder="搜索剧目..."
              value={musicalSearch}
              onChange={e => setMusicalSearch(e.target.value)}
              autoFocus
            />
            <div style={styles.dropdownList}>
              {filteredMusicals.map(musical => (
                <div
                  key={musical.id}
                  style={styles.dropdownItem}
                  onClick={() => handleMusicalSelect(musical)}
                >
                  {musical.name}
                </div>
              ))}
              {filteredMusicals.length === 0 && (
                <div style={styles.dropdownEmpty}>暂无匹配剧目</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 演员下拉框 */}
      {showArtistDropdown && artistSearchIndex !== null && (
        <div style={styles.overlay} onClick={() => {
          setShowArtistDropdown(false)
          setArtistSearchIndex(null)
        }}>
          <div
            style={{
              ...styles.dropdown,
              top: artistDropdownPos.top,
              left: artistDropdownPos.left,
              width: artistDropdownPos.width
            }}
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              style={styles.searchInput}
              placeholder="搜索演员..."
              value={artistSearch}
              onChange={e => setArtistSearch(e.target.value)}
              autoFocus
            />
            <div style={styles.dropdownList}>
              {filteredArtists.map(artist => (
                <div
                  key={artist.id}
                  style={styles.dropdownItem}
                  onClick={() => handleArtistSelect(artist, artistSearchIndex)}
                >
                  {artist.name}
                </div>
              ))}
              {filteredArtists.length === 0 && (
                <div style={styles.dropdownEmpty}>暂无匹配演员</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 角色类型下拉框 */}
      {showActorTypeDropdown && actorTypeDropdownIndex !== null && (
        <div style={styles.overlay} onClick={() => {
          setShowActorTypeDropdown(false)
          setActorTypeDropdownIndex(null)
        }}>
          <div
            style={{
              ...styles.dropdown,
              top: actorTypeDropdownPos.top,
              left: actorTypeDropdownPos.left,
              width: actorTypeDropdownPos.width
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={styles.dropdownList}>
              {(['主演', '群演'] as ActorType[]).map(type => (
                <div
                  key={type}
                  style={{
                    ...styles.dropdownItem,
                    ...(actorReviews[actorTypeDropdownIndex]?.actor_type === type ? styles.dropdownItemActive : {})
                  }}
                  onClick={() => handleActorTypeSelect(type, actorTypeDropdownIndex)}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 日期时间选择器 */}
      {showDateTimePicker && (
        <div style={styles.overlay} onClick={() => {
          setShowDateTimePicker(false)
          setShowHourDropdown(false)
          setShowMinuteDropdown(false)
        }}>
          {renderDateTimePicker()}
        </div>
      )}
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
    padding: '0 16px',
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
    padding: '86px 16px 24px',
    maxWidth: '512px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  section: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1c1a',
    padding: '0 4px'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  pickerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  pickerValue: {
    fontSize: '14px'
  },
  pickerArrow: {
    fontSize: '20px',
    color: '#707979'
  },
  dateTimePickerTrigger: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  dateTimePicker: {
    position: 'fixed',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '15px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    zIndex: 101
  },
  dateNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 8px',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)'
  },
  dateNavBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#356668',
    cursor: 'pointer',
    borderRadius: '8px'
  },
  dateNavTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1c1a'
  },
  weekDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    padding: '8px 12px 4px',
    gap: '4px'
  },
  weekDay: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#707979',
    fontWeight: 500
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    padding: '4px 12px 12px',
    gap: '4px'
  },
  dayEmpty: {
    height: '32px'
  },
  dayItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '32px',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1a1c1a',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  dayItemSelected: {
    backgroundColor: '#356668',
    color: '#ffffff',
    fontWeight: 600
  },
  timeSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid rgba(192, 200, 200, 0.3)'
  },
  timeDisplayGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    position: 'relative'
  },
  timeDisplayItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  timeDisplayValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1c1a'
  },
  timeDisplayLabel: {
    fontSize: '12px',
    color: '#707979'
  },
  timeDisplayArrow: {
    fontSize: '16px',
    color: '#707979'
  },
  timeDisplayColon: {
    fontSize: '20px',
    color: '#356668',
    fontWeight: 600
  },
  timeDropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    marginTop: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '4px',
    zIndex: 200,
    maxHeight: '200px',
    overflowY: 'auto',
    minWidth: '60px'
  },
  timeDropdownGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  timeDropdownItem: {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1a1c1a',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s'
  },
  timeDropdownItemActive: {
    backgroundColor: '#356668',
    color: '#ffffff',
    fontWeight: 600
  },
  confirmBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#356668',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e3e2e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#707979',
    width: '64px'
  },
  starsContainer: {
    display: 'flex',
    gap: '4px'
  },
  star: {
    fontSize: '24px',
    transition: 'color 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e3e2e0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    resize: 'none',
    minHeight: '100px',
    lineHeight: 1.5
  },
  actorSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e3e2e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  actorCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  actorCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)'
  },
  actorCardLabel: {
    fontSize: '12px',
    color: '#707979',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 600
  },
  actorCardActions: {
    display: 'flex',
    gap: '8px'
  },
  actorCardBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#707979',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'color 0.2s'
  },
  actorCardForm: {
    display: 'flex',
    gap: '16px'
  },
  smallLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#707979'
  },
  smallPickerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    border: '1px solid #e3e2e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  smallPickerArrow: {
    fontSize: '16px',
    color: '#707979'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e3e2e0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer'
  },
  smallInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e3e2e0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none'
  },
  smallTextarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e3e2e0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    resize: 'none',
    minHeight: '80px',
    lineHeight: 1.5
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100
  },
  dropdown: {
    position: 'fixed',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(53, 102, 104, 0.12)',
    maxHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid rgba(192, 200, 200, 0.3)',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'transparent'
  },
  dropdownList: {
    flex: 1,
    overflowY: 'auto'
  },
  dropdownItem: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1a1c1a',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  dropdownItemActive: {
    backgroundColor: '#356668',
    color: '#ffffff'
  },
  dropdownEmpty: {
    padding: '16px',
    fontSize: '14px',
    color: '#707979',
    textAlign: 'center'
  }
}
