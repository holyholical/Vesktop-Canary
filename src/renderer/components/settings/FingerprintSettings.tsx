/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading, Margins, Paragraph } from "@vencord/types/components";
import { TextInput } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

const TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

const realTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const realLocale = navigator.language;

export const FingerprintSettings: SettingsComponent = ({ settings }) => {
    const tzError =
        settings.spoofTimezone && !TIMEZONE_PATTERN.test(settings.spoofTimezone)
            ? "Use an IANA name like Europe/Berlin or UTC"
            : undefined;
    const localeError =
        settings.spoofLocale && !LOCALE_PATTERN.test(settings.spoofLocale) ? "Use a BCP 47 tag like en-US" : undefined;

    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5">Timezone</Heading>
                <Paragraph className={Margins.bottom8}>
                    Discord reads your timezone through the browser. Leave empty to use the real one ({realTimezone}).
                    Requires a full restart.
                </Paragraph>
                <TextInput
                    placeholder="UTC"
                    value={settings.spoofTimezone}
                    onChange={v => (settings.spoofTimezone = v.trim())}
                    error={tzError}
                    spellCheck={false}
                />

                <Heading tag="h5" className={Margins.top16}>
                    Locale
                </Heading>
                <Paragraph className={Margins.bottom8}>
                    Sent to Discord as your system locale and in Accept-Language. Leave empty to use the real one (
                    {realLocale}). Requires a full restart.
                </Paragraph>
                <TextInput
                    placeholder="en-US"
                    value={settings.spoofLocale}
                    onChange={v => (settings.spoofLocale = v.trim())}
                    error={localeError}
                    spellCheck={false}
                />
            </div>
        </SimpleErrorBoundary>
    );
};
