const { createApp } = Vue;

createApp({
  data: function () {
    return {
      locale: detectLocale(),
      screen: 'gallery',
      images: IMAGES,
      failedThumbs: {},
      selectedImage: null,
      imageSize: null,
      loadError: false,
      grid: null,
      tiles: [],
      selectedIndex: null,
      moves: 0,
      showOriginal: false,
      won: false,
      flashing: false,
      showComplete: false,
      dragState: null,
      winTimer: null,
    };
  },

  computed: {
    difficultyOptions: function () {
      if (!this.imageSize) {
        return [];
      }
      const options = [];
      for (let n = 5; n <= 11; n += 1) {
        const grid = computeGrid(this.imageSize.width, this.imageSize.height, n);
        options.push({
          n: n,
          cols: grid.cols,
          rows: grid.rows,
          pieces: grid.cols * grid.rows,
        });
      }
      return options;
    },

    boardVars: function () {
      if (!this.grid) {
        return {};
      }
      return {
        '--cols': this.grid.cols,
        '--rows': this.grid.rows,
        '--used-w': this.grid.usedW,
        '--used-h': this.grid.usedH,
      };
    },

    croppedStyle: function () {
      if (!this.grid || !this.selectedImage) {
        return {};
      }
      return croppedImageStyle(this.grid, this.selectedImage.url);
    },

    ghostStyle: function () {
      const drag = this.dragState;
      if (!drag || !drag.active) {
        return {};
      }
      const tile = this.tiles[drag.index];
      return Object.assign({}, tile.style, {
        position: 'fixed',
        left: drag.originX + drag.x - drag.startX + 'px',
        top: drag.originY + drag.y - drag.startY + 'px',
        width: drag.width + 'px',
        height: drag.height + 'px',
        zIndex: 40,
        pointerEvents: 'none',
      });
    },

    dropIndex: function () {
      const drag = this.dragState;
      if (!drag || !drag.active) {
        return null;
      }
      return this.hitTest(drag.x, drag.y);
    },
  },

  methods: {
    t: function (key, vars) {
      return translate(this.locale, key, vars);
    },

    imageTitle: function (image) {
      return image.title[this.locale] || image.title.en;
    },

    setLocale: function (locale) {
      this.locale = locale;
      document.documentElement.lang = locale;
    },

    onThumbError: function (id) {
      this.failedThumbs = Object.assign({}, this.failedThumbs, { [id]: true });
    },

    selectImage: function (image) {
      const self = this;
      this.selectedImage = image;
      this.imageSize = null;
      this.loadError = false;
      this.screen = 'difficulty';

      const img = new Image();
      img.onload = function () {
        self.imageSize = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
      };
      img.onerror = function () {
        self.loadError = true;
      };
      img.src = image.url;
    },

    startGame: function (n) {
      if (!this.selectedImage || !this.imageSize) {
        return;
      }
      this.grid = computeGrid(this.imageSize.width, this.imageSize.height, n);
      this.tiles = shuffleTiles(createTiles(this.grid, this.selectedImage.url), this.grid.cols);
      this.moves = 0;
      this.selectedIndex = null;
      this.showOriginal = false;
      this.won = false;
      this.flashing = false;
      this.showComplete = false;
      this.dragState = null;
      this.screen = 'game';
    },

    exitToGallery: function () {
      this.clearWinTimer();
      this.screen = 'gallery';
      this.selectedImage = null;
      this.imageSize = null;
      this.loadError = false;
      this.grid = null;
      this.tiles = [];
      this.selectedIndex = null;
      this.moves = 0;
      this.showOriginal = false;
      this.won = false;
      this.flashing = false;
      this.showComplete = false;
      this.dragState = null;
    },

    toggleOriginal: function () {
      if (this.won) {
        return;
      }
      this.showOriginal = !this.showOriginal;
      this.selectedIndex = null;
      this.dragState = null;
    },

    hitTest: function (clientX, clientY) {
      const board = this.$refs.board;
      if (!board || !this.grid) {
        return null;
      }
      const rect = board.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return null;
      }
      const col = Math.min(
        this.grid.cols - 1,
        Math.max(0, Math.floor((clientX - rect.left) / (rect.width / this.grid.cols)))
      );
      const row = Math.min(
        this.grid.rows - 1,
        Math.max(0, Math.floor((clientY - rect.top) / (rect.height / this.grid.rows)))
      );
      return row * this.grid.cols + col;
    },

    onPointerDown: function (event, index) {
      if (this.won || this.showOriginal || this.showComplete) {
        return;
      }
      event.preventDefault();
      const el = event.currentTarget;
      el.setPointerCapture(event.pointerId);
      const rect = el.getBoundingClientRect();
      this.dragState = {
        index: index,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        originX: rect.left,
        originY: rect.top,
        width: rect.width,
        height: rect.height,
        active: false,
      };
    },

    onPointerMove: function (event) {
      const drag = this.dragState;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      const active = drag.active || distance > drag.width / 2;
      if (active && !drag.active) {
        this.selectedIndex = null;
      }
      this.dragState = Object.assign({}, drag, {
        x: event.clientX,
        y: event.clientY,
        active: active,
      });
    },

    onPointerUp: function (event) {
      const drag = this.dragState;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      this.dragState = null;
      if (drag.active) {
        const target = this.hitTest(event.clientX, event.clientY);
        if (target !== null && target !== drag.index) {
          this.swapTiles(drag.index, target);
        }
        return;
      }
      this.handleClick(drag.index);
    },

    onPointerCancel: function (event) {
      if (!this.dragState || this.dragState.pointerId !== event.pointerId) {
        return;
      }
      this.dragState = null;
    },

    handleClick: function (index) {
      if (this.selectedIndex === null) {
        this.selectedIndex = index;
        return;
      }
      if (this.selectedIndex === index) {
        this.selectedIndex = null;
        return;
      }
      this.swapTiles(this.selectedIndex, index);
    },

    swapTiles: function (from, to) {
      if (from === to || this.won) {
        return;
      }
      const next = this.tiles.slice();
      const swap = next[from];
      next[from] = next[to];
      next[to] = swap;
      this.tiles = next;
      this.selectedIndex = null;
      this.moves += 1;
      this.checkWin();
    },

    checkWin: function () {
      if (!isSolved(this.tiles, this.grid.cols)) {
        return;
      }
      this.won = true;
      this.flashing = true;
      this.dragState = null;
      this.selectedIndex = null;
      const self = this;
      this.clearWinTimer();
      this.winTimer = window.setTimeout(function () {
        self.flashing = false;
        self.showComplete = true;
        self.showOriginal = false;
      }, 500);
    },

    clearWinTimer: function () {
      if (this.winTimer) {
        window.clearTimeout(this.winTimer);
        this.winTimer = null;
      }
    },
  },

  mounted: function () {
    document.documentElement.lang = this.locale;
  },

  beforeUnmount: function () {
    this.clearWinTimer();
  },
}).mount('#app');
