import { supabase } from '../lib/supabase'
import type { Musical, MusicalCard, MusicalType } from '../types'

// 获取剧目列表（带统计信息）
export async function getMusicals(type?: MusicalType): Promise<MusicalCard[]> {
  let query = supabase
    .from('musical')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data: musicals, error: musicalError } = await query

  if (musicalError) throw musicalError

  // 获取所有场次数据
  const { data: shows, error: showsError } = await supabase
    .from('show')
    .select('musical_id, plot_score, visual_score, acting_score, script_score, singing_score')

  if (showsError) throw showsError

  // 按剧目ID分组统计
  const showStats = new Map<string, { count: number; totalScore: number }>()
  shows?.forEach(show => {
    const existing = showStats.get(show.musical_id)
    const avg = (show.plot_score + show.visual_score + show.acting_score + show.script_score + show.singing_score) / 5
    if (existing) {
      existing.count++
      existing.totalScore += avg
    } else {
      showStats.set(show.musical_id, { count: 1, totalScore: avg })
    }
  })

  // 组装结果
  return (musicals || []).map(musical => {
    const stats = showStats.get(musical.id)
    const watchCount = stats?.count || 0
    // 均分 * 2 保留1位小数
    const avgScore = watchCount > 0
      ? Math.round((stats!.totalScore / watchCount) * 2 * 10) / 10
      : 0

    return {
      ...musical,
      watch_count: watchCount,
      avg_score: avgScore
    }
  })
}

// 获取剧目详情
export async function getMusicalById(id: string) {
  // 获取剧目基本信息
  const { data: musical, error: musicalError } = await supabase
    .from('musical')
    .select('*')
    .eq('id', id)
    .single()

  if (musicalError) throw musicalError
  if (!musical) throw new Error('剧目不存在')

  // 获取关联的场次信息
  const { data: shows, error: showsError } = await supabase
    .from('show')
    .select('*')
    .eq('musical_id', id)
    .order('show_time', { ascending: false })

  if (showsError) throw showsError

  // 计算统计信息
  const watchCount = shows?.length || 0
  const avgScore = watchCount > 0
    ? Math.round((shows!.reduce((sum, s) => {
        const avg = (s.plot_score + s.visual_score + s.acting_score + s.script_score + s.singing_score) / 5
        return sum + avg
      }, 0) / watchCount) * 2 * 10) / 10
    : 0

  // 获取演员统计
  const { data: actorReviews, error: actorError } = await supabase
    .from('actor_review')
    .select(`
      artist_id,
      artist:artist(id, name)
    `)
    .in('show_id', shows?.map(s => s.id) || [])

  if (actorError) throw actorError

  // 统计演员参演次数
  const artistStats = new Map<string, { artist_id: string; artist_name: string; count: number }>()
  actorReviews?.forEach((review: any) => {
    const artist = review.artist
    if (artist) {
      const existing = artistStats.get(artist.id)
      if (existing) {
        existing.count++
      } else {
        artistStats.set(artist.id, {
          artist_id: artist.id,
          artist_name: artist.name,
          count: 1
        })
      }
    }
  })

  // 场次带评分（均分*2保留1位小数）
  const showsWithScore = shows?.map(s => ({
    ...s,
    avg_score: Math.round(((s.plot_score + s.visual_score + s.acting_score + s.script_score + s.singing_score) / 5) * 2 * 10) / 10
  })) || []

  return {
    ...musical,
    watch_count: watchCount,
    avg_score: Math.round(avgScore * 10) / 10,
    artist_stats: Array.from(artistStats.values()).sort((a, b) => b.count - a.count),
    shows: showsWithScore
  }
}

// 创建剧目
export async function createMusical(musical: Omit<Musical, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('musical')
    .insert(musical)
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新剧目
export async function updateMusical(id: string, musical: Partial<Omit<Musical, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('musical')
    .update(musical)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除剧目（需先检查是否有关联场次）
export async function deleteMusical(id: string) {
  // 检查是否有关联场次
  const { data: shows, error: checkError } = await supabase
    .from('show')
    .select('id')
    .eq('musical_id', id)
    .limit(1)

  if (checkError) throw checkError

  if (shows && shows.length > 0) {
    throw new Error('该剧目有关联的场次记录，无法删除')
  }

  const { error } = await supabase
    .from('musical')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 获取所有剧目名称（用于下拉选择）
export async function getMusicalNames(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('musical')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}
