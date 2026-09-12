const I18N = {
  ru: {
    heading: 'Игра-мозаика',
    galleryLead: 'Выберите картинку',
    difficultyTitle: 'Выберите сложность',
    difficultyHint: 'По меньшей стороне картинка делится на N квадратов',
    pieces: 'фрагментов',
    exit: 'Выход',
    moves: 'Ходы',
    showOriginal: 'Показать оригинал',
    showPuzzle: 'К пазлу',
    win: 'У вас получилось!',
    winMoves: 'Собрано за {n} ходов',
    newGame: 'Начать новую игру',
    loading: 'Загрузка…',
    imageError: 'Не удалось загрузить картинку',
  },
  en: {
    heading: 'Mosaic Puzzle',
    galleryLead: 'Choose a picture',
    difficultyTitle: 'Choose difficulty',
    difficultyHint: 'The shorter side is always split into N squares',
    pieces: 'pieces',
    exit: 'Exit',
    moves: 'Moves',
    showOriginal: 'Show original',
    showPuzzle: 'Back to puzzle',
    win: 'You did it!',
    winMoves: 'Completed in {n} moves',
    newGame: 'Start a new game',
    loading: 'Loading…',
    imageError: 'Could not load the picture',
  },
};

function detectLocale() {
  const language = String(navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return language.includes('ru') ? 'ru' : 'en';
}

function translate(locale, key, vars) {
  const table = I18N[locale] || I18N.en;
  let text = table[key] || I18N.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach(function (name) {
      text = text.replace('{' + name + '}', vars[name]);
    });
  }
  return text;
}
