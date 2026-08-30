/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Heading, Margins, Paragraph } from "@vencord/types/components";
import { Toasts, useState } from "@vencord/types/webpack/common";

import { cl, SettingsComponent } from "./shared";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";

export const VencordUpdater: SettingsComponent = ({ settings }) => {
    const [isChecking, setIsChecking] = useState(false);

    const check = async () => {
        setIsChecking(true);
        try {
            const res = await VesktopNative.vencord.checkUpdate();
            const message = {
                "up-to-date": () => `Vencord ${res.status === "up-to-date" ? res.version : ""} is up to date`,
                updated: () =>
                    `Updated Vencord to ${res.status === "updated" ? res.to : ""}. Fully restart Vesktop to apply.`,
                skipped: () => `Skipped: ${res.status === "skipped" ? res.reason : ""}`,
                error: () => `Update failed: ${res.status === "error" ? res.error : ""}`
            }[res.status]();

            Toasts.show({
                id: Toasts.genId(),
                type: res.status === "error" ? Toasts.Type.FAILURE : Toasts.Type.SUCCESS,
                message
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div>
            <Heading tag="h5">Vencord Updates</Heading>
            <Paragraph className={Margins.bottom8}>
                Vesktop downloads the newest Vencord release in the background. Updates apply on the next launch.
            </Paragraph>
            <VesktopSettingsSwitch
                title="Auto Update Vencord"
                description="Check for a new Vencord release every time Vesktop starts"
                value={settings.autoUpdateVencord}
                onChange={v => (settings.autoUpdateVencord = v)}
            />
            <div className={cl("button-grid")}>
                <Button onClick={check} disabled={isChecking}>
                    {isChecking ? "Checking…" : "Check for Vencord Update"}
                </Button>
            </div>
        </div>
    );
};
