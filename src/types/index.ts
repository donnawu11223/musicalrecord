// 剧目类型枚举
export type MusicalType = '中国音乐剧' | '非中音乐剧' | '话剧' | '舞剧'

// 剧目表
export interface Musical {
  id: string
  name: string
  poster: string
  type: MusicalType
  brand: string
  plot: string
  created_at: string
  updated_at: string
}

// 演员表
export interface Artist {
  id: string
  name: string
  avatar: string
  created_at: string
  updated_at: string
}

// 场次表
export interface Show {
  id: string
  show_time: string
  musical_id: string
  city: string
  theater: string
  seat: string
  ticket_price: number
  paid_amount: number
  other_expense: number
  plot_score: number
  visual_score: number
  acting_score: number
  script_score: number
  singing_score: number
  note: string
  created_at: string
  updated_at: string
}

// 演员评价表
export interface ActorReview {
  id: string
  show_id: string
  artist_id: string
  actor_order: number
  actor_type: '主演' | '群演'
  role: string
  review: string
  created_at: string
  updated_at: string
}

// 演员类型枚举
export type ActorType = '主演' | '群演'

// 剧目卡片数据（包含统计信息）
export interface MusicalCard extends Musical {
  watch_count: number
  avg_score: number
}

// 场次卡片数据
export interface ShowCard extends Show {
  musical_name: string
  musical_poster: string
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
  total_ticket_price: number
  total_paid_amount: number
  total_other_expense: number
  artist_stats: { artist_id: string; artist_name: string; artist_avatar: string; count: number }[]
  shows: (Show & { avg_score: number })[]
}

// 演员详情数据
export interface ArtistDetail extends Artist {
  watch_count: number
  avg_score: number
  total_ticket_price: number
  total_paid_amount: number
  total_other_expense: number
  musical_stats: { musical_id: string; musical_name: string; count: number }[]
  shows: (Show & ActorReview & { musical_name: string; show_id: string })[]
}

// 年份选项
export interface YearOption {
  label: string
  value: string | number
}
