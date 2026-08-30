/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { PowerMonitorEvent } from "main/powerSave";
import { Settings } from "renderer/settings";

import { addPatch } from "./shared";

// Discord's idle module has two code paths: on the official desktop client it polls
// DiscordNative.powerMonitor.getSystemIdleTimeMs() (system-wide activity), on web it only
// watches events inside the page. Vesktop gets the web path, so it marks you idle while
// you are busy in another window. Route the desktop path to Electron's powerMonitor instead.
// https://github.com/Vencord/Vesktop/issues/396

type Listener = () => void;
const listeners = new Map<PowerMonitorEvent, Set<Listener>>();

VesktopNative.power.onPowerMonitorEvent(event => {
    listeners.get(event)?.forEach(cb => cb());
});

addPatch({
    patches: [
        {
            find: 'type:"IDLE",idle:',
            predicate: () => Settings.store.systemIdleDetection,
            replacement: [
                {
                    // isPlatformEmbedded && DiscordNative?.powerMonitor != null ? <desktop path> : <web path>
                    match: /\i\.isPlatformEmbedded&&\i\.\i\?\.powerMonitor!=null\?/,
                    replace: "$self.powerMonitor!=null?"
                },
                {
                    // DiscordNative?.powerMonitor / DiscordNative.powerMonitor inside the desktop path
                    match: /\i\.\i\??\.powerMonitor/g,
                    replace: "$self.powerMonitor"
                }
            ]
        }
    ],

    powerMonitor: {
        getSystemIdleTimeMs: () => VesktopNative.power.getSystemIdleTimeMs(),
        on(event: PowerMonitorEvent, cb: Listener) {
            let set = listeners.get(event);
            if (!set) listeners.set(event, (set = new Set()));
            set.add(cb);
        }
    }
});
