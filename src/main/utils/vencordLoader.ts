/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and Vencord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { mkdirSync } from "fs";
import { access, constants as FsConstants, writeFile } from "fs/promises";
import { VENCORD_FILES_DIR } from "main/vencordFilesDir";
import { join } from "path";

import { USER_AGENT } from "../constants";
import { Settings, State } from "../settings";
import { downloadFile, fetchie } from "./http";

const API_BASE = "https://api.github.com";

export const FILES_TO_DOWNLOAD = [
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css"
];

export interface ReleaseData {
    name: string;
    tag_name: string;
    html_url: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

export async function githubGet(endpoint: string) {
    const opts: RequestInit = {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": USER_AGENT
        }
    };

    if (process.env.GITHUB_TOKEN) (opts.headers! as any).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    return fetchie(API_BASE + endpoint, opts, { retryOnNetworkError: true });
}

async function fetchLatestRelease(): Promise<ReleaseData> {
    const release = await githubGet("/repos/Vendicated/Vencord/releases/latest");
    return release.json();
}

export async function downloadVencordFiles(release?: ReleaseData) {
    const { assets, tag_name } = release ?? (await fetchLatestRelease());

    await Promise.all(
        assets
            .filter(({ name }) => FILES_TO_DOWNLOAD.some(f => name.startsWith(f)))
            .map(({ name, browser_download_url }) =>
                downloadFile(browser_download_url, join(VENCORD_FILES_DIR, name), {}, { retryOnNetworkError: true })
            )
    );

    State.store.vencordVersion = tag_name;
}

export type VencordUpdateResult =
    | { status: "up-to-date"; version: string }
    | { status: "updated"; from?: string; to: string }
    | { status: "skipped"; reason: string }
    | { status: "error"; error: string };

/**
 * Downloads the newest Vencord release if it is newer than the one on disk.
 * New files take effect on the next launch. Custom Vencord dirs are never touched.
 */
export async function checkVencordUpdate(force = false): Promise<VencordUpdateResult> {
    if (State.store.vencordDir) return { status: "skipped", reason: "custom Vencord directory in use" };
    if (!force && !Settings.store.autoUpdateVencord) return { status: "skipped", reason: "auto update disabled" };

    try {
        const release = await fetchLatestRelease();
        const current = State.store.vencordVersion;

        if (current === release.tag_name) return { status: "up-to-date", version: current };

        await downloadVencordFiles(release);
        console.log(`[VencordLoader] Updated Vencord ${current ?? "(unknown)"} -> ${release.tag_name}`);

        return { status: "updated", from: current, to: release.tag_name };
    } catch (err) {
        console.error("[VencordLoader] Failed to check for Vencord update:", err);
        return { status: "error", error: err instanceof Error ? err.message : String(err) };
    }
}

const existsAsync = (path: string) =>
    access(path, FsConstants.F_OK)
        .then(() => true)
        .catch(() => false);

export async function isValidVencordInstall(dir: string) {
    const results = await Promise.all(FILES_TO_DOWNLOAD.map(f => existsAsync(join(dir, f))));
    return !results.includes(false);
}

export async function ensureVencordFiles() {
    if (await isValidVencordInstall(VENCORD_FILES_DIR)) return;

    mkdirSync(VENCORD_FILES_DIR, { recursive: true });

    await Promise.all([downloadVencordFiles(), writeFile(join(VENCORD_FILES_DIR, "package.json"), "{}")]);
}
