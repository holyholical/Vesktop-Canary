/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { contextBridge, ipcRenderer, webFrame } from "electron/renderer";

import { IpcEvents } from "../shared/IpcEvents";
import { VesktopNative } from "./VesktopNative";

contextBridge.exposeInMainWorld("VesktopNative", VesktopNative);

// Platform spoofing: the user agent is handled by the main process, but Discord also reads
// navigator.platform and navigator.userAgentData, which Chromium derives from the real OS.
const { spoof } = VesktopNative.app.getPlatformInfo();
if (spoof) {
    webFrame.executeJavaScript(`(${spoofNavigatorPlatform})(${JSON.stringify(spoof)})`);
}

function spoofNavigatorPlatform(spoof: { navigatorPlatform: string; clientHintPlatform: string }) {
    Object.defineProperty(Navigator.prototype, "platform", {
        get: () => spoof.navigatorPlatform,
        configurable: true
    });

    const uaData = (navigator as any).userAgentData;
    if (!uaData) return;

    const proto = Object.getPrototypeOf(uaData);
    Object.defineProperty(proto, "platform", { get: () => spoof.clientHintPlatform, configurable: true });

    const originalToJSON = proto.toJSON;
    proto.toJSON = function () {
        return { ...originalToJSON.call(this), platform: spoof.clientHintPlatform };
    };

    const originalGetHighEntropyValues = proto.getHighEntropyValues;
    proto.getHighEntropyValues = function (hints: string[]) {
        return originalGetHighEntropyValues.call(this, hints).then((values: Record<string, unknown>) => ({
            ...values,
            platform: spoof.clientHintPlatform
        }));
    };
}

// While sandboxed, Electron "polyfills" these APIs as local variables.
// We have to pass them as arguments as they are not global
Function(
    "require",
    "Buffer",
    "process",
    "clearImmediate",
    "setImmediate",
    ipcRenderer.sendSync(IpcEvents.GET_VENCORD_PRELOAD_SCRIPT)
)(require, Buffer, process, clearImmediate, setImmediate);

webFrame.executeJavaScript(ipcRenderer.sendSync(IpcEvents.GET_VENCORD_RENDERER_SCRIPT));
webFrame.executeJavaScript(ipcRenderer.sendSync(IpcEvents.GET_VESKTOP_RENDERER_SCRIPT));
