// === SELECCIÓN DE ELEMENTOS DEL DOM (INTERFAZ) ===
const selectors = {
  boardContainer: document.querySelector('.board-container'),
  board: document.querySelector('.board'),
  moves: document.querySelector('.moves'),
  timer: document.querySelector('.timer'),
  start: document.querySelector('button'),
  win: document.querySelector('.win')
};

// === ESTADO DEL JUEGO ===
const state = {
  gameStarted: false,       // ¿El juego ha comenzado?
  flippedCards: 0,          // Número de cartas volteadas actualmente
  totalFlips: 0,            // Volteos totales en este nivel
  totalTime: 0,             // Tiempo transcurrido en este nivel
  totalGameFlips: 0,        // Volteos acumulados de todos los niveles
  totalGameTime: 0,         // Tiempo total acumulado
  loop: null,               // Intervalo de tiempo
  level: 4,                 // Nivel actual
  locked: false             // Bloqueo del tablero (cuando suena música final o error)
};

// === CONSTANTE DE TIEMPO MÁXIMO ===
const MAX_TIME = 60;

// === AUDIOS DEL JUEGO ===
const sounds = {
  fondo: new Audio('sonidos/fondo.wav'),             // Música de fondo
  acierto: new Audio('sonidos/acierto.MP3'),         // Sonido de acierto
  error: new Audio('sonidos/error.MP3'),             // Sonido de error
  errorFinal: new Audio('sonidos/errorFinal.wav'),   // Sonido de derrota por tiempo
  nivelCompletado: new Audio('sonidos/aciertoFinal.wav') // Sonido al completar nivel
};

sounds.fondo.loop = true;
sounds.fondo.volume = 0.4;

// === IMÁGENES DISPONIBLES ===
const images = [
  'imagen/abigail.jpeg','imagen/aury.jpeg','imagen/dayana.jpeg','imagen/juan.jpeg',
  'imagen/leoncio.jpeg','imagen/ruth.jpeg','imagen/yamile.jpeg','imagen/miguel.jpeg',
];

// === FUNCIONES AUXILIARES DE ARREGLOS ===
const shuffle = arr => arr.sort(() => Math.random() - 0.5);
const pickRandom = (arr, count) => shuffle([...arr]).slice(0, count);

// === FUNCIONES DE DISEÑO DE TABLERO ===
const getGridDimensions = n => {
  let cols = Math.ceil(Math.sqrt(n));
  while (n % cols !== 0) cols++;
  return [n / cols, cols];
};

// === GENERADOR PRINCIPAL DE CARTAS ===
const generateGame = () => {
  const totalCards = state.level % 2 === 0 ? state.level : state.level + 1;
  const picks = pickRandom(images, totalCards / 2);
  const items = shuffle([...picks, ...picks]);
  const [rows, cols] = getGridDimensions(totalCards);

  // Renderiza HTML dinámico del tablero
  const cards = `
    <div class="board" style="grid-template-columns: repeat(${cols}, auto)" data-dimension="${totalCards}">
      ${items.map(img => `
        <div class="card">
          <div class="card-inner">
            <div class="card-front"></div>
            <div class="card-back"><img src="${img}" alt="img" /></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Reemplaza el tablero antiguo con el nuevo
  const newBoard = new DOMParser().parseFromString(cards, 'text/html').querySelector('.board');
  selectors.board.replaceWith(newBoard);
  selectors.board = document.querySelector('.board');
  attachEventListeners();
};

// === INICIO DE JUEGO Y TIEMPO ===
const startGame = () => {
  state.gameStarted = true;
  selectors.start.classList.add('disabled');
  sounds.fondo.currentTime = 0;
  sounds.fondo.play();

  // Temporizador
  state.loop = setInterval(() => {
    state.totalTime++;
    selectors.moves.innerText = `${state.totalFlips} movimientos`;
    selectors.timer.innerText = `Tiempo: ${state.totalTime}s`;

    if (state.totalTime >= MAX_TIME) {
      endGameByTimeout(); // Cuando se acaba el tiempo
    }
  }, 1000);
};

// === FIN DEL JUEGO POR TIEMPO AGOTADO ===
const endGameByTimeout = () => {
  clearInterval(state.loop);
  sounds.fondo.pause();
  state.locked = true; // Bloquea tablero

  sounds.errorFinal.play(); // Sonido de error final

  // Muestra mensaje final
  selectors.boardContainer.classList.add('flipped');
  selectors.win.innerHTML = `
    <span class="win-text">
      ⏰ Tiempo concluido. ¡Perdiste!<br/>
      <button class="restart-btn">Reiniciar nivel</button>
      <button class="reset-game-btn">Volver al inicio</button>
    </span>
  `;

  // Desbloquea cuando termina el audio
  const unlock = () => {
    state.locked = false;
    sounds.errorFinal.removeEventListener('ended', unlock);
  };
  sounds.errorFinal.addEventListener('ended', unlock);

  document.querySelector('.restart-btn').addEventListener('click', () => {
    resetState(false);
    generateGame();
  });

  document.querySelector('.reset-game-btn').addEventListener('click', () => {
    resetState(true);
    generateGame();
  });
};

// === REINICIAR ESTADO DEL JUEGO ===
const resetState = (resetAll = false) => {
  Object.assign(state, {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    locked: false
  });

  clearInterval(state.loop);
  sounds.fondo.pause();
  selectors.start.classList.remove('disabled');
  selectors.win.innerHTML = '';
  selectors.boardContainer.classList.remove('flipped');

  if (resetAll) {
    state.level = 4;
    state.totalGameFlips = 0;
    state.totalGameTime = 0;
  }
};

// === VOLTEAR LAS CARTAS ERRÓNEAS DE NUEVO ===
const flipBackCards = () => {
  document.querySelectorAll('.card:not(.matched)').forEach(card => card.classList.remove('flipped'));
  state.flippedCards = 0;
};

// === LÓGICA DE VOLTEO DE CARTAS ===
const flipCard = card => {
  if (card.classList.contains('flipped') || card.classList.contains('matched') || state.locked) return;

  card.classList.add('flipped');
  state.flippedCards++;
  state.totalFlips++;

  if (!state.gameStarted) startGame();

  const flipped = document.querySelectorAll('.card.flipped:not(.matched)');
  if (flipped.length === 2) {
    const [first, second] = flipped;
    const firstImg = first.querySelector('img').src;
    const secondImg = second.querySelector('img').src;

    // Comparar imágenes
    if (firstImg === secondImg) {
      first.classList.add('matched');
      second.classList.add('matched');
      sounds.acierto.play(); // sonido de acierto
    } else {
      sounds.error.play(); // sonido de error
    }

    // Voltearlas después de un tiempo
    setTimeout(() => flipBackCards(), 1000);
  }

  // Si no quedan más cartas por emparejar
  if (!document.querySelectorAll('.card:not(.matched)').length) {
    winLevel();
  }
};

// === GANAR UN NIVEL ===
const winLevel = () => {
  clearInterval(state.loop);
  state.totalGameFlips += state.totalFlips;
  state.totalGameTime += state.totalTime;
  state.locked = true;
  sounds.fondo.pause();
  sounds.nivelCompletado.play(); // sonido de nivel completado

  selectors.boardContainer.classList.add('flipped');
  selectors.win.innerHTML = `
    <span class="win-text">
      ¡Nivel completado!<br />
      <span class="highlight">${state.totalFlips}</span> movimientos<br />
      <span class="highlight">${state.totalTime}</span> segundos
    </span>
  `;

  // Espera que termine la música antes de continuar
  sounds.nivelCompletado.addEventListener('ended', () => {
    state.locked = false;
    if (state.level < 10) {
      state.level += 2;
      resetState();
      generateGame();
    } else {
      showFinalSummary();
    }
  });
};

// === PANTALLA FINAL DE JUEGO COMPLETO ===
const showFinalSummary = () => {
  selectors.boardContainer.classList.add('flipped');
  selectors.win.innerHTML = `
    <span class="win-text">
      🎉 ¡Juego completado!<br />
      <span class="highlight">${state.totalGameFlips}</span> movimientos<br />
      <span class="highlight">${state.totalGameTime}</span> segundos<br /><br />
      <button class="restart-btn">Reiniciar desde el nivel 1</button>
    </span>
  `;

  sounds.nivelCompletado.play();

  document.querySelector('.restart-btn').addEventListener('click', () => {
    resetState(true);
    generateGame();
  });
};

// === ASIGNACIÓN DE EVENTOS ===
const attachEventListeners = () => {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => flipCard(card));
  });

  selectors.start.addEventListener('click', () => {
    if (!state.gameStarted) startGame();
  });
};

// === INICIO ===
generateGame();
