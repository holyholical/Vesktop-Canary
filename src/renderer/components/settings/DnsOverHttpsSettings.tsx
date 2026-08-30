/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading, Margins, Paragraph } from "@vencord/types/components";
import { Select, TextInput } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./shared";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";

const CUSTOM = "custom";

const DOH_PRESETS = [
    { label: "Quad9", value: "https://dns.quad9.net/dns-query" },
    { label: "Cloudflare", value: "https://cloudflare-dns.com/dns-query" },
    { label: "Mullvad", value: "https://dns.mullvad.net/dns-query" },
    { label: "Google", value: "https://dns.google/dns-query" },
    { label: "Custom", value: CUSTOM }
];

function isPreset(server: string) {
    return DOH_PRESETS.some(p => p.value === server && p.value !== CUSTOM);
}

export const DnsOverHttpsSettings: SettingsComponent = ({ settings }) => {
    const doh = settings.dnsOverHttps;
    const selected = isPreset(doh.server) ? doh.server : CUSTOM;
    const isValid = !doh.server || /^https:\/\/\S+$/.test(doh.server);

    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5">DNS over HTTPS</Heading>
                <Paragraph className={Margins.bottom8}>
                    Resolve hostnames through an encrypted DoH resolver instead of your system DNS. Applies immediately.
                </Paragraph>

                <VesktopSettingsSwitch
                    title="Use DNS over HTTPS"
                    description="Hides which hosts Vesktop connects to from your local network and ISP resolver"
                    value={doh.enabled}
                    onChange={v => (doh.enabled = v)}
                />

                <Select
                    className={Margins.top8}
                    options={DOH_PRESETS}
                    closeOnSelect={true}
                    select={v => (doh.server = v === CUSTOM ? "" : v)}
                    isSelected={v => v === selected}
                    serialize={s => s}
                />

                {selected === CUSTOM && (
                    <TextInput
                        className={Margins.top8}
                        placeholder="https://example.com/dns-query"
                        value={doh.server}
                        onChange={v => (doh.server = v.trim())}
                        error={isValid ? undefined : "Must be an https:// URL"}
                        spellCheck={false}
                    />
                )}
            </div>
        </SimpleErrorBoundary>
    );
};
