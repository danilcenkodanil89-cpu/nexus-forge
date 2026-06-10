let allGames = [];
let selectedGame = null;

const FALLBACK_ICONS = {
    'shooter': '🔫',
    'action-rpg': '⚔️',
    'horror': '👁️',
    'utility': '🔧',
    'default': '🎮'
};

async function init() {
    try {
        allGames = await window.electronAPI.getGames();

        console.log('Games loaded:', allGames.map(g => ({ id: g.id, hasIcon: !!g.icon })));

        selectedGame = allGames[0];

        renderGameList();
        updateBigIcon();
        updateHero();
        setupEventListeners();
        setupWindowControls();
        setupUpdates();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function getFallbackIcon(category) {
    return FALLBACK_ICONS[category] || FALLBACK_ICONS['default'];
}

function renderGameList() {
    const list = document.getElementById('game-list');

    if (!list) return;

    list.innerHTML = allGames.map(game => {
        const hasIcon = game.icon && game.icon.startsWith('data:image');
        const iconHtml = hasIcon ?
            `<img src="${game.icon}" alt="${game.name}">` :
            `<span class="fallback">${getFallbackIcon(game.category)}</span>`;

        const isActive = selectedGame && selectedGame.id === game.id ? 'active' : '';

        return `
      <div class="game-item ${isActive}" data-id="${game.id}">
        <div class="game-thumb">
          ${iconHtml}
        </div>
        <div class="game-item-info">
          <h4>${game.name}</h4>
          <span>${game.category}</span>
        </div>
      </div>
    `;
    }).join('');

    document.querySelectorAll('.game-item').forEach(item => {
        item.addEventListener('click', () => {
            const gameId = item.dataset.id;

            selectedGame = allGames.find(g => g.id === gameId);

            renderGameList();
            updateBigIcon();
            updateHero();
        });
    });
}

function updateBigIcon() {
    if (!selectedGame) return;

    const container = document.getElementById('big-icon');

    if (!container) {
        console.error('big-icon element not found');

        return;
    }

    const hasIcon = selectedGame.icon && selectedGame.icon.startsWith('data:image');

    console.log('Updating big icon:', selectedGame.name, 'hasIcon:', hasIcon);

    container.innerHTML = '';

    if (hasIcon) {
        const img = document.createElement('img');
        img.src = selectedGame.icon;
        img.alt = selectedGame.name;

        img.onload = () => console.log('Big icon loaded successfully');
        img.onerror = () => {
            console.error('Failed to load big icon, using fallback');
            showFallbackIcon(container, selectedGame.category);
        };

        container.appendChild(img);
    } else showFallbackIcon(container, selectedGame.category);
}

function showFallbackIcon(container, category) {
    const span = document.createElement('span');
    span.className = 'big-icon-fallback';
    span.textContent = getFallbackIcon(category);
    container.appendChild(span);
}

function updateHero() {
    if (!selectedGame) return;

    const title = document.getElementById('hero-title');
    const subtitle = document.getElementById('hero-subtitle');

    if (!title || !subtitle) return;

    title.style.animation = 'none';
    subtitle.style.animation = 'none';

    void title.offsetWidth;

    title.textContent = selectedGame.name;
    subtitle.textContent = selectedGame.description || 'Готов к запуску';

    title.style.animation = 'fadeInUp 0.6s ease-out';
    subtitle.style.animation = 'fadeInUp 0.6s ease-out 0.1s both';

    if (selectedGame.accent) {
        document.documentElement.style.setProperty('--accent', selectedGame.accent);
        document.documentElement.style.setProperty('--accent-glow', selectedGame.accent + '66');
    }
}

async function setupUpdates() {
    const status = await window.electronAPI.getUpdateStatus();

    const versionEl = document.getElementById('version-info');

    if (versionEl && status.currentVersion) versionEl.textContent = `v${status.currentVersion}`;

    const result = await window.electronAPI.checkUpdates();

    if (result.hasUpdate) showUpdateBadge(result);

    window.electronAPI.onUpdateAvailable((data) => {
        showUpdateBadge(data);
    });
}

function showUpdateBadge(updateInfo) {
    const badge = document.getElementById('update-badge');

    if (!badge) return;

    badge.style.display = 'flex';
    badge.addEventListener('click', () => {
        showUpdateNotification(updateInfo);
    });
}

function showUpdateNotification(updateInfo) {
    const old = document.querySelector('.update-notification');

    if (old) old.remove();

    const notif = document.createElement('div');
    notif.className = 'update-notification';
    notif.innerHTML = `
    <h4>Доступно обновление ${updateInfo.version}</h4>
    <p>${updateInfo.releaseNotes || 'Новая версия Nexus Forge доступна для загрузки'}</p>
    <button class="update-btn">Скачать обновление</button>
  `;

    notif.querySelector('.update-btn').addEventListener('click', () => {
        window.electronAPI.launchGame(updateInfo.url);

        notif.remove();
    });

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';

        setTimeout(() => notif.remove(), 300);
    }, 10000);
}

function setupEventListeners() {
    const startBtn = document.getElementById('start-btn');

    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            if (!selectedGame) return;

            const btn = startBtn;
            const originalText = btn.querySelector('.start-text') ? .textContent || 'START';

            const textEl = btn.querySelector('.start-text');

            if (textEl) textEl.textContent = 'LAUNCHING...';

            btn.style.opacity = '0.8';

            try {
                await window.electronAPI.launchGame(selectedGame.path);

                if (textEl) textEl.textContent = 'RUNNING';

                setTimeout(() => {
                    if (textEl) textEl.textContent = originalText;

                    btn.style.opacity = '1';
                }, 2000);
            } catch (error) {
                if (textEl) textEl.textContent = 'ERROR';

                setTimeout(() => {
                    if (textEl) textEl.textContent = originalText;

                    btn.style.opacity = '1';
                }, 2000);
            }
        });
    }

    const menuBtn = document.getElementById('menu-btn');

    if (menuBtn)
        menuBtn.addEventListener('click', () => {
            if (selectedGame) window.electronAPI.openFolder(selectedGame.path);
        });
}

function setupWindowControls() {
    document.getElementById('minimize-btn') ? .addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('close-btn') ? .addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
}

document.addEventListener('DOMContentLoaded', init);
