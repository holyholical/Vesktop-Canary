/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openTokenLoginModal } from "renderer/components/settings/TokenLogin";

// Adds a "Log In with Token" button under Discord's login form, since Vesktop's settings
// (where token login also lives) are only reachable once you are already logged in.

const MARKER = "data-vcd-token-login";
const LOGIN_PATH = "/login";

function inject() {
    if (location.pathname !== LOGIN_PATH) return;
    if (document.querySelector(`[${MARKER}]`)) return;

    const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]');
    if (!submit) return;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(MARKER, "");
    button.className = submit.className;
    button.textContent = "Log In with Token";
    button.style.marginTop = "8px";
    button.style.height = `${submit.offsetHeight}px`;
    button.addEventListener("click", e => {
        e.preventDefault();
        openTokenLoginModal();
    });

    submit.insertAdjacentElement("afterend", button);
}

let scheduled = false;
const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
        scheduled = false;
        inject();
    });
});

// this script runs at document-start, before <html> exists
function start() {
    if (!document.documentElement) {
        setTimeout(start, 0);
        return;
    }
    observer.observe(document.documentElement, { childList: true, subtree: true });
    inject();
}

start();
