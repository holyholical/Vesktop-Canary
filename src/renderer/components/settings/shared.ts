/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2026 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@vencord/types/api/Styles";
import { ComponentType } from "react";
import type { Settings } from "renderer/settings";

// Kept out of Settings.tsx so individual setting components can be imported
// (e.g. by patches) without pulling in the whole settings page and creating an import cycle.

export const cl = classNameFactory("vcd-settings-");

export type SettingsComponent = ComponentType<{ settings: typeof Settings.store }>;
