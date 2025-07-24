# ADR-005: Build Tool Selection - Bun vs npm/yarn

## Status
Accepted

## Context
The Aster Management frontend requires a package manager and build tool that provides:
- Fast dependency installation
- Reliable dependency resolution
- Good monorepo support (potential future need)
- TypeScript execution support
- Compatibility with the Nuxt/Vue ecosystem
- Good CI/CD integration
- Active maintenance and community support

Currently, the main options are npm (default), Yarn Classic, Yarn Berry, pnpm, and Bun.

## Decision
We will use Bun as the primary package manager and runtime for the Aster Management frontend.

Key implementation details:
- Bun v1.2.16 or later
- Use `bun install` for dependencies
- Use `bun run` for scripts
- Maintain npm compatibility for CI/CD fallback
- Use `bun.lock` for dependency locking

## Consequences

### Positive
- 30x faster package installation compared to npm
- Native TypeScript execution without transpilation
- Built-in test runner (can replace Vitest if needed)
- Excellent Nuxt 3 compatibility
- Reduced CI/CD build times
- Single binary, easy to install
- Drop-in npm replacement
- Built-in bundler for future needs
- Active development with rapid improvements

### Negative
- Newer tool with potential edge cases
- Smaller ecosystem compared to npm/yarn
- Some npm packages might have compatibility issues
- Team needs to install Bun locally
- Less mature than traditional tools

### Neutral
- Learning curve is minimal (npm-compatible commands)
- Lock file format is different but automatic
- Can always fall back to npm if needed

## Alternatives Considered

### Alternative 1: npm (Node.js default)
- **Pros**: Universal standard, no additional installation, mature
- **Cons**: Slowest performance, basic feature set
- **Reason for rejection**: Bun offers significant performance improvements

### Alternative 2: Yarn Classic (v1)
- **Pros**: Faster than npm, proven track record, good features
- **Cons**: Maintenance mode, being replaced by Yarn Berry
- **Reason for rejection**: Not actively developed

### Alternative 3: Yarn Berry (v2+)
- **Pros**: PnP support, good monorepo features, plugins
- **Cons**: Complex configuration, breaking changes, compatibility issues
- **Reason for rejection**: Too complex for our needs

### Alternative 4: pnpm
- **Pros**: Efficient disk usage, strict dependencies, fast
- **Cons**: Different node_modules structure can cause issues
- **Reason for rejection**: Bun is faster and simpler

## Implementation Notes

### Migration Steps
1. Install Bun on all developer machines
2. Run `bun install` to generate `bun.lock`
3. Update package.json scripts if needed
4. Update CI/CD pipelines to use Bun
5. Document Bun-specific features and commands

### Package.json Configuration
```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "packageManager": "bun@1.2.16"
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- uses: oven-sh/setup-bun@v1
  with:
    bun-version: 1.2.16
- run: bun install --frozen-lockfile
- run: bun run build
```

### Performance Benchmarks
- npm install: ~45 seconds
- yarn install: ~30 seconds
- pnpm install: ~20 seconds
- bun install: ~2 seconds

## References
- [Bun Documentation](https://bun.sh/)
- [Bun vs npm Performance](https://bun.sh/blog/bun-v1.0#speed)
- [Nuxt 3 with Bun Guide](https://nuxt.com/docs/getting-started/installation#bun)
- Internal performance testing results

## History
- **2025-01-02**: Initial draft created
- **2025-01-02**: Decision accepted based on performance benefits