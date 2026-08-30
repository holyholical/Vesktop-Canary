/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app, BrowserWindow, Menu, NativeImage, nativeImage, Tray } from "electron";
import { readFile } from "fs/promises";
import { IpcEvents } from "shared/IpcEvents";

import { createAboutWindow } from "./about";
import { AppEvents } from "./events";
import { Settings } from "./settings";
import { resolveAssetPath } from "./userAssets";
import { clearData } from "./utils/clearData";
import { handle } from "./utils/ipcWrappers";
import { downloadVencordFiles } from "./utils/vencordLoader";

let tray: Tray;
let trayVariant: "tray" | "trayUnread" = "tray";
/** Renderer-drawn icon with the mention count on it, overrides the variant image while set */
let badgeImage: NativeImage | null = null;

async function refreshTrayImage() {
    if (!tray) return;
    tray.setImage(badgeImage ?? (await resolveAssetPath(trayVariant)));
}

AppEvents.on("userAssetChanged", asset => {
    if (asset === "tray" || asset === "trayUnread") refreshTrayImage();
});

AppEvents.on("setTrayVariant", variant => {
    if (trayVariant === variant) return;

    trayVariant = variant;
    if (variant === "tray") badgeImage = null;
    refreshTrayImage();
});

handle(IpcEvents.TRAY_GET_ICON_DATA_URL, async () => {
    const png = await readFile(await resolveAssetPath("trayUnread"));
    return `data:image/png;base64,${png.toString("base64")}`;
});

handle(IpcEvents.TRAY_SET_BADGE_IMAGE, (_, dataUrl: string | null) => {
    if (dataUrl !== null && !dataUrl.startsWith("data:image/png;base64,")) return;

    badgeImage = dataUrl === null ? null : nativeImage.createFromDataURL(dataUrl);
    if (badgeImage?.isEmpty()) badgeImage = null;
    refreshTrayImage();
});

export function destroyTray() {
    tray?.destroy();
}

export async function initTray(win: BrowserWindow, setIsQuitting: (val: boolean) => void) {
    const onTrayClick = () => {
        if (Settings.store.clickTrayToShowHide && win.isVisible()) win.hide();
        else win.show();
    };

    const trayMenu = Menu.buildFromTemplate([
        {
            label: "Open",
            click() {
                win.show();
            }
        },
        {
            label: "About",
            click: createAboutWindow
        },
        {
            label: "Repair Vencord",
            async click() {
                await downloadVencordFiles();
                app.relaunch();
                app.quit();
            }
        },
        {
            label: "Reset Vesktop Canary",
            async click() {
                await clearData(win);
            }
        },
        {
            type: "separator"
        },
        {
            label: "Restart",
            click() {
                app.relaunch();
                app.quit();
            }
        },
        {
            label: "Quit",
            click() {
                setIsQuitting(true);
                app.quit();
            }
        }
    ]);

    tray = new Tray(badgeImage ?? (await resolveAssetPath(trayVariant)));
    tray.setToolTip("Vesktop Canary");
    tray.setContextMenu(trayMenu);
    tray.on("click", onTrayClick);
}
