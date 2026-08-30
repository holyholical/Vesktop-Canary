/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "renderer/settings";

import { addPatch } from "./shared";

// Discord derives "super properties" (os, browser, device, versions) from the user agent on web
// and sends them in the gateway IDENTIFY and the X-Super-Properties header. The `browser` field is
// what decides the desktop / mobile / web platform indicator other users see. Layer overrides on top.

type SuperProperties = Record<string, string | number | boolean | null>;

const DESKTOP_OS_NAMES = {
    windows: "Windows",
    darwin: "Mac OS X",
    linux: "Linux"
} as const;

const DESKTOP_OS_VERSIONS = {
    windows: "10.0.22631",
    darwin: "23.5.0",
    linux: "6.8.0"
} as const;

const DESKTOP_CLIENT_VERSION = "1.0.9210";
const ANDROID_CLIENT_VERSION = "269.1 - rn";
const IOS_CLIENT_VERSION = "269.0";

function getDesktopPlatform(): keyof typeof DESKTOP_OS_NAMES {
    const { platformSpoof } = Settings.store;
    if (platformSpoof && platformSpoof !== "auto") return platformSpoof;

    const { platform } = VesktopNative.app.getPlatformInfo();
    if (platform === "win32") return "windows";
    if (platform === "darwin") return "darwin";
    return "linux";
}

export function getSuperPropertyOverrides(): SuperProperties {
    switch (Settings.store.clientSpoof) {
        case "desktop": {
            const platform = getDesktopPlatform();
            return {
                os: DESKTOP_OS_NAMES[platform],
                browser: "Discord Client",
                release_channel: "stable",
                client_version: DESKTOP_CLIENT_VERSION,
                os_version: DESKTOP_OS_VERSIONS[platform],
                os_arch: "x64",
                app_arch: "x64",
                device: ""
            };
        }
        case "android":
            return {
                os: "Android",
                browser: "Discord Android",
                device: "Pixel 8",
                os_version: "14",
                client_version: ANDROID_CLIENT_VERSION,
                browser_user_agent: "",
                browser_version: ""
            };
        case "ios":
            return {
                os: "iOS",
                browser: "Discord iOS",
                device: "iPhone16,1",
                os_version: "17.5.1",
                client_version: IOS_CLIENT_VERSION,
                browser_user_agent: "",
                browser_version: ""
            };
        default:
            return {};
    }
}

addPatch({
    patches: [
        {
            find: '"referralProperties"',
            predicate: () => Settings.store.clientSpoof !== "web",
            replacement: {
                // function set(e){ base64 = encode(props = {...props, ...e}) }
                match: /function (\i)\((\i)\)\{(\i)=(\i)\((\i)=\{\.\.\.\5,\.\.\.\2\}\)\}/,
                replace: "function $1($2){$3=$4($5={...$5,...$2,...$self.getSuperPropertyOverrides()})}"
            }
        }
    ],

    getSuperPropertyOverrides
});
