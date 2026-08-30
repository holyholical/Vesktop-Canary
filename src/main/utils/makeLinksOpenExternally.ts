/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BrowserWindow, Menu, shell } from "electron";
import { DISCORD_HOSTNAMES } from "main/constants";

import { Settings } from "../settings";
import { createOrFocusPopup, setupPopout } from "./popout";
import { execSteamURL, isDeckGameMode, steamOpenURL } from "./steamOS";

export function handleExternalUrl(url: string, protocol?: string): { action: "deny" | "allow" } {
    if (protocol == null) {
        try {
            protocol = new URL(url).protocol;
        } catch {
            return { action: "deny" };
        }
    }

    switch (protocol) {
        case "http:":
        case "https:":
            if (Settings.store.openLinksWithElectron) {
                return { action: "allow" };
            }
        // eslint-disable-next-line no-fallthrough
        case "mailto:":
        case "spotify:":
            if (isDeckGameMode) {
                steamOpenURL(url);
            } else {
                shell.openExternal(url);
            }
            break;
        case "steam:":
            if (isDeckGameMode) {
                execSteamURL(url);
            } else {
                shell.openExternal(url);
            }
            break;
    }

    return { action: "deny" };
}

/**
 * Windows opened via "Open Links in app" get a small menu so the page can still
 * be handed off to the real browser. https://github.com/Vencord/Vesktop/issues/1097
 */
function setupExternalLinkWindow(win: BrowserWindow) {
    const openInBrowser = () => {
        const url = win.webContents.getURL();
        if (url && url !== "about:blank") shell.openExternal(url);
    };

    win.setMenu(
        Menu.buildFromTemplate([
            { label: "Open in Browser", accelerator: "CmdOrCtrl+Shift+O", click: openInBrowser },
            { label: "Back", accelerator: "Alt+Left", click: () => win.webContents.navigationHistory.goBack() },
            { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => win.webContents.reload() }
        ])
    );
    win.setMenuBarVisibility(true);
    win.setAutoHideMenuBar(false);

    win.webContents.setWindowOpenHandler(({ url }) => handleExternalUrl(url));
}

export function makeLinksOpenExternally(win: BrowserWindow) {
    win.webContents.setWindowOpenHandler(({ url, frameName, features }) => {
        try {
            var { protocol, hostname, pathname, searchParams } = new URL(url);
        } catch {
            return { action: "deny" };
        }

        if (frameName.startsWith("DISCORD_") && pathname === "/popout" && DISCORD_HOSTNAMES.includes(hostname)) {
            return createOrFocusPopup(frameName, features);
        }

        if (url === "about:blank") return { action: "allow" };

        // Drop the static temp page Discord web loads for the connections popout
        if (frameName === "authorize" && searchParams.get("loading") === "true") return { action: "deny" };

        return handleExternalUrl(url, protocol);
    });

    win.webContents.on("did-create-window", (win, { frameName }) => {
        if (frameName.startsWith("DISCORD_")) setupPopout(win, frameName);
        else setupExternalLinkWindow(win);
    });
}
