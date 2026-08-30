/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Re-applies Vesktop-Canary branding to package.json after an upstream merge.
 * Upstream owns everything else in the file; only these fields differ.
 * Run: pnpm applyBranding (the upstream sync workflow runs it automatically).
 */

import { readFileSync, writeFileSync } from "fs";

const FILE = "package.json";

const pkg = JSON.parse(readFileSync(FILE, "utf8"));

const branded = {
    ...pkg,
    name: "vesktop-canary",
    author: "holyholical",
    repository: "github:holyholical/Vesktop-Canary",
    build: {
        ...pkg.build,
        appId: "dev.vencord.vesktop-canary",
        productName: "Vesktop-Canary",
        executableName: "vesktop-canary",
        publish: { provider: "github", owner: "holyholical", repo: "Vesktop-Canary" },
        linux: {
            ...pkg.build.linux,
            desktop: {
                ...pkg.build.linux?.desktop,
                entry: {
                    ...pkg.build.linux?.desktop?.entry,
                    Name: "Vesktop-Canary",
                    StartupWMClass: "vesktop-canary"
                }
            }
        }
    }
};

const output = JSON.stringify(branded, null, 4) + "\n";
if (output === readFileSync(FILE, "utf8")) {
    console.log("package.json already branded");
} else {
    writeFileSync(FILE, output);
    console.log("Applied Vesktop-Canary branding to package.json");
}
