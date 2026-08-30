/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading, Margins, Paragraph } from "@vencord/types/components";
import { Select } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./shared";

export const ClientSpoofPicker: SettingsComponent = ({ settings }) => {
    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5">Client Type</Heading>
                <Paragraph className={Margins.bottom8}>
                    What Discord and other users (platform indicator: desktop, mobile, web) see you connecting from.
                    Desktop uses the platform above. Requires a full restart.
                </Paragraph>
                <Select
                    placeholder="Web (default)"
                    options={[
                        { label: "Web (what Vesktop naturally reports)", value: "web", default: true },
                        { label: "Desktop app", value: "desktop" },
                        { label: "Mobile (Android)", value: "android" },
                        { label: "Mobile (iOS)", value: "ios" }
                    ]}
                    closeOnSelect={true}
                    select={v => (settings.clientSpoof = v)}
                    isSelected={v => v === settings.clientSpoof}
                    serialize={s => s}
                />
            </div>
        </SimpleErrorBoundary>
    );
};
