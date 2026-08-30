/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Heading, Margins, Paragraph } from "@vencord/types/components";
import { Modal, openModal, TextInput, useState } from "@vencord/types/webpack/common";
import { localStorage } from "renderer/utils";

import { cl, SettingsComponent } from "./Settings";

// Discord tokens are base64 user id . base64 timestamp . hmac. Anything with whitespace or quotes is wrong.
const TOKEN_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

export function isPlausibleToken(token: string) {
    return TOKEN_PATTERN.test(token);
}

/**
 * Discord reads its token from localStorage on startup. Writing it there and reloading
 * logs the client in as that account without going through the login form.
 */
export function loginWithToken(token: string) {
    localStorage.setItem("token", JSON.stringify(token));
    location.reload();
}

export const TokenLoginButton: SettingsComponent = () => {
    return (
        <div>
            <Heading tag="h5">Account</Heading>
            <Paragraph className={Margins.bottom8}>
                Log into a different account with a token instead of email and password. The current session is
                replaced.
            </Paragraph>
            <div className={cl("button-grid")}>
                <Button onClick={openTokenLoginModal}>Login with Token</Button>
            </div>
        </div>
    );
};

function openTokenLoginModal() {
    openModal(props => <TokenLoginModal {...props} />);
}

function TokenLoginModal(props: { onClose(): void; transitionState: any }) {
    const [token, setToken] = useState("");
    const [showToken, setShowToken] = useState(false);

    const trimmed = token.trim();
    const error = trimmed && !isPlausibleToken(trimmed) ? "That does not look like a Discord token" : undefined;

    return (
        <Modal {...props} size="md" title="Login with Token">
            <Paragraph className={Margins.bottom8}>
                Never share your token. Anyone who has it has full access to your account.
            </Paragraph>
            <TextInput
                type={showToken ? "text" : "password"}
                placeholder="Paste token"
                value={token}
                onChange={setToken}
                error={error}
                autoFocus
                spellCheck={false}
                autoComplete="off"
            />
            <div className={cl("button-grid")}>
                <Button variant="secondary" onClick={() => setShowToken(s => !s)}>
                    {showToken ? "Hide" : "Show"} Token
                </Button>
                <Button
                    disabled={!trimmed || !!error}
                    onClick={() => {
                        props.onClose();
                        loginWithToken(trimmed);
                    }}
                >
                    Login
                </Button>
            </div>
        </Modal>
    );
}
