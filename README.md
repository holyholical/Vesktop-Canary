# Vesktop-Canary

Vesktop-Canary is a fork of [Vesktop](https://github.com/Vencord/Vesktop) that stays on the newest upstream code and adds privacy and power-user features on top. I'm the only maintainer for this project atm and I'd like contributors and a helping hand :)

## Staying current

- A daily GitHub Action merges upstream `Vencord/Vesktop` `main`, verifies lint/types/build, and pushes. Conflicts or build failures open a PR instead.
- Vencord itself is checked for a new release every launch (toggle in Settings > Miscellaneous > Vencord Updates). Updates apply on the next start.

## Extra features over Vesktop

| Feature | Where |
| --- | --- |
| Proxy support (http, https, socks4, socks5, with credentials), bypass rules, connection test, WebRTC kill switch so voice can't bypass the proxy | Settings > Privacy |
| Platform spoofing (Windows / macOS / Linux): user agent, client hints, `navigator.platform` | Settings > Privacy |
| Client type spoofing (desktop app / Android / iOS): what the platform indicator shows other users | Settings > Privacy |
| Telemetry blocking (science, track, metrics, Sentry) | Settings > Privacy (on by default) |
| DNS over HTTPS (Quad9, Cloudflare, Mullvad, Google, custom) | Settings > Privacy |
| Timezone and locale spoofing | Settings > Privacy |
| Clear cache on exit, forget session on exit (wipes cookies/login) | Settings > Privacy |
| Client hint scrubbing (arch, bitness, model, full version list) while spoofing; no Referer leaks to non-Discord hosts | automatic |
| Isolated profiles: separate login, cookies, cache, settings per profile | `--profile <name>` |
| Login with token | Button on the login page, and Settings > Account |
| Mention count drawn on the tray icon | Settings > Notifications (on by default) |
| Keep display awake in calls and while watching streams | Settings > Behaviour |
| System-wide idle detection (no more AFK while you're active in another window) | Settings > Behaviour (on by default) |
| "Open in Browser" menu (Ctrl+Shift+O) for links opened in-app | Windows opened via "Open Links in app" |
| `--proxy-server <scheme://host:port>` | CLI, overrides the proxy setting for one session |

Everything upstream Vesktop has (WebRTC IP handling policy, `--user-agent-os`, `--repair`, etc.) is still here.

## Building

Same as upstream: `pnpm i`, then `pnpm build` / `pnpm start`. See the [Vesktop README](https://github.com/Vencord/Vesktop#building-from-source) for platform details.

### Running on musl (Alpine, Gentoo musl, Void musl, Chimera)

The Electron binary npm downloads is glibc-only and segfaults in `ld.so` on musl. Alpine builds Electron against musl, so:

```sh
pnpm setup:musl   # downloads Alpine's electron + the few libs your system lacks into .electron-musl/
pnpm start:musl   # pnpm build, then launch with it (start:musl:dev for a dev build)
```

Nothing is installed system-wide; delete `.electron-musl/` to undo. Alpine's Electron may lag the version pinned in `package.json`, which is fine for development. Known gap: `@vencord/venmic` ships glibc prebuilds, so screenshare audio needs venmic built against musl.
