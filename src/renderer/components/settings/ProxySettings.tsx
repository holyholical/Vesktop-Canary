/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Heading, Margins, Paragraph } from "@vencord/types/components";
import { TextInput, Toasts, useState } from "@vencord/types/webpack/common";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { cl, SettingsComponent } from "./Settings";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";

const PROXY_URL_PATTERN = /^(https?|socks[45]?):\/\/\S+$/i;

function validateProxyUrl(url: string) {
    if (!url) return undefined;
    if (!PROXY_URL_PATTERN.test(url))
        return "Expected scheme://[user:pass@]host:port with http, https, socks4 or socks5";
    return undefined;
}

export const ProxySettings: SettingsComponent = ({ settings }) => {
    const { proxy } = settings;
    const [isTesting, setIsTesting] = useState(false);

    const urlError = validateProxyUrl(proxy.url);

    const test = async () => {
        setIsTesting(true);
        try {
            const res = await VesktopNative.proxy.test();
            Toasts.show({
                id: Toasts.genId(),
                type: res.ok ? Toasts.Type.SUCCESS : Toasts.Type.FAILURE,
                message: res.ok ? `Discord reachable in ${res.ms}ms` : `Connection failed: ${res.error}`
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <SimpleErrorBoundary>
            <div>
                <Heading tag="h5">Proxy</Heading>
                <Paragraph className={Margins.bottom8}>
                    Route all of Vesktop's traffic (including voice, if the proxy supports UDP) through a proxy.
                    Credentials can be embedded in the URL. Applies immediately.
                </Paragraph>

                <VesktopSettingsSwitch
                    title="Use Proxy"
                    description="Disable to use your system proxy settings"
                    value={proxy.enabled}
                    onChange={v => (proxy.enabled = v)}
                />

                <TextInput
                    placeholder="socks5://127.0.0.1:9050"
                    value={proxy.url}
                    onChange={v => (proxy.url = v.trim())}
                    error={urlError}
                    spellCheck={false}
                    className={Margins.top8}
                />

                <Heading tag="h5" className={Margins.top16}>
                    Bypass Rules
                </Heading>
                <Paragraph className={Margins.bottom8}>
                    Comma separated hosts that should skip the proxy. &lt;local&gt; matches localhost and private
                    addresses.
                </Paragraph>
                <TextInput
                    placeholder="<local>"
                    value={proxy.bypassRules}
                    onChange={v => (proxy.bypassRules = v)}
                    spellCheck={false}
                />

                <div className={cl("button-grid")}>
                    <Button onClick={test} disabled={isTesting || !proxy.enabled || !proxy.url || !!urlError}>
                        {isTesting ? "Testing…" : "Test Connection"}
                    </Button>
                </div>
            </div>
        </SimpleErrorBoundary>
    );
};
