interface CacheValue<T> {
  value: T
  expiresAt: number
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheValue<T>>()

  constructor(private readonly ttlMs: number) {}

  get(key: string) {
    const hit = this.cache.get(key)

    if (!hit) {
      return null
    }

    if (Date.now() >= hit.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return hit.value
  }

  getStale(key: string) {
    return this.cache.get(key)?.value ?? null
  }

  set(key: string, value: T) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    })
  }
}
