import { supabase } from '../lib/supabase'
import type { Artist, ArtistDetail } from '../types'
import { calcMultiShowAvg } from '../lib/score'

// 获取演员列表（带统计信息）
export async function getArtists(): Promise<(Artist & { watch_count: number; avg_score: number })[]> {
  const { data, error } = await supabase
    .from('artist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // 获取所有场次和演员评价
  const { data: actorReviews, error: reviewError } = await supabase
    .from('actor_review')
    .select(`
      artist_id,
      show:show(
        plot_score,
        visual_score,
        acting_score,
        script_score,
        singing_score
      )
    `)

  if (reviewError) throw reviewError

  // 按演员ID分组场次
  const artistShows = new Map<string, any[]>()
  actorReviews?.forEach((review: any) => {
    const artistId = review.artist_id
    const show = review.show
    if (show) {
      const existing = artistShows.get(artistId)
      if (existing) {
        existing.push(show)
      } else {
        artistShows.set(artistId, [show])
      }
    }
  })

  return (data || []).map(artist => {
    const shows = artistShows.get(artist.id) || []
    const watchCount = shows.length
    const avgScore = calcMultiShowAvg(shows)
    return {
      ...artist,
      watch_count: watchCount,
      avg_score: avgScore
    }
  })
}

// 获取演员详情
export async function getArtistById(id: string): Promise<ArtistDetail> {
  // 获取演员基本信息
  const { data: artist, error: artistError } = await supabase
    .from('artist')
    .select('*')
    .eq('id', id)
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
        musical:musical(id, name)
      )
    `)
    .eq('artist_id', id)
    .order('created_at', { ascending: false })

  if (reviewError) throw reviewError

  // 计算统计信息
  const shows = actorReviews?.map((r: any) => r.show).filter(Boolean) || []
  const watchCount = shows.length
  const avgScore = calcMultiShowAvg(shows)

  // 统计剧目参与次数
  const musicalStats = new Map<string, { musical_id: string; musical_name: string; count: number }>()
  actorReviews?.forEach((review: any) => {
    const musical = review.show?.musical
    if (musical) {
      const existing = musicalStats.get(musical.id)
      if (existing) {
        existing.count++
      } else {
        musicalStats.set(musical.id, {
          musical_id: musical.id,
          musical_name: musical.name,
          count: 1
        })
      }
    }
  })

  // 场次评价列表
  const showReviews = actorReviews?.map((review: any) => {
    const show = review.show
    const musical = show?.musical
    const { show: _show, ...reviewWithoutShow } = review
    return {
      ...show,
      ...reviewWithoutShow,
      show_id: show?.id,
      musical_name: musical?.name || ''
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
export async function createArtist(artist: Omit<Artist, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('artist')
    .insert(artist)
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新演员
export async function updateArtist(id: string, artist: Partial<Omit<Artist, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('artist')
    .update(artist)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除演员（需先检查是否有关联场次）
export async function deleteArtist(id: string) {
  // 检查是否有关联场次
  const { data: reviews, error: checkError } = await supabase
    .from('actor_review')
    .select('id')
    .eq('artist_id', id)
    .limit(1)

  if (checkError) throw checkError

  if (reviews && reviews.length > 0) {
    throw new Error('该演员有关联的场次记录，无法删除')
  }

  const { error } = await supabase
    .from('artist')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 获取所有演员名称（用于下拉选择）
export async function getArtistNames(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('artist')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}
