import * as cache from "@actions/cache"
import * as core from "@actions/core"
import * as glob from "@actions/glob"
import * as path from "path"
import * as tc from "@actions/tool-cache"
import { checkNecessaryFiles, getPoetryHome, saveCacheWithoutErrors } from "./utils"
import { exec } from "@actions/exec"

async function run() {
  try {
    const POETRY_HOME = await getPoetryHome()
    const POETRY_PATH = path.join(POETRY_HOME, "bin")
    const POETRY_VERSION = core.getInput("poetry-version")
    const VENV_PATH = ".venv"

    const installDependencies = core.getBooleanInput("install-dependencies")
    const cacheInstallation = core.getBooleanInput("cache-installation")
    const cacheDependencies = core.getBooleanInput("cache-dependencies")

    const { lockFile, projectFile } = checkNecessaryFiles()

    await core.group("Installing poetry", async () => {
      const poetryCacheKey = `setup-poetry-self-${POETRY_VERSION}`
      const poetryCachePaths = [path.join(POETRY_HOME, "*")]
      let poetryCachedRestoredKey: string | undefined
      if (cacheInstallation) {
        poetryCachedRestoredKey = await cache.restoreCache(poetryCachePaths, poetryCacheKey)
      }
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

    if (installDependencies) {
      await core.group("Installing dependencies", async () => {
        const depsHash = await glob.hashFiles(lockFile || projectFile)
        const depsCacheKey = `setup-poetry-deps-${POETRY_VERSION}-${depsHash}`
        const depsCachePaths = [path.join(VENV_PATH, "*")]
        let depsCachedRestoredKey: string | undefined
        if (cacheDependencies) {
          depsCachedRestoredKey = await cache.restoreCache(depsCachePaths, depsCacheKey, undefined)
        }
        if (depsCachedRestoredKey) {
          core.info("Using cached dependencies")
        } else {
          core.info("Installing dependencies...")
          await exec("poetry", ["install", "-n", "-q"])
          if (cacheDependencies) await saveCacheWithoutErrors(depsCachePaths, depsCacheKey)
        }
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
