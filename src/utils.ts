import * as cache from "@actions/cache"
import * as core from "@actions/core"
import * as io from "@actions/io"
import * as path from "path"
import { existsSync } from "fs"
import { platform } from "process"

function getUserDataDir() {
  if (platform === "win32" && process.env.APPDATA !== undefined) return process.env.APPDATA
  if (platform === "darwin") return `${process.env.HOME}/Library/Application Support`
  return `${process.env.HOME}/.local/share`
}

export async function getPoetryHome() {
  const home = getUserDataDir()
  await io.mkdirP(home)
  return path.join(home, "pypoetry")
}

export function checkNecessaryFiles() {
  const projectFile = "pyproject.toml"
  let lockFile: string | undefined = "poetry.lock"
  if (!existsSync(projectFile)) {
    throw new Error(`Poetry needs the ${projectFile} file in the repository`)
  }
  if (!existsSync(lockFile)) {
    lockFile = undefined
    core.warning(`You should use ${lockFile} to improve install speeds`)
  }
  return { projectFile, lockFile }
}

export async function saveCacheWithoutErrors(paths: string[], key: string) {
  try {
    await cache.saveCache(paths, key)
  } catch (error) {
    if (error instanceof Error) core.info(error.message)
  }
}
