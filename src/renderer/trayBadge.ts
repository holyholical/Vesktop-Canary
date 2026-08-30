/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { VesktopLogger } from "./logger";
import { Settings } from "./settings";
import { isMac } from "./utils";

// Draws the mention count onto the tray icon. The main process has no canvas,
// so the icon is composited here and sent back as a PNG.
// https://github.com/Vencord/Vesktop/issues/1315

const MAX_SHOWN_COUNT = 99;
const BADGE_COLOR = "#f23f43";
const BADGE_TEXT_COLOR = "#ffffff";

const cache = new Map<number, string>();
let baseIcon: Promise<HTMLImageElement> | undefined;

function loadBaseIcon() {
    baseIcon ??= VesktopNative.tray.getIconDataUrl().then(
        src =>
            new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("Failed to load tray icon"));
                img.src = src;
            })
    );
    return baseIcon;
}

export function invalidateTrayBadgeCache() {
    baseIcon = undefined;
    cache.clear();
}

async function drawBadge(count: number) {
    const cached = cache.get(count);
    if (cached) return cached;

    const icon = await loadBaseIcon();
    const size = Math.max(icon.width, icon.height);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(icon, 0, 0, size, size);

    const label = count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : String(count);
    const badgeHeight = size * 0.5;
    ctx.font = `bold ${badgeHeight * 0.72}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(label).width;
    const badgeWidth = Math.max(badgeHeight, textWidth + badgeHeight * 0.5);
    const x = size - badgeWidth;
    const y = size - badgeHeight;
    const radius = badgeHeight / 2;

    ctx.fillStyle = BADGE_COLOR;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeWidth, badgeHeight, radius);
    ctx.fill();

    ctx.fillStyle = BADGE_TEXT_COLOR;
    ctx.fillText(label, x + badgeWidth / 2, y + badgeHeight / 2 + badgeHeight * 0.04);

    const dataUrl = canvas.toDataURL("image/png");
    cache.set(count, dataUrl);
    return dataUrl;
}

/**
 * Called with the same count as the app badge.
 * -1 (unread, no mentions) and 0 fall back to the plain tray icons.
 */
export async function updateTrayBadge(count: number) {
    if (isMac) return;

    try {
        if (count <= 0 || !Settings.store.trayBadgeCount) {
            await VesktopNative.tray.setBadgeImage(null);
            return;
        }

        await VesktopNative.tray.setBadgeImage(await drawBadge(count));
    } catch (e) {
        VesktopLogger.error("Failed to draw tray badge", e);
    }
}
