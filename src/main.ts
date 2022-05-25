import * as core from "@actions/core"

import { install_dependencies } from "./install-dependencies"
import { install_poetry } from "./poetry"

async function run() {
  try {
    await install_poetry()
    await install_dependencies()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
