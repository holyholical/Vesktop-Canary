/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading, Margins, Paragraph } from "@vencord/types/components";
import { Select } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

export const PlatformSpoofPicker: SettingsComponent = ({ settings }) => {
    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5">Platform</Heading>
                <Paragraph className={Margins.bottom8}>
                    Which operating system Discord should see. Changes the user agent, client hints and
                    navigator.platform. Requires a full restart.
                </Paragraph>
                <Select
                    placeholder="Automatic"
                    options={[
                        { label: "Automatic (real platform)", value: "auto", default: true },
                        { label: "Windows", value: "windows" },
                        { label: "macOS", value: "darwin" },
                        { label: "Linux", value: "linux" }
                    ]}
                    closeOnSelect={true}
                    select={v => (settings.platformSpoof = v)}
                    isSelected={v => v === settings.platformSpoof}
                    serialize={s => s}
                />
            </div>
        </SimpleErrorBoundary>
    );
};
