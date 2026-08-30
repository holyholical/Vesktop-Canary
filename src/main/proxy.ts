/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app, session } from "electron";

import { Settings } from "./settings";

interface ParsedProxy {
    /** Chromium proxy rules string without credentials */
    rules: string;
    username?: string;
    password?: string;
}

const SUPPORTED_SCHEMES = new Set(["http:", "https:", "socks:", "socks4:", "socks5:"]);

/**
 * Parses a proxy URL like socks5://user:pass@host:1080 into Chromium proxy rules and optional credentials.
 * Chromium's proxyRules cannot carry credentials, so they are split out and served via the "login" event.
 */
export function parseProxyUrl(raw: string): ParsedProxy | { error: string } {
    const trimmed = raw.trim();
    if (!trimmed) return { error: "Proxy URL is empty" };

    let url: URL;
    try {
        url = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`);
    } catch {
        return { error: "Proxy URL is not a valid URL" };
    }

    if (!SUPPORTED_SCHEMES.has(url.protocol)) {
        return { error: `Unsupported proxy scheme "${url.protocol.slice(0, -1)}". Use http, https, socks4 or socks5` };
    }

    if (!url.hostname) return { error: "Proxy URL has no host" };

    const rules = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;

    return {
        rules,
        username: url.username ? decodeURIComponent(url.username) : undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined
    };
}

let credentials: { username: string; password: string } | undefined;
let lastAppliedConfig: string | undefined;

/** --proxy-server is a native Chromium switch and always wins over the setting */
const hasCliProxy = () => app.commandLine.hasSwitch("proxy-server");

async function applyProxy() {
    if (hasCliProxy()) {
        console.log("[Proxy] --proxy-server given, ignoring proxy setting");
        return;
    }

    const ses = session.defaultSession;
    const { enabled, url, bypassRules } = Settings.store.proxy ?? {};

    // settings listeners fire for every change, so only touch the network stack when the proxy config changed
    const config = JSON.stringify({ enabled, url, bypassRules });
    if (config === lastAppliedConfig) return;
    lastAppliedConfig = config;

    credentials = undefined;
    proxyAuthAttempts.clear();

    if (!enabled || !url) {
        await ses.setProxy({ mode: "system" });
        console.log("[Proxy] Using system proxy settings");
        return;
    }

    const parsed = parseProxyUrl(url);
    if ("error" in parsed) {
        console.error("[Proxy] Not applying proxy:", parsed.error);
        await ses.setProxy({ mode: "system" });
        return;
    }

    if (parsed.username) {
        credentials = { username: parsed.username, password: parsed.password ?? "" };
    }

    await ses.setProxy({
        mode: "fixed_servers",
        proxyRules: parsed.rules,
        proxyBypassRules: bypassRules || "<local>"
    });
    await ses.closeAllConnections();

    console.log("[Proxy] Using proxy", parsed.rules);
}

/**
 * Makes a request through the current proxy config and reports whether Discord is reachable.
 */
export async function testProxy(): Promise<{ ok: true; ms: number } | { ok: false; error: string }> {
    const start = Date.now();
    try {
        // cache-bust, otherwise a cached response reports success without touching the proxy
        const res = await session.defaultSession.fetch(`https://discord.com/api/v9/gateway?vesktop=${Date.now()}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(15_000)
        });
        if (!res.ok) return { ok: false, error: `Discord responded with HTTP ${res.status}` };
        return { ok: true, ms: Date.now() - start };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/** Chromium re-emits "login" if the proxy rejects the credentials; answering forever would spin */
const MAX_PROXY_AUTH_ATTEMPTS = 2;
const proxyAuthAttempts = new Map<string, number>();

export function initProxy() {
    app.on("login", (event, _webContents, details, authInfo, callback) => {
        if (!authInfo.isProxy || !credentials) return;

        const key = `${authInfo.host}:${authInfo.port}`;
        const attempts = (proxyAuthAttempts.get(key) ?? 0) + 1;
        proxyAuthAttempts.set(key, attempts);

        if (attempts > MAX_PROXY_AUTH_ATTEMPTS) {
            console.error(`[Proxy] Proxy ${key} rejected the configured credentials (${details.url})`);
            return;
        }

        event.preventDefault();
        callback(credentials.username, credentials.password);
    });

    Settings.addGlobalChangeListener(() => applyProxy());

    return applyProxy();
}
