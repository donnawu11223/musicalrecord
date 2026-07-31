import { supabase, getUserId } from '../lib/supabase'
import type { Musical, MusicalCard, MusicalType } from '../types'
import { hasAnyScore, calcShowAvg, calcMultiShowAvg } from '../lib/score'

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
    .select('musical_name, plot_score, visual_score, acting_score, script_score, singing_score')

  if (showsError) throw showsError

  // 按剧目名称分组统计
  const showStats = new Map<string, { count: number; totalScore: number }>()
  shows?.forEach(show => {
    if (!hasAnyScore(show)) return
    const existing = showStats.get(show.musical_name)
    const avg = calcShowAvg(show)
    if (existing) {
      existing.count++
      existing.totalScore += avg
    } else {
      showStats.set(show.musical_name, { count: 1, totalScore: avg })
    }
  })

  return (musicals || []).map(musical => {
    const stats = showStats.get(musical.name)
    const watchCount = stats?.count || 0
    const avgScore = watchCount > 0
      ? Math.round((stats!.totalScore / watchCount) * 2 * 10) / 10
      : 0
    return { ...musical, watch_count: watchCount, avg_score: avgScore }
  })
}

// 获取剧目详情
export async function getMusicalByName(name: string) {
  const { data: musical, error: musicalError } = await supabase
    .from('musical')
    .select('*')
    .eq('name', name)
    .single()

  if (musicalError) throw musicalError
  if (!musical) throw new Error('剧目不存在')

  // 获取关联的场次信息
  const { data: shows, error: showsError } = await supabase
    .from('show')
    .select('*')
    .eq('musical_name', name)
    .order('show_time', { ascending: false })

  if (showsError) throw showsError

  const watchCount = shows?.length || 0
  const avgScore = calcMultiShowAvg(shows || [])

  // 获取演员统计
  const { data: actorReviews, error: actorError } = await supabase
    .from('actor_review')
    .select('artist_name')
    .in('show_id', shows?.map(s => s.id) || [])

  if (actorError) throw actorError

  const artistStats = new Map<string, { artist_name: string; count: number }>()
  actorReviews?.forEach((review: any) => {
    const existing = artistStats.get(review.artist_name)
    if (existing) {
      existing.count++
    } else {
      artistStats.set(review.artist_name, { artist_name: review.artist_name, count: 1 })
    }
  })

  const showsWithScore = shows?.map(s => ({
    ...s,
    avg_score: hasAnyScore(s) ? Math.round(calcShowAvg(s) * 2 * 10) / 10 : 0
  })) || []

  return {
    ...musical,
    watch_count: watchCount,
    avg_score: avgScore,
    artist_stats: Array.from(artistStats.values()).sort((a, b) => b.count - a.count),
    shows: showsWithScore
  }
}

// 创建剧目
export async function createMusical(musical: Pick<Musical, 'name' | 'type' | 'brand' | 'plot'>) {
  const user_id = await getUserId()
  const { data, error } = await supabase
    .from('musical')
    .insert({ ...musical, user_id })
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新剧目
export async function updateMusical(name: string, musical: Partial<Pick<Musical, 'name' | 'type' | 'brand' | 'plot'>>) {
  const { data, error } = await supabase
    .from('musical')
    .update(musical)
    .eq('name', name)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除剧目
export async function deleteMusical(name: string) {
  // 检查是否有关联场次
  const { data: shows, error: checkError } = await supabase
    .from('show')
    .select('id')
    .eq('musical_name', name)
    .limit(1)

  if (checkError) throw checkError
  if (shows && shows.length > 0) {
    throw new Error('该剧目有关联的场次记录，无法删除')
  }

  const { error } = await supabase
    .from('musical')
    .delete()
    .eq('name', name)

  if (error) throw error
}

// 获取所有剧目名称（用于下拉选择）
export async function getMusicalNames(): Promise<{ name: string; type: MusicalType }[]> {
  const { data, error } = await supabase
    .from('musical')
    .select('name, type')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}
