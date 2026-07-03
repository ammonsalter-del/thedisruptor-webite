# Security Policy

## Overview

The Disruptor is a client-side educational game that runs entirely in the browser. It does not collect, transmit, or store personal data, and has no server-side components, databases, or authentication systems.

## Scope

Because the game is a single HTML file with no backend, the attack surface is minimal. There are no user accounts, no stored credentials, and no network requests to game servers.

The game does include:
- An optional Google Drive iframe for viewing the case study PDF
- Links to external resources (Creative Commons, GitHub)

## The CEO Reflection Tool (Katrien)

The game links to an optional reflection tool built on Claude artefacts, in which players can discuss their end-of-game report with the fictional CEO. Using it requires a free Claude account, and the player chooses to upload their own report PDF to Claude (Anthropic). The game itself transmits nothing; anything shared with the tool is governed by Anthropic's terms and privacy policy, and players who prefer not to upload their report can simply skip the tool.

## For University IT and Data Protection Teams

The Disruptor processes **no personal data at all**: no accounts, no logins, no cookies, no analytics, no data transmitted to game servers (there are none). Game state exists only in the player's browser. Under GDPR there is nothing to assess — no personal data is collected, so no consent banner, DPIA, or processor agreement is needed. The full source code is public in this repository, so every claim can be verified by inspection. Institutions preferring zero network activity can download the HTML file and run it locally.

The one point of judgement is the optional Katrien reflection tool described above: a student who chooses to use it uploads their own game report to Claude under their own free account, in the same way they might paste text into any AI assistant. The game transmits nothing itself, and the tool is entirely skippable.

## Reporting a Vulnerability

If you discover a security issue — for example, a cross-site scripting (XSS) vulnerability in the HTML, or a problem with how external content is loaded — please report it responsibly.

**Email**: ammon.salter@wbs.ac.uk

Please include:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional but appreciated)

We will acknowledge receipt within 7 days and aim to address confirmed vulnerabilities promptly.

## What This Policy Does Not Cover

- Vulnerabilities in browsers, operating systems, or third-party services (Google Drive, GitHub Pages)
- Issues arising from user modifications to the source code
- Gameplay bugs (please use the bug report issue template for those)

Thank you for helping keep this project safe.
