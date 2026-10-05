# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- A passthrough flag placed before the mode no longer swallows it: `wake --save storefront` now runs storefront mode instead of `all`.
- In `wake` (all) mode, `Assets/CSS/` is validated before `fbits.storefront` starts, so a CSS error no longer leaves the storefront running.

### Changed

- `wake-storefront` / `wake-tailwind` aliases now pass the mode as an argument instead of the `WAKE_MODE` environment variable. A `WAKE_MODE` set in the user's shell no longer overrides the mode.

## [1.0.2] - 2026-03-06

### Added

- `--help` / `-h` flag: prints all commands, flags, and usage examples to the terminal and exits.
- Generic flag passthrough: any flag not consumed by `wake-runner` itself is forwarded to the underlying CLI. In specific modes (`wake storefront`, `wake tailwind`) flags go to the respective tool. In `wake` (all) mode, extra flags are forwarded to `fbits.storefront` only to avoid passing incompatible flags to `tailwindcss`.
- `--no-minify` flag for `wake tailwind`, `wake-tailwind`, and `wake` commands. CSS output is minified by default; pass `--no-minify` to disable.

### Fixed

- In `wake` (all) mode, passthrough args were incorrectly forwarded to both `fbits.storefront` and `tailwindcss`. Extra flags are now sent only to `fbits.storefront`.

### Changed

- All CLI output messages and error messages translated to English for consistency with documentation.

## [1.0.1] - 2026-03-05

### Added

- Repository, homepage, and bugs URLs in `package.json` for correct linking on the npm package page.

### Changed

- Tailwind CSS version requirement documented as **3.4.18**, aligned with the [Wake template padrão](https://wakecommerce.readme.io/docs/template-padrao#tailwindcss).
- Both standalone CLI and npm installation options for Tailwind are now documented.
- `bin` paths in `package.json` normalized (removed leading `./`).

## [1.0.0] - 2026-03-05

### Added

- Initial release of **wake-runner**.
- `wake` command: starts `fbits.storefront` (using token from `Configs/settings.json`) and all Tailwind CSS watchers in parallel.
- `wake storefront` / `wake-storefront`: starts only `fbits.storefront`.
- `wake tailwind` / `wake-tailwind`: starts one Tailwind `--watch` process per `input*.css` file found in `Assets/CSS/`, mapping `input` → `output` in the output filename.
- Auto-detection of Tailwind: uses local npm installation (`node_modules/.bin/tailwindcss`) when available, falls back to global `tailwindcss` in PATH.
- Fix for alternate entry points (`wake-storefront.js`, `wake-tailwind.js`) not executing the CLI when required from `wake.js`.

[Unreleased]: https://github.com/SimksS/wake-runner/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/SimksS/wake-runner/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/SimksS/wake-runner/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/SimksS/wake-runner/releases/tag/v1.0.0
