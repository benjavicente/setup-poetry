import * as cache from "@actions/cache"
import * as core from "@actions/core"
import * as glob from "@actions/glob"
import * as path from "path"

import { exec } from "@actions/exec"
import { existsSync } from "fs"
import { saveCacheWithoutErrors } from "./utils"

export async function install_dependencies() {
  const installDependencies = core.getBooleanInput("install-dependencies")

  if (!installDependencies) {
    return
  }

  const POETRY_VERSION = core.getInput("poetry-version")
  const VENV_PATH = ".venv"

  const cacheDependencies = core.getBooleanInput("cache-dependencies")

  const { lockFile, projectFile } = checkNecessaryFiles()

  await core.group("Installing dependencies", async () => {
    const depsHash = await glob.hashFiles(lockFile || projectFile)
    const depsCacheKey = `setup-poetry-deps-${POETRY_VERSION}-${depsHash}`
    const depsCachePaths = [path.join(VENV_PATH, "*")]
    let depsCachedRestoredKey: string | undefined

    if (cacheDependencies) {
      depsCachedRestoredKey = await cache.restoreCache(depsCachePaths, depsCacheKey)
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
