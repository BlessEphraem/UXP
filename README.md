# 📜 UXP Scripts — for Adobe Premiere Pro

> A collection of personal **UXP scripts for Adobe Premiere Pro**, covering automation, export utilities, timeline manipulation, and more.

These scripts are plain `.jsx` files targeting the `premierepro` UXP API. They can be executed by **any UXP-capable script runner** — no specific plugin required. That said, they were designed and tested with my personnal [**JSX Runner**](https://github.com/BlessEphraem/JSX-Runner) plugin, which is the recommended way to use them (It's free and Open-Source).

---

## 📋 Prerequisites

- **Adobe Premiere Pro 25.6.1 or later**, or a **Beta version** with UXP plugin support enabled. Earlier versions do not support UXP plugins and are not compatible.
- A UXP Plugin script runner, you can download and install my plugin. See [JSX Runner](https://github.com/BlessEphraem/JSX-Runner)

> ⚠️ These scripts use the `premierepro` UXP module. They will **not** work in older ExtendScript (.jsx legacy) runners or in Premiere Pro versions prior to 25.6.1.

---

## 📂 Scripts

### 📸 `Screenshot.jsx`

Captures the **current frame** from the active sequence's Program Monitor and saves it as a PNG, JPG, or TIF file.

- Automatically generates a timestamped filename (`Screenshot_YYYY-MM-DD_a_HHhMMmSSs.png`)
- Opens a native OS save dialog so you can choose the destination
- Exports at the sequence's **native resolution**
- Handles both Windows (`\`) and macOS (`/`) path separators

### 🪦 `UnNest.jsx` — *Grave Robber v12.1*

**Extracts and flattens nested sequences** (and merged clips) back into the main timeline, in place.

Select one or more nested sequence clips on your timeline and run this script. It will:

- Scan the contents of each nested sequence
- Mathematically re-calculate the correct position of every inner clip relative to the main timeline
- Detect and resolve **track collisions** automatically before placing clips
- Delete the nest containers and **clone all inner clips** directly onto the main timeline

This is a full extraction engine — it handles multi-track nests, audio/video offsets, and collision avoidance in a single pass.

> ⚠️ This script is destructive (it removes the nest and replaces it). Make sure your project is saved before running.

### 🎞️ `Retrieve_Effects.jsx`

Exports the **full list of effects and transitions** available in your Premiere Pro installation to a file named `Effects.data`.

The output is formatted with category prefixes for easy parsing:

| Prefix | Content |
|---|---|
| `[FX_V]` | Video effects (display names) |
| `[FX_A]` | Audio effects (display names) |
| `[TR_V]` | Video transitions (display names, cleaned of internal Adobe prefixes) |
| `[TR_A]` | Audio transitions *(reserved — not yet exposed by the UXP API)* |

Useful for building preset databases, documentation, or tooling that needs to reference Premiere effects by name.

### 🔩 `Retrieve_Effects_BRUT.jsx`

Same as `Retrieve_Effects.jsx`, but exports **raw internal match names** instead of display names — useful for scripting and automation where you need Premiere's internal identifiers.

> ⚠️ Note: Audio effects still use display names due to a current limitation of the UXP API (`getMatchNames()` is not yet available for `AudioFilterFactory`).

---

## ➕ Contributing

Feel free to open a PR to add your own UXP scripts! Please follow the existing naming and comment conventions, and include a short description of what the script does at the top of the file.

---

## 📄 License

GPL-3.0 license — see [LICENSE](LICENSE) for details.