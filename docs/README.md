---
title: Overview
nav_order: 1
permalink: /
---

# Transcriber — User Guide

Transcriber converts images in your Obsidian vault to Markdown using Ollama vision models running locally on your machine. No data leaves your computer.

## Key features

- Transcribe individual images, entire folders, or all images embedded in a note
- Output `.md` files are created alongside source images
- Install, select, and remove AI models directly from the command palette — no terminal needed
- Configurable vision model and transcription prompt
- Progress notifications for batch operations
- No cloud dependency — everything runs locally via Ollama

## Prerequisites

- **Desktop Obsidian** — this plugin is desktop-only (it requires a local Ollama server)
- **[Ollama](https://ollama.com/)** — installed and running on your machine

## Quick start

1. Install the plugin from **Settings > Community plugins** and enable it
2. Ensure [Ollama](https://ollama.com/) is running
3. Open **Settings > Transcriber** and click **Test** to verify the connection
4. Install a model: open the command palette (Ctrl/Cmd+P) and run **Install AI model**, or install from settings
5. Right-click an image in the file explorer and select **Transcribe image**

## Further reading

- [Usage](usage.md) — commands, context menu actions, and workflows
- [Configuration](configuration.md) — all settings explained
- [Tips](tips.md) — model recommendations, performance, and troubleshooting
- [Release notes](release-notes.md) — version history

## About

Created by [Sébastien Dubois](https://dsebastien.net).
