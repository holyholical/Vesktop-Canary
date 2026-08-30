/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Rectangle } from "electron";

export interface Settings {
    discordBranch: "stable" | "canary" | "ptb";
    transparencyOption: "none" | "mica" | "tabbed" | "acrylic";
    webRTCIPHandlingPolicy:
        | "default"
        | "default_public_interface_only"
        | "default_public_and_private_interfaces"
        | "disable_non_proxied_udp";
    tray: boolean;
    minimizeToTray: boolean;
    autoStartMinimized: boolean;
    openLinksWithElectron: boolean;
    staticTitle: boolean;
    enableMenu: boolean;
    enableShadow: boolean;
    enableRoundedCorners: boolean;
    disableSmoothScroll: boolean;
    hardwareAcceleration: boolean;
    hardwareVideoAcceleration: boolean;
    arRPC: boolean;
    appBadge: boolean;
    /** Draw the mention count on the tray icon */
    trayBadgeCount: boolean;
    enableTaskbarFlashing: boolean;
    disableMinSize: boolean;
    clickTrayToShowHide: boolean;
    nativeTitleBar: boolean;

    enableSplashScreen: boolean;
    splashTheming: boolean;
    splashPixelated: boolean;
    splashColor?: string;
    splashBackground?: string;

    spellCheckLanguages?: string[];

    /** Which OS Discord should think it is running on. "auto" uses the real platform */
    platformSpoof: "auto" | "windows" | "linux" | "darwin";
    /** Block Discord analytics (science/track/metrics) and Sentry crash reports */
    blockTelemetry: boolean;
    /** Wipe the HTTP cache when Vesktop exits */
    clearCacheOnExit: boolean;
    /** Keep the display awake while in a call or watching a stream */
    preventSleepInCalls: boolean;
    /** Go idle based on system-wide input activity instead of activity inside the Discord window */
    systemIdleDetection: boolean;
    /** Automatically download new Vencord releases on launch */
    autoUpdateVencord: boolean;

    proxy: {
        enabled: boolean;
        /** e.g. socks5://127.0.0.1:9050 or http://user:pass@proxy:3128 */
        url: string;
        /** Chromium bypass rules, comma separated */
        bypassRules: string;
    };

    dnsOverHttps: {
        enabled: boolean;
        /** DoH template URL */
        server: string;
    };

    audio?: {
        workaround?: boolean;

        deviceSelect?: boolean;
        granularSelect?: boolean;

        ignoreVirtual?: boolean;
        ignoreDevices?: boolean;
        ignoreInputMedia?: boolean;

        onlySpeakers?: boolean;
        onlyDefaultSpeakers?: boolean;
    };
}

export interface State {
    maximized?: boolean;
    minimized?: boolean;
    windowBounds?: Rectangle;

    firstLaunch?: boolean;

    steamOSLayoutVersion?: number;
    linuxAutoStartEnabled?: boolean;

    vencordDir?: string;
    /** Release tag of the currently downloaded Vencord files */
    vencordVersion?: string;

    updater?: {
        ignoredVersion?: string;
        snoozeUntil?: number;
    };
}
