/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * The Electron binary from npm is linked against glibc and segfaults in ld.so on musl systems
 * (Alpine, Gentoo musl, Void musl, Chimera). Alpine builds Electron against musl, so this script
 * downloads Alpine's package plus whichever of its shared libraries the host does not provide
 * (or provides without the symbols Chromium needs) into .electron-musl/ and writes a launcher.
 *
 * Usage: pnpm setup:musl, then pnpm start:musl
 */

import { execFileSync } from "child_process";
import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const ALPINE_MIRROR = "https://dl-cdn.alpinelinux.org/alpine/edge";
const REPOS = ["main", "community", "testing"] as const;
const ARCH = "x86_64";

const OUT_DIR = resolve(".electron-musl");
const APK_DIR = join(OUT_DIR, "apks");
const LIB_DIR = join(OUT_DIR, "lib");
const ELECTRON_DIR = join(OUT_DIR, "electron");
const ELECTRON_BIN = join(ELECTRON_DIR, "usr/lib/electron/electron");
const LAUNCHER = join(OUT_DIR, "electron.sh");

/**
 * Libraries the host may provide under the same soname but built without symbols Chromium/Node need
 * (Alpine patches ffmpeg for Chromium; libxml2 ABI differs between 2.13 and 2.15). Always use Alpine's.
 */
const ALWAYS_FROM_ALPINE = ["libavcodec.so", "libavformat.so", "libavutil.so", "libxml2.so", "libxslt.so"];

const MAX_ROUNDS = 20;

type Repo = (typeof REPOS)[number];
interface Pkg {
    repo: Repo;
    name: string;
    version: string;
}

function isMusl() {
    try {
        const out = execFileSync("ldd", ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        return out.includes("musl");
    } catch (err: any) {
        // musl's ldd exits non-zero for --version but still prints its banner
        return String(err.stdout ?? "").includes("musl") || String(err.stderr ?? "").includes("musl");
    }
}

async function download(url: string, dest: string) {
    if (existsSync(dest)) return;
    console.log("  fetching", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function loadIndex() {
    const bySoname = new Map<string, Pkg>();
    const byName = new Map<string, Pkg>();

    for (const repo of REPOS) {
        const dest = join(APK_DIR, `APKINDEX.${repo}.tar.gz`);
        await download(`${ALPINE_MIRROR}/${repo}/${ARCH}/APKINDEX.tar.gz`, dest);
        const index = execFileSync("tar", ["xzf", dest, "-O", "APKINDEX"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

        for (const block of index.split("\n\n")) {
            const fields = new Map(block.split("\n").map(l => [l.slice(0, 1), l.slice(2)] as const));
            const name = fields.get("P");
            const version = fields.get("V");
            if (!name || !version) continue;

            const pkg: Pkg = { repo, name, version };
            byName.set(name, byName.get(name) ?? pkg);

            for (const prov of (fields.get("p") ?? "").split(" ")) {
                if (!prov.startsWith("so:")) continue;
                const soname = prov.slice(3).split("=")[0];
                if (!bySoname.has(soname)) bySoname.set(soname, pkg);
            }
        }
    }

    return { bySoname, byName };
}

async function fetchApk({ repo, name, version }: Pkg) {
    const dest = join(APK_DIR, `${name}-${version}.apk`);
    await download(`${ALPINE_MIRROR}/${repo}/${ARCH}/${name}-${version}.apk`, dest);
    return dest;
}

/** Extracts every shared object from an apk flat into LIB_DIR */
function extractLibs(apk: string) {
    const list = execFileSync("tar", ["tzf", apk], { encoding: "utf8" })
        .split("\n")
        .filter(f => /^(usr\/)?lib\/[^/]+\.so(\.|$)/.test(f));
    if (!list.length) return;

    execFileSync("tar", ["xzf", apk, "-C", LIB_DIR, "--strip-components=2", "--warning=no-unknown-keyword", ...list], {
        stdio: "inherit"
    });
}

function findMissing() {
    const objects = [ELECTRON_BIN, ...readdirSync(LIB_DIR).map(f => join(LIB_DIR, f))];
    let output = "";
    try {
        output = execFileSync("ldd", objects, {
            encoding: "utf8",
            env: { ...process.env, LD_LIBRARY_PATH: LIB_DIR },
            stdio: ["ignore", "pipe", "pipe"],
            maxBuffer: 64 * 1024 * 1024
        });
    } catch (err: any) {
        output = String(err.stdout ?? "") + String(err.stderr ?? "");
    }

    const libs = new Set([...output.matchAll(/Error loading shared library (\S+):/g)].map(m => m[1]));
    const symbols = new Set([...output.matchAll(/Error relocating \S+: (\S+): symbol not found/g)].map(m => m[1]));
    return { libs, symbols };
}

function writeLauncher() {
    writeFileSync(
        LAUNCHER,
        `#!/bin/sh
# Generated by scripts/musl/setupElectron.mts - runs Alpine's musl Electron with its bundled libraries
export LD_LIBRARY_PATH="${LIB_DIR}\${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "${ELECTRON_BIN}" "$@"
`
    );
    chmodSync(LAUNCHER, 0o755);
}

async function main() {
    if (process.platform !== "linux" || !isMusl()) {
        console.error("This script is only for musl-based Linux systems. Use `pnpm start` elsewhere.");
        process.exit(1);
    }

    for (const dir of [APK_DIR, LIB_DIR, ELECTRON_DIR]) mkdirSync(dir, { recursive: true });

    console.log("Loading Alpine package index...");
    const { bySoname, byName } = await loadIndex();

    const electronPkg = byName.get("electron");
    if (!electronPkg) throw new Error("Alpine does not currently ship an electron package");
    console.log(`Using Alpine electron ${electronPkg.version} (${electronPkg.repo})`);

    if (!existsSync(ELECTRON_BIN)) {
        const apk = await fetchApk(electronPkg);
        execFileSync("tar", ["xzf", apk, "-C", ELECTRON_DIR, "--warning=no-unknown-keyword"], { stdio: "inherit" });
    }

    for (const prefix of ALWAYS_FROM_ALPINE) {
        const soname = [...bySoname.keys()].find(s => s.startsWith(prefix + "."));
        if (soname) extractLibs(await fetchApk(bySoname.get(soname)!));
    }

    for (let round = 1; round <= MAX_ROUNDS; round++) {
        const { libs, symbols } = findMissing();
        console.log(`Round ${round}: ${libs.size} missing libraries, ${symbols.size} unresolved symbols`);
        if (!libs.size) {
            if (symbols.size) {
                console.error("Unresolved symbols remain. Add the providing library to ALWAYS_FROM_ALPINE:");
                console.error("  " + [...symbols].slice(0, 20).join("\n  "));
                process.exit(1);
            }
            break;
        }

        for (const soname of libs) {
            const pkg = bySoname.get(soname);
            if (!pkg) throw new Error(`No Alpine package provides ${soname}`);
            extractLibs(await fetchApk(pkg));
        }
    }

    writeLauncher();

    const version = execFileSync(LAUNCHER, ["--version"], { encoding: "utf8" }).trim();
    console.log(`\nDone. ${version} runs on this system. Start Vesktop with: pnpm start:musl`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
