interface HasScores {
  plot_score?: number | null
  visual_score?: number | null
  acting_score?: number | null
  script_score?: number | null
  singing_score?: number | null
}

// 单一场次：5维度均分，null按0计算
export function calcShowAvg(show: HasScores): number {
  const scores = [show.plot_score ?? 0, show.visual_score ?? 0, show.acting_score ?? 0, show.script_score ?? 0, show.singing_score ?? 0]
  return scores.reduce((sum, s) => sum + s, 0) / 5
}

// 场次是否有至少一个有效评分
export function hasAnyScore(show: HasScores): boolean {
  return show.plot_score != null || show.visual_score != null || show.acting_score != null || show.script_score != null || show.singing_score != null
}

// 多场次均分：场次均分的平均，5维度全为null的场次不计入。返回 *2 保留1位小数
export function calcMultiShowAvg(shows: HasScores[]): number {
  const scoredShows = shows.filter(hasAnyScore)
  if (scoredShows.length === 0) return 0
  const totalAvg = scoredShows.reduce((sum, s) => sum + calcShowAvg(s), 0)
  return Math.round((totalAvg / scoredShows.length) * 2 * 10) / 10
}
