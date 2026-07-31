// 剧目类型枚举
export type MusicalType = '中国音乐剧' | '非中音乐剧' | '话剧' | '舞剧'

// 演员类型枚举
export type ActorType = '主演' | '群演'

// 剧目表（主键为 name）
export interface Musical {
  name: string
  type: MusicalType
  brand: string
  plot: string
  user_id: string
  created_at: string
  updated_at: string
}

// 演员表（主键为 name）
export interface Artist {
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

// 场次表
export interface Show {
  id: string
  show_time: string
  musical_name: string
  city: string
  theater: string
  seat: string
  plot_score?: number | null
  visual_score?: number | null
  acting_score?: number | null
  script_score?: number | null
  singing_score?: number | null
  note: string
  user_id: string
  created_at: string
  updated_at: string
}

// 演员评价表
export interface ActorReview {
  id: string
  show_id: string
  artist_name: string
  actor_order: number
  actor_type: ActorType
  role: string
  review: string
  user_id: string
  created_at: string
  updated_at: string
}

// 剧目卡片数据（包含统计信息）
export interface MusicalCard extends Musical {
  watch_count: number
  avg_score: number
}

// 场次卡片数据
export interface ShowCard extends Show {
  musical_type: MusicalType
}

// 场次详情数据
export interface ShowDetail extends Show {
  musical: Musical
  actor_reviews: (ActorReview & { artist: Artist })[]
}

// 剧目详情数据
export interface MusicalDetail extends Musical {
  watch_count: number
  avg_score: number
  artist_stats: { artist_name: string; count: number }[]
  shows: (Show & { avg_score: number })[]
}

// 演员详情数据
export interface ArtistDetail extends Artist {
  watch_count: number
  avg_score: number
  musical_stats: { musical_name: string; count: number }[]
  shows: (Show & ActorReview & { musical_name: string; show_id: string })[]
}
