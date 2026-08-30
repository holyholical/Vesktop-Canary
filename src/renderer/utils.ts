/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Discord deletes this from the window so we need to capture it in a variable
export const { localStorage } = window;

export const isFirstRun = (() => {
    const key = "VCD_FIRST_RUN";
    if (localStorage.getItem(key) !== null) return false;
    localStorage.setItem(key, "false");
    return true;
})();

// Use the real platform from the main process, not navigator.platform, which may be spoofed
const { platform } = VesktopNative.app.getPlatformInfo();

export const isWindows = platform === "win32";
export const isMac = platform === "darwin";
export const isLinux = platform === "linux";
