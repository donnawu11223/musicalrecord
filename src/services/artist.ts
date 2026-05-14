import { supabase } from '../lib/supabase'
import type { Artist, ArtistDetail } from '../types'

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

  // 统计每个演员的数据
  const artistStats = new Map<string, { watch_count: number; total_score: number }>()
  actorReviews?.forEach((review: any) => {
    const artistId = review.artist_id
    const show = review.show
    if (show) {
      const scores = [show.plot_score, show.visual_score, show.acting_score, show.script_score, show.singing_score]
      const avg = scores.reduce((a: number, b: number) => a + b, 0) / 5

      const existing = artistStats.get(artistId)
      if (existing) {
        existing.watch_count++
        existing.total_score += avg
      } else {
        artistStats.set(artistId, { watch_count: 1, total_score: avg })
      }
    }
  })

  return (data || []).map(artist => {
    const stats = artistStats.get(artist.id) || { watch_count: 0, total_score: 0 }
    // 均分 * 2 保留1位小数
    return {
      ...artist,
      watch_count: stats.watch_count,
      avg_score: stats.watch_count > 0 ? Math.round((stats.total_score / stats.watch_count) * 2 * 10) / 10 : 0
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
  // 均分 * 2 保留1位小数
  const avgScore = watchCount > 0
    ? Math.round((shows.reduce((sum: number, s: any) => {
        const avg = (s.plot_score + s.visual_score + s.acting_score + s.script_score + s.singing_score) / 5
        return sum + avg
      }, 0) / watchCount) * 2 * 10) / 10
    : 0

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
    return {
      ...show,
      show_id: show?.id,
      ...review,
      musical_name: musical?.name || ''
    }
  }) || []

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
