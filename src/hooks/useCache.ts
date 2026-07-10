interface CacheData<T> {
  data: T
  timestamp: number
}

const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 // 24小时过期

// 简单的缓存读写工具
export const cache = {
  get<T>(key: string, ignoreExpiry: boolean = false): T | null {
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed: CacheData<T> = JSON.parse(cached)
        if (ignoreExpiry || Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          return parsed.data
        }
      }
    } catch {}
    return null
  },

  set<T>(key: string, data: T): void {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(cacheData))
    } catch {}
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  }
}
