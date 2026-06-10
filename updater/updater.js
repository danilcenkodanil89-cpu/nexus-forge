const { dialog, shell } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const versionPath = path.join(__dirname, '..', 'version.json');

const UPDATE_URL = 'https://api.github.com/repos';

class Updater {
    constructor() {
        this.currentVersion = '1.0.0';
        this.repo = '';
        this.checkInterval = 3600000;
        this.updateAvailable = false;
        this.downloadUrl = '';
        this.latestVersion = '';

        this.loadConfig();
    }

    loadConfig() {
        try {
            const config = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

            this.currentVersion = config.version;
            this.repo = config.githubRepo;
            this.checkInterval = config.updateCheckInterval || 3600000;
        } catch (e) {
            console.error('Failed to load version config:', e);
        }
    }

    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const a = parts1[i] || 0;
            const b = parts2[i] || 0;

            if (a > b) return 1;
            if (a < b) return -1;
        }

        return 0;
    }

    async checkForUpdates(silent = false) {
        if (!this.repo) {
            console.log('GitHub repo not configured');

            return { hasUpdate: false };
        }

        return new Promise((resolve) => {
            const options = {
                hostname: 'api.github.com',
                path: `/repos/${this.repo}/releases/latest`,
                method: 'GET',
                headers: {
                    'User-Agent': 'Nexus-Forge-Updater',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const release = JSON.parse(data);

                        if (release.message === 'Not Found') {
                            if (!silent) console.log('Release not found');

                            resolve({ hasUpdate: false });

                            return;
                        }

                        this.latestVersion = release.tag_name.replace(/^v/, '');

                        const comparison = this.compareVersions(this.latestVersion, this.currentVersion);

                        if (comparison > 0) {
                            this.updateAvailable = true;

                            const asset = release.assets.find(a =>
                                a.name.endsWith('.exe') && a.name.includes('win')
                            ) || release.assets.find(a => a.name.endsWith('.exe'));

                            this.downloadUrl = asset ? asset.browser_download_url : release.html_url;

                            if (!silent) this.showUpdateDialog(release);

                            resolve({
                                hasUpdate: true,
                                version: this.latestVersion,
                                url: this.downloadUrl,
                                releaseNotes: release.body
                            });
                        } else {
                            if (!silent) console.log('No updates available');

                            resolve({ hasUpdate: false });
                        }
                    } catch (e) {
                        console.error('Failed to parse release:', e);

                        resolve({ hasUpdate: false, error: e.message });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('Update check failed:', e);

                resolve({ hasUpdate: false, error: e.message });
            });

            req.setTimeout(10000, () => {
                req.destroy();

                resolve({ hasUpdate: false, error: 'Timeout' });
            });

            req.end();
        });
    }

    showUpdateDialog(release) {
        const result = dialog.showMessageBoxSync({
            type: 'info',
            title: 'Доступно обновление',
            message: `Nexus Forge ${this.latestVersion}`,
            detail: `Текущая версия: ${this.currentVersion}\n\n${release.body || 'Новая версия доступна!'}`,
            buttons: ['Скачать', 'Позже'],
            defaultId: 0,
            cancelId: 1
        });

        if (result === 0) this.downloadUpdate();
    }

    downloadUpdate() {
        if (this.downloadUrl) shell.openExternal(this.downloadUrl);
    }

    getUpdateStatus() {
        return {
            updateAvailable: this.updateAvailable,
            currentVersion: this.currentVersion,
            latestVersion: this.latestVersion,
            downloadUrl: this.downloadUrl
        };
    }

    startAutoCheck(window) {
        setTimeout(() => this.checkForUpdates(true), 30000);

        setInterval(() => {
            this.checkForUpdates(true).then(result => {
                if (result.hasUpdate && window) window.webContents.send('update-available', result);
            });
        }, this.checkInterval);
    }
}

module.exports = Updater;
