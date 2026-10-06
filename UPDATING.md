# UPDATING

How to keep this package's upstream version current.

## What "upstream" means here

The service is the unmodified upstream container image `ghcr.io/juanfont/headscale`, published by the headscale project for every tagged release. The package never builds the application.

## Where the pin lives

`startos/manifest/index.ts` → `images.headscale.source.dockerTag`.

## How to bump

1. Check the newest release: <https://github.com/juanfont/headscale/releases> (tags are `vX.Y.Z`). Or list published tags: `docker manifest inspect ghcr.io/juanfont/headscale:<tag>`.
2. Edit `dockerTag` to the new `vX.Y.Z` — the tag must exist in GHCR before you pack (never guess a tag; both `x86_64` and `aarch64` must be present).
3. Read the release's `CHANGELOG.md` section for config-breaking and CLI-breaking changes:
   - **Config**: `startos/utils.ts` `renderHeadscaleConfig()` must keep producing a valid config for the new version. A fatal config validation change (e.g. MagicDNS/base-domain coupling, DERP map requirements) will show up at first start.
   - **CLI**: actions shell out to `users list|create`, `preauthkeys create`, `nodes list|expire|delete` with `-o json`. Renamed commands/flags or new JSON shapes break those execs.
4. Bump `startos/versions/current.ts` (`version: '<new>:0'`, release notes per locale). Keep the package version's major.minor aligned with the upstream version.
5. `make x86 && make arm` — image fetch happens at pack time; watch for `dockerTag` errors.
6. On a StartOS box: install the update, confirm the daemon becomes ready and that an existing tailnet's devices reconnect (the SQLite data must migrate cleanly; headscale runs its own DB migrations at start).

## Watch for

- headscale declares a **minimum Tailscale client version** per release in its CHANGELOG — quote it in the package release notes when it changes.
- The upstream image moved its entrypoint path (`/ko-app/headscale`) only at major rebuilds; `startos/utils.ts` `headscaleBin` is the single place that constant lives.
