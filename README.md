# setup-poetry

A simple and opinionated action that simplifies setting up Poetry,
installing dependencies and using cache so you don't have to ⚡

> Note: this repository was generated from [actions/typescript-action](https://github.com/actions/typescript-action)

## Usage

```yaml
name: example
on: push

jobs:
  lint-code:
    runs-on: ubuntu-latest
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        # Remember to use a python version that matches
        # the specified version in pyproject.toml
        with: { python-version: 3.9 }

      - uses: benjavicente/setup-poetry
        with: # default arguments
          poetry-version: 1.1.11
          cache-installation: true
          cache-dependencies: true
          install-dependencies: true

      - run: poetry run black src/
```
