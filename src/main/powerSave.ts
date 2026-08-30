/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { powerMonitor, powerSaveBlocker, webContents } from "electron";
import { IpcEvents } from "shared/IpcEvents";

import { Settings } from "./settings";
import { handle } from "./utils/ipcWrappers";

let blockerId: number | undefined;

export function releasePowerSaveBlocker() {
    stop();
}

function stop() {
    if (blockerId === undefined) return;
    if (powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId);
    blockerId = undefined;
}

function start() {
    if (blockerId !== undefined && powerSaveBlocker.isStarted(blockerId)) return;
    blockerId = powerSaveBlocker.start("prevent-display-sleep");
}

/** Called by the renderer whenever the user joins or leaves a call / stream */
handle(IpcEvents.POWER_SAVE_BLOCKER_SET, (_, active: boolean) => {
    if (active && Settings.store.preventSleepInCalls) start();
    else stop();
});

Settings.addChangeListener("preventSleepInCalls", enabled => {
    if (!enabled) stop();
});

// System idle detection: Discord's idle logic polls this the same way the official client does.
// https://github.com/Vencord/Vesktop/issues/396
handle(IpcEvents.POWER_GET_SYSTEM_IDLE_TIME_MS, () => powerMonitor.getSystemIdleTime() * 1000);

export const POWER_MONITOR_EVENTS = ["suspend", "resume", "lock-screen", "unlock-screen"] as const;
export type PowerMonitorEvent = (typeof POWER_MONITOR_EVENTS)[number];

for (const event of POWER_MONITOR_EVENTS) {
    powerMonitor.on(event as any, () => {
        for (const contents of webContents.getAllWebContents()) {
            if (!contents.isDestroyed()) contents.send(IpcEvents.POWER_MONITOR_EVENT, event);
        }
    });
}
