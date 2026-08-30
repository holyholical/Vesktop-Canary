/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { session } from "electron";
import type { Settings as TSettings } from "shared/settings";

import { CommandLine } from "./cli";
import { Settings } from "./settings";

export type SpoofablePlatform = Exclude<TSettings["platformSpoof"], "auto">;

const VersionString = `AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome.split(".")[0]}.0.0.0 Safari/537.36`;

const BrowserUserAgents: Record<SpoofablePlatform, string> = {
    darwin: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${VersionString}`,
    linux: `Mozilla/5.0 (X11; Linux x86_64) ${VersionString}`,
    windows: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${VersionString}`
};

/** navigator.platform values matching each spoofed OS */
export const NavigatorPlatforms: Record<SpoofablePlatform, string> = {
    darwin: "MacIntel",
    linux: "Linux x86_64",
    windows: "Win32"
};

/** Sec-CH-UA-Platform client hint values matching each spoofed OS */
export const ClientHintPlatforms: Record<SpoofablePlatform, string> = {
    darwin: "macOS",
    linux: "Linux",
    windows: "Windows"
};

function toSpoofable(platform: string): SpoofablePlatform {
    if (platform === "win32" || platform === "windows") return "windows";
    if (platform === "darwin") return "darwin";
    return "linux";
}

/**
 * The platform Discord should see. Command line flags win over the setting,
 * which wins over the real platform.
 */
export function getEffectivePlatform(): SpoofablePlatform {
    const cli = CommandLine.values["user-agent-os"];
    if (cli) return toSpoofable(cli);

    const { platformSpoof } = Settings.store;
    if (platformSpoof && platformSpoof !== "auto") return platformSpoof;

    return toSpoofable(process.platform);
}

export function isSpoofingPlatform() {
    return getEffectivePlatform() !== toSpoofable(process.platform);
}

export function getBrowserUserAgent() {
    return CommandLine.values["user-agent"] || BrowserUserAgents[getEffectivePlatform()];
}

export interface PlatformInfo {
    /** the real process.platform */
    platform: NodeJS.Platform;
    /** set when spoofing: values the renderer should expose to Discord */
    spoof?: {
        navigatorPlatform: string;
        clientHintPlatform: string;
    };
}

export function getPlatformInfo(): PlatformInfo {
    if (!isSpoofingPlatform()) return { platform: process.platform };

    const effective = getEffectivePlatform();
    return {
        platform: process.platform,
        spoof: {
            navigatorPlatform: NavigatorPlatforms[effective],
            clientHintPlatform: ClientHintPlatforms[effective]
        }
    };
}

const CLIENT_HINT_HEADERS = ["sec-ch-ua-platform", "sec-ch-ua-platform-version"];

/**
 * Applies the user agent to the whole session so popouts and plain HTTP requests match,
 * and rewrites the client hint headers Chromium derives from the real OS.
 */
export function initUserAgent() {
    const ses = session.defaultSession;
    ses.setUserAgent(getBrowserUserAgent());

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        if (!isSpoofingPlatform()) return callback({});

        const platform = getEffectivePlatform();
        const requestHeaders = Object.fromEntries(
            Object.entries(details.requestHeaders).filter(([k]) => !CLIENT_HINT_HEADERS.includes(k.toLowerCase()))
        );

        const hasPlatformHint = Object.keys(details.requestHeaders).some(k => k.toLowerCase() === "sec-ch-ua-platform");
        if (hasPlatformHint) {
            requestHeaders["sec-ch-ua-platform"] = `"${ClientHintPlatforms[platform]}"`;
        }

        callback({ requestHeaders });
    });
}
