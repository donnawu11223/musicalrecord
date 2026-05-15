import { useState, useEffect, useCallback } from 'react'

interface CacheData<T> {
  data: T
  timestamp: number
}

const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 // 24小时过期

export function useCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): {
  data: T | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  isFromCache: boolean
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed: CacheData<T> = JSON.parse(cached)
        const now = Date.now()
        if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
          return parsed.data
        }
      }
      return null
    } catch {
      return null
    }
  }, [cacheKey])

  const saveToCache = useCallback((newData: T) => {
    try {
      const cacheData: CacheData<T> = {
        data: newData,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (e) {
      console.warn('缓存保存失败:', e)
    }
  }, [cacheKey])

  const fetchData = useCallback(async (useCache: boolean = true) => {
    setLoading(true)
    setError(null)

    if (useCache) {
      const cachedData = loadFromCache()
      if (cachedData) {
        setData(cachedData)
        setIsFromCache(true)
        setLoading(false)
        return
      }
    }

    try {
      const result = await fetchFn()
      setData(result)
      setIsFromCache(false)
      saveToCache(result)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('加载失败'))

      const cachedData = loadFromCache()
      if (cachedData) {
        setData(cachedData)
        setIsFromCache(true)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFn, loadFromCache, saveToCache])

  const refresh = useCallback(async () => {
    await fetchData(false)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refresh, isFromCache }
}

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
