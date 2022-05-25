import { test, expect } from "@jest/globals"
import { checkNecessaryFiles } from "../src/install-dependencies"

test("Check if files exists in this repository", () => {
  const { projectFile, lockFile } = checkNecessaryFiles()
  expect(typeof lockFile === "string").toBe(true)
  expect(typeof projectFile === "string").toBe(true)
})
