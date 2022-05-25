import * as cache from "@actions/cache"
import * as core from "@actions/core"
import * as io from "@actions/io"
import * as path from "path"
import * as tc from "@actions/tool-cache"

import { exec } from "@actions/exec"
import { platform } from "process"
import { saveCacheWithoutErrors } from "./utils"

export async function install_poetry() {
  const cacheInstallation = core.getBooleanInput("cache-installation")
  const POETRY_HOME = await getPoetryHome()
  const POETRY_VERSION = core.getInput("poetry-version")

  const POETRY_PATH = path.join(POETRY_HOME, "bin")

  await core.group("Installing poetry", async () => {
    const poetryCacheKey = `setup-poetry-self-${POETRY_VERSION}`
    const poetryCachePaths = [path.join(POETRY_HOME, "*")]

    const poetryCachedRestoredKey = await restoreFromCache(
      cacheInstallation,
      poetryCachePaths,
      poetryCacheKey
    )

    if (poetryCachedRestoredKey) {
      core.info("Using cached poetry installation")
    } else {
      core.info("Downloading Poetry...")
      const installPoetryPath: string = await tc.downloadTool("https://install.python-poetry.org")
      const execOptions = { env: { ...process.env, POETRY_HOME, POETRY_VERSION }, silent: true }
      await exec("python", [installPoetryPath, "-y"], execOptions)
      if (cacheInstallation) await saveCacheWithoutErrors(poetryCachePaths, poetryCacheKey)
    }
    core.addPath(POETRY_PATH)

    const poetryWasInstalled = await exec("poetry", ["--version"], { silent: true })
    if (poetryWasInstalled !== 0) throw new Error("Cound't install poetry")

    await exec("poetry", ["config", "virtualenvs.in-project", "true"], { silent: true })
  })
}

async function restoreFromCache(
  cacheInstallation: boolean,
  poetryCachePaths: string[],
  poetryCacheKey: string
) {
  if (!cacheInstallation) {
    return undefined
  }

  return cache.restoreCache(poetryCachePaths, poetryCacheKey)
}

async function getPoetryHome() {
  const home = getUserDataDir()
  await io.mkdirP(home)
  return path.join(home, "pypoetry")
}

function getUserDataDir() {
  if (platform === "win32" && process.env.APPDATA !== undefined) return process.env.APPDATA
  if (platform === "darwin") return `${process.env.HOME}/Library/Application Support`
  return `${process.env.HOME}/.local/share`
}
