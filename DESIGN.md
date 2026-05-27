---
name: ZipShift
description: Lightweight, client-side transaction file zipping utility.
colors:
  primary: "#4f46e5"
  primary-bank: "#059669"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  text-primary: "#0f172a"
  text-secondary: "#475569"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: "1.2"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
---

# Design System: ZipShift

## 1. Overview

**Creative North Star: "The Airy Ledger"**

ZipShift is designed to feel like a modern, lightweight digital ledger—airy, clean, and professional. It brings structure and calm to the daily operational task of packaging files. By shifting from a dark-themed portal to a light, pastel-accented workspace, it reduces visual strain under typical office ambient lighting. The design emphasizes immediate feedback and zero clutter, keeping the financial operator's focus entirely on their data validation and zipping workflow.

Key Characteristics:
- Calming light-mode slate background with high text contrast for readability.
- Mode-based color styling (soft Indigo/Violet for Merchant Portal, soft Emerald/Teal for Bank Portal).
- Flat-layered layout with clean border lines (1px) and subtle active-state elevation.
- Consistent typography hierarchy using Inter or clean system sans-serif.

## 2. Colors

The color palette is composed of soft, tinted neutrals paired with clear, purposeful primary accents for each mode.

### Primary
- **Merchant Primary Indigo** (#4f46e5): Used for primary action buttons, active tabs, and primary status indicators in Merchant mode.
- **Bank Primary Emerald** (#059669): Used for primary action buttons, active tabs, and primary status indicators in Bank mode.

### Secondary
- **Merchant Accent Violet** (#7c3aed): Secondary accent to highlight key areas in Merchant mode.
- **Bank Accent Teal** (#0d9488): Secondary accent to highlight key areas in Bank mode.

### Neutral
- **Slate Tint Base** (#f8fafc): Page-level background color.
- **Pure White Surface** (#ffffff): Card, panel, and dialog backgrounds.
- **Light Slate Panel** (#f1f5f9): Secondary panel and inactive tab backgrounds.
- **Soft Border** (#e2e8f0): Default border color for elements (1px stroke).
- **Text Primary** (#0f172a): Main body text and titles for optimal reading contrast.
- **Text Secondary** (#475569): Labels, metadata, and supporting text.

### Named Rules
**The One Voice Rule.** The primary accent is used on ≤10% of any given screen. Its rarity is the point, guiding the user's eye to primary actions.
**The Tinted Neutral Rule.** Never use pure black (#000000) or pure grey (#808080) for text or borders. Every neutral must be tinted toward the slate-blue hue.

## 3. Typography

**Display Font:** Inter, system-ui, sans-serif
**Body Font:** Inter, system-ui, sans-serif
**Label/Mono Font:** Fira Code, SFMono-Regular, monospace (for file prefixes and date codes)

### Hierarchy
- **Display** (800, 1.875rem (30px), 1.2): Main page headers and branding.
- **Headline** (700, 1.25rem (20px), 1.3): Major panel sections and action areas.
- **Title** (600, 1.125rem (18px), 1.4): Package cards and secondary panels.
- **Body** (400, 0.875rem (14px), 1.5): Standard paragraphs, file list items, and descriptions. Max line length 65–75ch.
- **Label** (500, 0.75rem (12px), 1.2): Input labels, badges, status pill text, and metadata.

## 4. Elevation

ZipShift relies on a flat-by-default visual strategy. Depth is communicated primarily through clean 1px borders and distinct background colors rather than heavy drop shadows.

### Shadow Vocabulary
- **Active Focus Shadow** (`0 4px 12px rgba(15, 23, 42, 0.05)`): Applied only during active interaction, such as hovering over dropzones, active panels, or buttons.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to active states (hover, focus) or transient alerts to highlight interactivity.

## 5. Components

### Buttons
- **Shape:** Rounded corners (8px radius).
- **Primary:** Background color uses the mode's primary color, white text. Padding is 10px 20px.
- **Hover / Focus:** Transitions standard 150ms. Background darkens to primary-hover; focus adds a 2px outline of the primary color with 2px offset.
- **Secondary:** Background color is light neutral panel (#f1f5f9), text is text-primary (#0f172a).

### Cards / Containers
- **Corner Style:** Rounded corners (8px radius).
- **Background:** White surface (#ffffff).
- **Shadow Strategy:** Flat at rest with 1px border (#e2e8f0). Active shadow applied only on hover.
- **Border:** 1px solid #e2e8f0.
- **Internal Padding:** 24px (1.5rem).

### Inputs / Fields
- **Style:** Background white, border 1px solid #cbd5e1, rounded corners (6px).
- **Focus:** Border shifts to primary color with a subtle 2px primary glow ring.
- **Error:** Border shifts to warning red, background becomes soft red tint.

### Navigation
- **Style:** Capsule switcher shape. Rounded 9999px.
- **Tabs:** Light slate background (#f1f5f9) with 4px padding. Inactive tabs use text-secondary, active tab matches the mode's primary color with white text.

## 6. Do's and Don'ts

### Do:
- **Do** use clear visual feedback for all drag-and-drop actions, displaying exact file counts and sizes.
- **Do** highlight that no data leaves the browser ("100% client-side security" indicator).
- **Do** ensure all interactive elements support full keyboard focus outlines for accessibility.

### Don't:
- **Don't** use border-left or border-right greater than 1px as a colored stripe on cards or list items.
- **Don't** use dark mode or dark purple/blue gradients as defaults. Keep the interface light, airy, and friendly.
- **Don't** use glassmorphism or blur filters as background decorations. Keep borders crisp and solid.
- **Don't** use nested cards. If a list of files is inside a package, use a clean, flat table layout inside the package block.
