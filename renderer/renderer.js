let allGames = [];
let selectedGame = null;

// Хранит пути запущенных процессов
const runningGames = new Set();

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

    // Слушаем завершение процесса из main.js
    window.electronAPI.onGameExited((path) => {
      runningGames.delete(path);
      renderGameList();     // обновить иконки в списке
      updateStartButton();  // вернуть кнопку в START
    });

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
    const iconHtml = hasIcon
      ? `<img src="${game.icon}" alt="${game.name}">`
      : `<span class="fallback">${getFallbackIcon(game.category)}</span>`;

    const isActive = selectedGame && selectedGame.id === game.id ? 'active' : '';
    const isRunning = runningGames.has(game.path);

    return `
      <div class="game-item ${isActive}" data-id="${game.id}">
        <div class="game-thumb">
          ${iconHtml}
        </div>
        <div class="game-item-info">
          <h4>${game.name}</h4>
          <span>${isRunning ? '▶ Запущено' : game.category}</span>
        </div>
        ${isRunning ? '<div class="running-dot"></div>' : ''}
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
  } else {
    showFallbackIcon(container, selectedGame.category);
  }
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

  // Обновить кнопку под новую выбранную игру
  updateStartButton();
}

// --- НОВОЕ: обновление состояния кнопки START / RUNNING ---
function updateStartButton() {
  const btn = document.getElementById('start-btn');
  const textEl = btn?.querySelector('.start-text');
  if (!btn || !textEl || !selectedGame) return;

  const isRunning = runningGames.has(selectedGame.path);

  if (isRunning) {
    textEl.textContent = 'RUNNING';
    btn.classList.add('is-running');
    btn.disabled = true;
  } else {
    textEl.textContent = 'START';
    btn.classList.remove('is-running');
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

function setupEventListeners() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      if (!selectedGame) return;
      if (runningGames.has(selectedGame.path)) return; // уже запущено

      // Сразу помечаем как запущенное
      runningGames.add(selectedGame.path);
      renderGameList();
      updateStartButton();

      try {
        await window.electronAPI.launchGame(selectedGame.path);
        // Promise разрешается при старте процесса — ждём game-exited для сброса
      } catch (error) {
        console.error('Failed to launch:', error);
        // Если запуск провалился — убираем из running
        runningGames.delete(selectedGame.path);
        renderGameList();
        updateStartButton();

        const textEl = startBtn.querySelector('.start-text');
        if (textEl) {
          textEl.textContent = 'ERROR';
          setTimeout(() => updateStartButton(), 2000);
        }
      }
    });
  }

  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (selectedGame) {
        window.electronAPI.openFolder(selectedGame.path);
      }
    });
  }
}

function setupWindowControls() {
  document.getElementById('minimize-btn')?.addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });

  document.getElementById('close-btn')?.addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });
}

document.addEventListener('DOMContentLoaded', init);

