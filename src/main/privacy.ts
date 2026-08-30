/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app, session } from "electron";

import { Settings } from "./settings";

/**
 * Discord analytics and crash reporting endpoints.
 * Blocking these does not affect messaging, voice or media.
 */
const TELEMETRY_URL_PATTERNS = [
    "*://*.discord.com/api/*/science",
    "*://*.discord.com/api/*/track",
    "*://*.discord.com/api/*/metrics",
    "*://*.discord.com/api/*/metrics/*",
    "*://*.discord.com/api/*/debug-logs",
    "*://*.discord.com/api/*/error-reporting",
    "*://*.discord.com/cdn-cgi/rum*",
    "*://*.sentry.io/*",
    "*://*.ingest.sentry.io/*",
    "*://*.ingest.us.sentry.io/*",
    "*://sentry.io/*"
];

function initTelemetryBlocking() {
    let blocked = 0;

    session.defaultSession.webRequest.onBeforeRequest({ urls: TELEMETRY_URL_PATTERNS }, (details, callback) => {
        if (!Settings.store.blockTelemetry) return callback({});

        if (IS_DEV && ++blocked % 25 === 1) {
            console.log(`[Privacy] Blocked telemetry request (${blocked} so far):`, details.url);
        }

        callback({ cancel: true });
    });
}

const DOH_MODE_OFF = "off" as const;
const DOH_MODE_SECURE = "secure" as const;

function applyDnsOverHttps() {
    const { enabled, server } = Settings.store.dnsOverHttps ?? {};

    if (!enabled || !server) {
        app.configureHostResolver({ secureDnsMode: DOH_MODE_OFF, secureDnsServers: [] });
        return;
    }

    try {
        const url = new URL(server);
        if (url.protocol !== "https:") throw new Error("DoH template must be https");
    } catch (err) {
        console.error("[Privacy] Invalid DNS over HTTPS server, not applying:", err);
        return;
    }

    app.configureHostResolver({ secureDnsMode: DOH_MODE_SECURE, secureDnsServers: [server] });
    console.log("[Privacy] DNS over HTTPS enabled via", server);
}

function initDnsOverHttps() {
    applyDnsOverHttps();

    Settings.addGlobalChangeListener((_, path) => {
        if (path === "" || path.startsWith("dnsOverHttps")) applyDnsOverHttps();
    });
}

let isClearingCache = false;

function initClearCacheOnExit() {
    app.on("will-quit", event => {
        if (!Settings.store.clearCacheOnExit || isClearingCache) return;

        isClearingCache = true;
        event.preventDefault();

        Promise.all([session.defaultSession.clearCache(), session.defaultSession.clearCodeCaches({})])
            .catch(err => console.error("[Privacy] Failed to clear cache on exit:", err))
            .finally(() => app.quit());
    });
}

/** Must be called after app is ready */
export function initPrivacy() {
    initTelemetryBlocking();
    initDnsOverHttps();
    initClearCacheOnExit();
}
