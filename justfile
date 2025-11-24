# 根据操作系统自动设置 shell
set windows-shell := ["pwsh", "-c"]
set shell := ["bash", "-c"]

# Default task: show help
default:
    @just --list

init:
    npm install -g pnpm
    npm install -g @j178/prek
    pnpm install

# Development shortcuts

# pnpm dev
dev:
    pnpm dev

# pnpm lint
lint:
    pnpm lint

# pnpm vitest run
test:
    pnpm vitest run

# pnpm build
build:
    pnpm build

# lint + test + build
check:
    pnpm lint --fix && pnpm vitest run && pnpm build

happy: check
    prek run -a

# Release-only: bump version, create commit and tag via pnpm version
# Usage:
#   just release-only                # default: patch
#   just release-only bump=minor
#   just release-only bump=major
release-only bump="patch":
    pnpm run release:{{bump}}
