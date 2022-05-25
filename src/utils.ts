import * as cache from "@actions/cache"
import * as core from "@actions/core"

export async function saveCacheWithoutErrors(paths: string[], key: string) {
  try {
    await cache.saveCache(paths, key)
  } catch (error) {
    if (error instanceof Error) core.info(error.message)
  }
}
