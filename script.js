    // Selección de elementos del DOM
    const selectors = {
      boardContainer: document.querySelector('.board-container'),
      board: document.querySelector('.board'),
      moves: document.querySelector('.moves'),
      timer: document.querySelector('.timer'),
      win: document.querySelector('.win')
    };

    // Estado del juego
    const state = {
      gameStarted: false,
      flippedCards: 0,
      totalFlips: 0,
      totalTime: 0,
      totalGameFlips: 0,
      totalGameTime: 0,
      loop: null,
      level: 1,
      locked: false
    };

    const MAX_TIME = 60; // Tiempo límite por nivel (en segundos)

    // Carga de sonidos
    const sounds = {
      fondo: new Audio('sonidos/fondo.wav'),
      acierto: new Audio('sonidos/acierto.MP3'),
      error: new Audio('sonidos/error.MP3'),
      errorFinal: new Audio('sonidos/errorFinal.wav'),
      nivelCompletado: new Audio('sonidos/aciertoFinal.wav')
    };

    // Configurar sonido de fondo
    sounds.fondo.loop = true;
    sounds.fondo.volume = 0.4;

    // Imágenes a usar en el juego
    const images = [
      'imagen/abigail.jpeg','imagen/aury.jpeg','imagen/dayana.jpeg','imagen/juan.jpeg',
      'imagen/leoncio.jpeg','imagen/ruth.jpeg','imagen/yamile.jpeg','imagen/miguel.jpeg'
    ];

    // Función para mezclar un arreglo
    const shuffle = arr => arr.sort(() => Math.random() - 0.5);

    // Tomar imágenes aleatorias
    const pickRandom = (arr, count) => shuffle([...arr]).slice(0, count);

    // Calcular filas y columnas según cantidad de cartas
    const getGridDimensions = n => {
      let cols = Math.ceil(Math.sqrt(n));
      while (n % cols !== 0) cols++;
      return [n / cols, cols];
    };

    // Mostrar mensaje de bienvenida por nivel
    const showWelcomeMessage = () => {
      selectors.boardContainer.classList.add('flipped');
      let message = `<span class="win-text">🎮 Bienvenido al nivel ${state.level}<br />`;

      message += `
        <button class="continue-btn">Comenzar</button>
        ${state.level > 1 ? `
          <button class="restart-btn">Reintentar nivel</button>
          <button class="reset-game-btn">Regresar al nivel 1</button>
          <button class="exit-game-btn">Salir del juego</button>
        ` : ''}
      </span>`;

      selectors.win.innerHTML = message;

      // Eventos de botones
      document.querySelector('.continue-btn').addEventListener('click', () => {
        selectors.boardContainer.classList.remove('flipped');
        selectors.win.innerHTML = '';
      });

      if (state.level > 1) {
        document.querySelector('.restart-btn').addEventListener('click', () => {
          resetState(false);
          generateGame();
        });
        document.querySelector('.reset-game-btn').addEventListener('click', () => {
          resetState(true);
          generateGame();
        });
        document.querySelector('.exit-game-btn').addEventListener('click', () => {
          window.close();
        });
      }
    };

    // Generar el tablero de juego
    const generateGame = () => {
      const totalCards = state.level * 2;
      const picks = pickRandom(images, totalCards / 2);
      const items = shuffle([...picks, ...picks]);
      const [rows, cols] = getGridDimensions(totalCards);

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

      const newBoard = new DOMParser().parseFromString(cards, 'text/html').querySelector('.board');
      selectors.board.replaceWith(newBoard);
      selectors.board = document.querySelector('.board');
      attachEventListeners();
      showWelcomeMessage();
    };

    // Iniciar el juego y temporizador
    const startGame = () => {
      state.gameStarted = true;
      sounds.fondo.currentTime = 0;
      sounds.fondo.play();

      state.loop = setInterval(() => {
        state.totalTime++;
        selectors.moves.innerText = `${state.totalFlips} movimientos`;
        selectors.timer.innerText = `Tiempo: ${state.totalTime}s`;

        if (state.totalTime >= MAX_TIME) {
          endGameByTimeout();
        }
      }, 1000);
    };

    // Terminar juego por tiempo agotado
    const endGameByTimeout = () => {
      clearInterval(state.loop);
      sounds.fondo.pause();
      state.locked = true;
      sounds.errorFinal.play();

      selectors.boardContainer.classList.add('flipped');
      selectors.win.innerHTML = `
        <span class="win-text">
          ⏰ Tiempo concluido. ¡Perdiste!<br/>
          <button class="restart-btn">Reiniciar nivel</button>
          <button class="reset-game-btn">Volver al inicio</button>
          <button class="exit-game-btn">Salir del juego</button>
        </span>
      `;

      sounds.errorFinal.addEventListener('ended', () => state.locked = false);

      document.querySelector('.restart-btn').addEventListener('click', () => {
        resetState(false);
        generateGame();
      });
      document.querySelector('.reset-game-btn').addEventListener('click', () => {
        resetState(true);
        generateGame();
      });
      document.querySelector('.exit-game-btn').addEventListener('click', () => {
        window.close();
      });
    };

    // Reiniciar estado del juego
    const resetState = (resetAll = false) => {
      clearInterval(state.loop);
      sounds.fondo.pause();
      selectors.win.innerHTML = '';
      selectors.boardContainer.classList.remove('flipped');

      Object.assign(state, {
        gameStarted: false,
        flippedCards: 0,
        totalFlips: 0,
        totalTime: 0,
        locked: false
      });

      if (resetAll) {
        state.level = 1;
        state.totalGameFlips = 0;
        state.totalGameTime = 0;
      }
    };

    // Voltear todas las cartas no emparejadas
    const flipBackCards = () => {
      document.querySelectorAll('.card:not(.matched)').forEach(card => card.classList.remove('flipped'));
      state.flippedCards = 0;
    };

    // Voltear una carta
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

        if (firstImg === secondImg) {
          first.classList.add('matched');
          second.classList.add('matched');
          sounds.acierto.play();
        } else {
          sounds.error.play();
        }

        setTimeout(() => flipBackCards(), 1000);
      }

      if (!document.querySelectorAll('.card:not(.matched)').length) {
        state.locked = true;
        setTimeout(winLevel, 1500);
      }
    };

    // Ganas el nivel
    const winLevel = () => {
      clearInterval(state.loop);
      state.totalGameFlips += state.totalFlips;
      state.totalGameTime += state.totalTime;
      sounds.fondo.pause();

      selectors.boardContainer.classList.add('flipped');
      selectors.win.innerHTML = `
        <span class="win-text">
          ¡Nivel completado!<br />
          <span class="highlight">${state.totalFlips}</span> movimientos<br />
          <span class="highlight">${state.totalTime}</span> segundos
        </span>
      `;

      sounds.nivelCompletado.play();

      sounds.nivelCompletado.addEventListener('ended', () => {
        state.locked = false;
        if (state.level < 5) {
          state.level += 1;
          resetState();
          generateGame();
        } else {
          showFinalSummary();
        }
      }, { once: true });
    };

    // Mostrar resumen al terminar todos los niveles
    const showFinalSummary = () => {
      selectors.boardContainer.classList.add('flipped');
      selectors.win.innerHTML = `
        <span class="win-text">
          🎉 ¡Juego completado!<br />
          🎉 ¡GANASTES!<br />
          <span class="highlight">${state.totalGameFlips}</span> movimientos<br />
          <span class="highlight">${state.totalGameTime}</span> segundos<br /><br />
          <button class="restart-btn">Reiniciar desde el nivel 1</button>
          <button class="exit-game-btn">Salir del juego</button>
        </span>
      `;

      sounds.nivelCompletado.play();

      document.querySelector('.restart-btn').addEventListener('click', () => {
        resetState(true);
        generateGame();
      });

      document.querySelector('.exit-game-btn').addEventListener('click', () => {
        window.close();
      });
    };

    // Asociar evento a las cartas
    const attachEventListeners = () => {
      document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => flipCard(card));
      });
    };

    // Iniciar el juego al cargar
    generateGame();
