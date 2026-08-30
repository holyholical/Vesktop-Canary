/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { powerSaveBlocker } from "electron";
import { IpcEvents } from "shared/IpcEvents";

import { Settings } from "./settings";
import { handle } from "./utils/ipcWrappers";

let blockerId: number | undefined;

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
