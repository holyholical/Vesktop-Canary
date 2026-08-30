# Vesktop-Canary

Vesktop-Canary is a fork of [Vesktop](https://github.com/Vencord/Vesktop) that stays on the newest upstream code and adds privacy and power-user features on top. I'm the only maintainer for this project atm and I'd like contributors and a helping hand :)

## Staying current

- A daily GitHub Action merges upstream `Vencord/Vesktop` `main`, verifies lint/types/build, and pushes. Conflicts or build failures open a PR instead.
- Vencord itself is checked for a new release every launch (toggle in Settings > Miscellaneous > Vencord Updates). Updates apply on the next start.

## Extra features over Vesktop

| Feature | Where |
| --- | --- |
| Proxy support (http, https, socks4, socks5, with credentials), bypass rules, connection test | Settings > Privacy |
| Platform spoofing (Windows / macOS / Linux): user agent, client hints, `navigator.platform` | Settings > Privacy |
| Telemetry blocking (science, track, metrics, Sentry) | Settings > Privacy (on by default) |
| DNS over HTTPS (Quad9, Cloudflare, Mullvad, Google, custom) | Settings > Privacy |
| Clear cache on exit | Settings > Privacy |
| Login with token | Settings > Account |
| Keep display awake in calls and while watching streams | Settings > Behaviour |
| "Open in Browser" menu (Ctrl+Shift+O) for links opened in-app | Windows opened via "Open Links in app" |
| `--proxy-server <scheme://host:port>` | CLI, overrides the proxy setting for one session |

Everything upstream Vesktop has (WebRTC IP handling policy, `--user-agent-os`, `--repair`, etc.) is still here.

## Building

Same as upstream: `pnpm i`, then `pnpm build` / `pnpm start`. See the [Vesktop README](https://github.com/Vencord/Vesktop#building-from-source) for platform details.
