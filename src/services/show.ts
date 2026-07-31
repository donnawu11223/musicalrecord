import { supabase, getUserId } from '../lib/supabase'
import type { Show, ShowCard, ShowDetail, MusicalType, ActorType } from '../types'

// 获取场次列表（带剧目信息）
export async function getShows(filters?: { year?: string; type?: MusicalType }): Promise<ShowCard[]> {
  let query = supabase
    .from('show')
    .select(`
      *,
      musical:musical(name, type)
    `)
    .order('show_time', { ascending: false })

  if (filters?.year) {
    const startDate = `${filters.year}-01-01`
    const endDate = `${filters.year}-12-31`
    query = query.gte('show_time', startDate).lte('show_time', endDate)
  }

  if (filters?.type) {
    const { data: musicalNames, error: musicalError } = await supabase
      .from('musical')
      .select('name')
      .eq('type', filters.type)

    if (musicalError) throw musicalError
    if (musicalNames && musicalNames.length > 0) {
      query = query.in('musical_name', musicalNames.map(m => m.name))
    } else {
      return []
    }
  }

  const { data, error } = await query
  if (error) throw error

  return (data || []).map(show => ({
    ...show,
    musical_type: (show.musical as any)?.type || ''
  }))
}

// 获取场次详情
export async function getShowById(id: string): Promise<ShowDetail> {
  const { data: show, error: showError } = await supabase
    .from('show')
    .select(`
      *,
      musical:musical(*)
    `)
    .eq('id', id)
    .single()

  if (showError) throw showError
  if (!show) throw new Error('场次不存在')

  // 获取演员评价
  const { data: actorReviews, error: reviewError } = await supabase
    .from('actor_review')
    .select(`
      *,
      artist:artist(*)
    `)
    .eq('show_id', id)
    .order('actor_order', { ascending: true })

  if (reviewError) throw reviewError

  return {
    ...show,
    musical: show.musical as any,
    actor_reviews: (actorReviews || []).map(review => ({
      ...review,
      artist: review.artist as any
    }))
  }
}

// 创建场次
export async function createShow(show: Omit<Show, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const user_id = await getUserId()
  const { data, error } = await supabase
    .from('show')
    .insert({ ...show, user_id })
    .select()
    .single()

  if (error) throw error
  return data
}

// 更新场次
export async function updateShow(id: string, show: Partial<Omit<Show, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('show')
    .update(show)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 删除场次（同时删除关联的演员评价 via CASCADE）
export async function deleteShow(id: string) {
  const { error } = await supabase
    .from('show')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 批量保存演员评价
export async function saveActorReviews(showId: string, reviews: { artist_name: string; actor_type: ActorType; role: string; review: string }[]) {
  // 先删除该场次的所有演员评价
  await supabase
    .from('actor_review')
    .delete()
    .eq('show_id', showId)

  // 再创建新的演员评价
  if (reviews.length > 0) {
    const user_id = await getUserId()
    const reviewsToInsert = reviews.map((review, index) => ({
      show_id: showId,
      artist_name: review.artist_name,
      actor_order: index + 1,
      actor_type: review.actor_type,
      role: review.role,
      review: review.review,
      user_id
    }))

    const { error } = await supabase
      .from('actor_review')
      .insert(reviewsToInsert)

    if (error) throw error
  }
}

// 获取场次年份列表
export async function getShowYears(): Promise<string[]> {
  const { data, error } = await supabase
    .from('show')
    .select('show_time')

  if (error) throw error

  const years = new Set<string>()
  data?.forEach(show => {
    const year = new Date(show.show_time).getFullYear().toString()
    years.add(year)
  })

  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
}
