# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Fix a defect you spot rather than reporting it** — you have the package open and the
context to be sure. File **a GitHub issue on this repo** only when the call isn't yours to
make: you can't pin the cause down, two defensible fixes exist, or it's too large to ride on
the work in hand. An open issue is a report, not a queue — implement one when you're asked
to or when it's labelled `Approved`, then close it with `Closes #<n>`.

Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **The upstream image is a scratch/ko build with no shell.** Every exec runs `/ko-app/headscale` directly (`headscaleBin` / `cliCommand` in `startos/utils.ts` — the only places that constant lives); `sh -c` wrappers, pipes, and package installs inside the subcontainer all fail.
- **`renderHeadscaleConfig()` must keep satisfying headscale's startup validators.** headscale exits fatally on configs that merely look fine: an empty initial DERP map, `magic_dns` without `base_domain`, `override_local_dns` without global nameservers. Upstream bumps occasionally add such rules — on a version bump, read the CHANGELOG and boot the new image once before shipping.
- **`nodes delete` silently no-ops without `--force` when stdin is not a TTY** (it prints the prompt, "Node not deleted", and exits 0). Any new destructive CLI action must pass `--force` and verify its own result. Expire does not prompt.
- **The headscale CLI's `-o json` is a live ABI against the running server**: 0.29.x emits snake_case with `online`/`expiry` and no boolean `expired` — `parseNodes` derives expiry from `expiry < now` and keeps camelCase fallbacks for 0.30+, which replaces the gRPC-over-socket encoding with API shapes. Verify against a real server (scratch container + tailscale userspace client) when bumping upstream.
- **MagicDNS coupling:** headscale fatal-exits at startup if `dns.magic_dns` is true with an empty `base_domain`; the renderer keeps `magic_dns` off while `store.baseDomain` is null.
- **The coordination API publishes on external 8443, not 443.** `net vhost dump-table` shows StartOS's own wildcard `*:443` vhost, so a package cannot claim 443; 8443 is the conventional stand-in and clears restrictive egress firewalls. It is a preference, not a guarantee — everything that names a port reads the live assigned one off the binding.
- **The coordination port is a TLS passthrough — do not "fix" it back to a proxied `http` binding.** The embedded DERP relay needs HTTP `CONNECT` to reach headscale; the StartOS reverse proxy rejects `CONNECT` with 405, and stock tailscale clients never use the WebSocket DERP transport (`TS_DEBUG_DERP_WS_CLIENT=1` only; `tailcfg.DERPNode` has no force-websocket field — verified empirically). `setupCerts.ts` mints the served certificate from the StartOS CA (SANs = container IP + 127.0.0.1 + OS bridge IP + every address the binding publishes; WAN IPv4 excluded — the box does not hold it); `main.ts` watches the pair with `.const()` so a reissue restarts the daemon.
- **The DERP map is rendered from the live external ports — do not switch back to the auto-added embedded region.** `GenerateRegion` takes the advertised `STUNPort` from `stun_listen_addr` (the container's fixed 3478), but StartOS DNATs the _assigned_ external port to it, and the two differ whenever another package holds the preferred port (coturn owns UDP 3478 on any box that installs it — our STUN binding then gets a random external port). `main.ts` therefore renders `/data/derp.yaml` (region 999, `derp.paths`, `automatically_add_embedded_derp_region: false`, `derp.urls: []`) from `host.bindings[port].net.assignedSslPort`/`assignedPort` with `.const()` reactivity, so a port change re-renders and restarts. `urls` stays empty on purpose: the tailnet relays only through your own box, never Tailscale's public regions.
- **The primary URL comes from `sdk.setupPrimaryUrl`, but its task and `bestUsable` do not — do not "restore" them.** `configure.ts` uses the SDK's form (public domain → `.local` → first, following a stored hostname across port and scheme changes) with `fallback: false`. But `bestUsable` and `setupTask` are built on `Watchable.combine`, and a combined reader does not emit inside `setupOnInit`: `await primaryUrl.bestUsable(effects).const()` hangs there forever, so `main` is never evaluated and the service sits blocked with no error in the logs. `endpoint.ts` + `bestServerUrl` (in `utils.ts`, unit-tested) reproduce the same resolution from plain `store.read().const()` and `sdk.host.getOwn(...).const()`, and `watchSetup` raises the critical task itself because `setupTask`'s `input-not-matches` is re-evaluated on address changes, not on the store write.
- **`start-cli package install` does not auto-start the service.** After install or update, nothing evaluates `main` until something starts it — verified across both SDK 2 and 3 builds, so this is not package behavior. `start-cli package start <id>` after installing.
- **`/data` carries both the volume mountpoint and every persisted path** (config, store, SQLite, socket, keys). headscale's default `/var/lib/headscale` and `/var/run` paths are deliberately overridden — the subcontainer filesystem is ephemeral.
