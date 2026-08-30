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

let lastAppliedDoh: string | undefined;

function applyDnsOverHttps() {
    const { enabled, server } = Settings.store.dnsOverHttps ?? {};

    const config = JSON.stringify({ enabled, server });
    if (config === lastAppliedDoh) return;
    lastAppliedDoh = config;

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

    Settings.addGlobalChangeListener(() => applyDnsOverHttps());
}

let isClearingOnExit = false;

function initClearOnExit() {
    app.on("will-quit", event => {
        const { clearCacheOnExit, clearSessionOnExit } = Settings.store;
        if ((!clearCacheOnExit && !clearSessionOnExit) || isClearingOnExit) return;

        isClearingOnExit = true;
        event.preventDefault();

        const ses = session.defaultSession;
        const tasks: Promise<unknown>[] = [];
        if (clearCacheOnExit) tasks.push(ses.clearCache(), ses.clearCodeCaches({}));
        // everything that identifies the session: cookies, localStorage (token), IndexedDB, service workers
        if (clearSessionOnExit) tasks.push(ses.clearStorageData(), ses.clearAuthCache());

        Promise.all(tasks)
            .then(() => console.log("[Privacy] Cleared on exit:", { clearCacheOnExit, clearSessionOnExit }))
            .catch(err => console.error("[Privacy] Failed to clear data on exit:", err))
            .finally(() => app.quit());
    });
}

const TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

/**
 * Chromium reads TZ at startup and --lang before ready, so these cannot change at runtime.
 * Discord sends the locale in X-Super-Properties and reads the timezone through Intl.
 */
export function applyLocaleAndTimezoneSpoof() {
    const { spoofTimezone, spoofLocale } = Settings.store;

    if (spoofTimezone) {
        if (TIMEZONE_PATTERN.test(spoofTimezone)) {
            process.env.TZ = spoofTimezone;
            console.log("[Privacy] Timezone spoofed to", spoofTimezone);
        } else {
            console.error("[Privacy] Ignoring invalid spoofTimezone:", spoofTimezone);
        }
    }

    if (spoofLocale) {
        if (LOCALE_PATTERN.test(spoofLocale)) {
            app.commandLine.appendSwitch("lang", spoofLocale);
            console.log("[Privacy] Locale spoofed to", spoofLocale);
        } else {
            console.error("[Privacy] Ignoring invalid spoofLocale:", spoofLocale);
        }
    }
}

/** Must be called after app is ready */
export function initPrivacy() {
    initTelemetryBlocking();
    initDnsOverHttps();
    initClearOnExit();
}
