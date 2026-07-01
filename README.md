# Nexus Forge

> *Forge your path to seamless, powerful gaming experiences.*

![JSON](https://img.shields.io/badge/JSON-000000.svg?style=flat-square&logo=JSON&logoColor=white)  ![electronbuilder](https://img.shields.io/badge/electronbuilder-000000.svg?style=flat-square&logo=electron-builder&logoColor=white)  ![npm](https://img.shields.io/badge/npm-CB3837.svg?style=flat-square&logo=npm&logoColor=white)  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat-square&logo=JavaScript&logoColor=black)  ![Electron](https://img.shields.io/badge/Electron-47848F.svg?style=flat-square&logo=Electron&logoColor=white)  ![GitHub%20Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF.svg?style=flat-square&logo=GitHub-Actions&logoColor=white)  ![CSS](https://img.shields.io/badge/CSS-663399.svg?style=flat-square&logo=CSS&logoColor=white)

## Overview

Nexus Forge is an Electron-based game launcher with a glass-morphism UI. It provides a production-ready framework for building modern game management tools with secure architecture, automated workflows, and desktop integration.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

---

## Features

|      | Component       | Details                                                                                                                                                                                                                                                                                                                                                                                              |
| :--- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚙️  | **Architecture**  | <ul><li>**Desktop Application** built with **Electron** (Node.js + Chromium).</li><li>**Installer-based deployment** indicated by `installer.nsh` (Nullsoft Scriptable Install System).</li><li>**Static Frontend** using standard web stack: `html`, `css`, `javascript`.</li></ul>                                                                                                                      |
| 🔩 | **Code Quality**  | <ul><li>**Dependency Management** via `npm` (`package.json`, `package-lock.json`).</li><li>**Version Pinning** ensured by `package-lock.json`.</li><li>**Project Metadata** centralized in `version.json`.</li></ul>                                                                                                                                                                                   |
| 📄 | **Documentation** | <ul><li>**License** file present for legal clarity.</li><li>**No explicit** `README.md` or detailed technical docs indicated in context.</li><li>**In-code documentation** (JSDoc/comments) not verifiable from provided data.</li></ul>                                                                                                                                                               |
| 🔌 | **Integrations**  | <ul><li>**CI/CD Pipeline** via **GitHub Actions** (`.github/workflows/release.yml`).</li><li>**Native File System Integration** for extracting file icons (`extract-file-icon`).</li><li>**Automated Build & Release** using `electron-builder`.</li></ul>                                                                                                                                             |
| 🧩 | **Modularity**    | <ul><li>**Modular by Stack**: Clear separation of concerns (backend/Electron main process, frontend/renderer process).</li><li>**Dependency-based modularity** via `npm` packages.</li><li>**Asset Organization**: Separate directories for `css` and `html`.</li></ul>                                                                                                                                |
| ⚡️  | **Performance**   | <ul><li>**Native Performance**: Leverages Electron for near-native execution.</li><li>**Bundled Assets**: Static frontend files are packaged with the app.</li><li>**Asynchronous I/O** inherent from Node.js runtime.</li></ul>                                                                                                                                                                       |

---

## Project Structure

```
└── Nexus Forge/
    ├── .github
    │   └── workflows
    ├── assets
    │   ├── generate-icon-bmp.js
    │   ├── generate-icon.js
    │   ├── nexus-forge-nsis.ico
    │   ├── nexus-forge.ico
    │   ├── preview.png
    │   ├── tray-icon.png
    │   └── video
    ├── build
    │   └── installer.nsh
    ├── LICENSE
    ├── main.js
    ├── package-lock.json
    ├── package.json
    ├── preload.js
    ├── README.md
    ├── renderer
    │   ├── index.html
    │   ├── main.css
    │   └── renderer.js
    ├── updater
    │   └── updater.js
    └── version.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+ / Node.js 18+ *(depending on the stack above)*

### Installation

```sh
git clone "https://github.com/danilcenkodanil89-cpu/Nexus Forge"
cd "Nexus Forge"
npm install
```

### Usage

```sh
npm start
```

---

## Contributing

- [Report Issues](https://github.com/danilcenkodanil89-cpu/Nexus Forge/issues)
- [Submit Pull Requests](https://github.com/danilcenkodanil89-cpu/Nexus Forge/pulls)
- [Discussions](https://github.com/danilcenkodanil89-cpu/Nexus Forge/discussions)

---

## License

Distributed under the [AGPL-3.0](LICENSE) license.
