import { supabase, getUserId } from '../lib/supabase'
import type { Artist, ArtistDetail } from '../types'
import { calcMultiShowAvg } from '../lib/score'

// 获取演员列表（带统计信息）
export async function getArtists(): Promise<(Artist & { watch_count: number; avg_score: number; avg_order: number })[]> {
  const { data, error } = await supabase
    .from('artist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // 获取所有主演的场次和演员评价
  const { data: actorReviews, error: reviewError } = await supabase
    .from('actor_review')
    .select(`
      artist_name,
      actor_type,
      actor_order,
      show:show(
        plot_score,
        visual_score,
        acting_score,
        script_score,
        singing_score
      )
    `)
    .eq('actor_type', '主演')

  if (reviewError) throw reviewError

  // 按演员名称分组场次和order
  const artistShows = new Map<string, any[]>()
  const artistOrders = new Map<string, number[]>()
  actorReviews?.forEach((review: any) => {
    const artistName = review.artist_name
    const show = review.show
    if (show) {
      const existing = artistShows.get(artistName)
      if (existing) existing.push(show)
      else artistShows.set(artistName, [show])
    }
    if (review.actor_order != null) {
      const orders = artistOrders.get(artistName)
      if (orders) orders.push(review.actor_order)
      else artistOrders.set(artistName, [review.actor_order])
    }
  })

  return (data || []).map(artist => {
    const shows = artistShows.get(artist.name) || []
    const watchCount = shows.length
    const avgScore = calcMultiShowAvg(shows)
    const orders = artistOrders.get(artist.name) || []
    const avgOrder = orders.length > 0
      ? orders.reduce((sum, o) => sum + o, 0) / orders.length
      : Infinity
    return { ...artist, watch_count: watchCount, avg_score: avgScore, avg_order: avgOrder }
  })
}

// 获取演员详情
export async function getArtistByName(name: string): Promise<ArtistDetail> {
  const { data: artist, error: artistError } = await supabase
    .from('artist')
    .select('*')
    .eq('name', name)
    .single()

  if (artistError) throw artistError
  if (!artist) throw new Error('演员不存在')

  // 获取演员评价记录
  const { data: actorReviews, error: reviewError } = await supabase
    .from('actor_review')
    .select(`
      *,
      show:show(
        *,
        musical:musical(name, type)
      )
    `)
    .eq('artist_name', name)
    .order('created_at', { ascending: false })

  if (reviewError) throw reviewError

  // 计算统计信息（只统计主演）
  const leadReviews = actorReviews?.filter((r: any) => r.actor_type === '主演') || []
  const shows = leadReviews.map((r: any) => r.show).filter(Boolean)
  const watchCount = shows.length
  const avgScore = calcMultiShowAvg(shows)

  // 统计剧目参与次数
  const musicalStats = new Map<string, { musical_name: string; count: number }>()
  actorReviews?.forEach((review: any) => {
    const musicalName = review.show?.musical_name
    if (musicalName) {
      const existing = musicalStats.get(musicalName)
      if (existing) existing.count++
      else musicalStats.set(musicalName, { musical_name: musicalName, count: 1 })
    }
  })

  // 场次评价列表
  const showReviews = actorReviews?.map((review: any) => {
    const show = review.show
    const { show: _show, ...reviewWithoutShow } = review
    return {
      ...show,
      ...reviewWithoutShow,
      show_id: show?.id,
      musical_name: show?.musical_name || ''
    }
  }).sort((a: any, b: any) => new Date(b.show_time).getTime() - new Date(a.show_time).getTime()) || []

  return {
    ...artist,
    watch_count: watchCount,
    avg_score: avgScore,
    musical_stats: Array.from(musicalStats.values()).sort((a, b) => b.count - a.count),
    shows: showReviews
  }
}

// 创建演员
export async function createArtist(artist: Pick<Artist, 'name'>) {
  const user_id = await getUserId()
  const { data, error } = await supabase
    .from('artist')
    .insert({ ...artist, user_id })
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新演员
export async function updateArtist(name: string, artist: Partial<Pick<Artist, 'name'>>) {
  const { data, error } = await supabase
    .from('artist')
    .update(artist)
    .eq('name', name)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除演员
export async function deleteArtist(name: string) {
  const { data: reviews, error: checkError } = await supabase
    .from('actor_review')
    .select('id')
    .eq('artist_name', name)
    .limit(1)

  if (checkError) throw checkError
  if (reviews && reviews.length > 0) {
    throw new Error('该演员有关联的场次记录，无法删除')
  }

  const { error } = await supabase
    .from('artist')
    .delete()
    .eq('name', name)

  if (error) throw error
}

// 获取所有演员名称（用于下拉选择）
export async function getArtistNames(): Promise<{ name: string }[]> {
  const { data, error } = await supabase
    .from('artist')
    .select('name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}
