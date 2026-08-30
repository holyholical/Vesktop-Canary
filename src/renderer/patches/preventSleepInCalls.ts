/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { onceReady } from "@vencord/types/webpack";
import { FluxDispatcher } from "@vencord/types/webpack/common";

import { VesktopLogger } from "../logger";

// Keeps the display awake while connected to voice or watching a stream.
// https://github.com/Vencord/Vesktop/issues/577

interface RtcConnectionStateEvent {
    type: "RTC_CONNECTION_STATE";
    /** "default" for voice, "stream" for watching/streaming */
    context: string;
    state: string;
    streamKey?: string;
}

const connectedContexts = new Set<string>();

function onRtcConnectionState(event: RtcConnectionStateEvent) {
    const key = event.streamKey ?? event.context;
    const wasActive = connectedContexts.size > 0;

    if (event.state === "RTC_CONNECTED") connectedContexts.add(key);
    else if (event.state === "DISCONNECTED") connectedContexts.delete(key);

    const isActive = connectedContexts.size > 0;
    if (isActive === wasActive) return;

    VesktopLogger.log(isActive ? "In a call, keeping display awake" : "Call ended, releasing power save blocker");
    VesktopNative.power.setInCall(isActive);
}

onceReady.then(() => {
    FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtcConnectionState as any);
});
