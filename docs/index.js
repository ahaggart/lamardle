const REQUIRED_MATCHES = 3;
const GRID_ROW_GAP = 5;
const GRID_COL_GAP = 5;
const MAX_WIDTH = 500;
const KEYBOARD_HEIGHT_MIN_PERCENT = 0.25;
const NUM_ROWS = 7;
const NUM_LETTERS = 5;
const KEY_HEIGHT = 58;
const KEY_MARGIN = 5;
const GRID_PADDING = 10;

class WordList {
    constructor(numLetters) {
        this.numLetters = numLetters;
        this.isReady = false;
        this.onReady = [];
        this.words = [];
    }

    addListener(callback) {
        this.onReady.push(callback);
        if (this.isReady) {
            callback(words);
        }
    }

    setWords(rawWords) {
        this.words = rawWords.split('\n');
        this.isReady = true;
        this.onReady.forEach(callback => callback(this.words));
    }
}

const WORD_LIST = new WordList(NUM_LETTERS);

function loadWords(callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = e => {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                callback(request.responseText);
            }
        }
    };
    request.open('GET', 'five-letters.txt');
    request.send();
}

class GridLetter extends HTMLElement {
    constructor(letter, pos) {
        super();
        this.pos = pos;
        this.setLetter(letter || '');
        this.classList.add('letter', 'no-match');
    }

    setLetter(letter) {
        this.letter = letter;
        this.innerText = letter;
    }

    setMatch(matchUpper, matchLower) {
        this.classList.remove('both-match', 'upper-match', 'lower-match', 'no-match');
        if (matchUpper && matchLower) {
            this.classList.add('both-match');
        } else if (matchLower) {
            this.classList.add('lower-match');
        } else if (matchUpper) {
            this.classList.add('upper-match');
        } else {
            this.classList.add('no-match');
        }
    }

    setHighlight(isHighlighted) {
        this.style.borderColor = isHighlighted ? 'var(--highlight-color)' : 'var(--non-highlight-color)';
    }
}

customElements.define('grid-letter', GridLetter);

class GridRow extends HTMLElement {
    tiles = [];
    letters = '';
    constructor() {
        super();
        this.classList.add('grid-row');

        for (let i = 0; i < NUM_LETTERS; i++) {
            const tile = new GridLetter('', i);
            this.tiles.push(tile);
            this.appendChild(tile);
        }

        this.setLetters(this.getAttribute("letters"));
    }

    setLetters(letters) {
        this.letters = letters || '';
        const paddedLetters = this.letters
            .substring(0, NUM_LETTERS)
            .padEnd(NUM_LETTERS, ' ');

        for (let i = 0; i < NUM_LETTERS; i++) {
            this.tiles[i].setLetter(paddedLetters[i]);
        }
    }

    updateMatches(upper, lower) {
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].setMatch(
                this.tiles[i].letter === upper.tiles[i].letter,
                this.tiles[i].letter === lower.tiles[i].letter,
            );
        }
    }

    isComplete() {
        return this.letters.length === NUM_LETTERS;
    }

    doesMatch(other) {
        if (!this.isComplete() || !other.isComplete()) {
            return false;
        }

        var matchCount = 0;
        for (let i = 0; i < NUM_LETTERS; i++) {
            if (this.letters[i] === other.letters[i]) {
                matchCount++;
            }
        }
    
        if (matchCount < REQUIRED_MATCHES) {
            return false;
        }

        return true;
    }
}

customElements.define('grid-row', GridRow);

class GameKeyboard extends HTMLElement {
    constructor(grid) {
        super();

        this.grid = grid;

        this.letters = '';

        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.margin = "0 5px";
        keyboardContainer.appendChild(this.createRow('qwertyuiop'));
        keyboardContainer.appendChild(this.createRow(' asdfghjkl '));
        keyboardContainer.appendChild(this.createRow('+zxcvbnm-'));
        this.appendChild(keyboardContainer);
    }

    backspace() {
        if (this.letters.length == 0) {
            return;
        }
        this.letters = this.letters.substring(0, this.letters.length - 1);
        this.grid.setLetters(this.letters);
    }

    appendLetter(letter) {
        if (this.letters.length == 5) {
            return;
        }
        this.letters += letter;
        this.grid.setLetters(this.letters);
    }

    submit() {
        if (this.grid.submit()) {
            this.letters = '';
        }
    }

    createRow(letters) {
        const row = document.createElement('div');
        row.classList.add('game-keyboard-row');
        for (let letter of letters) {
            if (letter === ' ') {
                const spacer = document.createElement('div');
                spacer.classList.add('point-five');
                row.appendChild(spacer);
            } else if (letter === '+') {
                const key = document.createElement('button');
                key.classList.add('key', 'one-point-five');
                key.innerText = 'enter';
                key.addEventListener('click', () => this.submit());
                row.appendChild(key);
            } else if (letter === '-') {
                const key = document.createElement('button');
                key.classList.add('key', 'one-point-five');
                key.innerText = 'del';
                key.addEventListener('click', () => this.backspace());
                row.appendChild(key);
            } else {
                const key = document.createElement('button');
                key.classList.add('key');
                key.addEventListener('click', () => this.appendLetter(letter));
                key.innerText = letter;
                row.appendChild(key);
            }
        }

        return row;
    }
}

customElements.define('game-keyboard', GameKeyboard);

class GameGrid extends HTMLElement {
    constructor(winCallback) {
        super();

        this.winCallback = winCallback;

        this.numGuesses = 0;

        this.id = 'game-grid';
        this.grid = document.createElement('div');
        this.grid.classList.add('grid');
        this.grid.id = 'grid';
        this.grid.style.setProperty('--num-rows', 7);
        this.appendChild(this.grid);
        this.resizeGrid();
        window.addEventListener('resize', this.resizeGrid);

        WORD_LIST.addListener(words => {
            this.words = words;
            this.createRows();
        });
    }

    getRandomWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    createRows() {
        this.upper = new GridRow();
        this.upper.setLetters(this.getRandomWord());

        this.lower = new GridRow();
        this.lower.setLetters(this.getRandomWord()); 
        this.lower.id = 'goal';

        this.current = new GridRow();

        this.grid.appendChild(new GridRow());
        this.grid.appendChild(new GridRow());
        this.grid.appendChild(this.upper);
        this.grid.appendChild(this.current);
        this.grid.appendChild(this.lower);
        this.grid.appendChild(new GridRow());
        this.grid.appendChild(new GridRow());
    }

    setLetters(letters) {
        this.current.setLetters(letters);
        this.current.updateMatches(this.upper, this.lower);
    }

    resizeGrid() {
        const gridPaddingWidth = GRID_PADDING * 2;
        const targetWidth = Math.min(MAX_WIDTH, window.innerWidth - gridPaddingWidth);
        const columnGapWidth = GRID_ROW_GAP * (NUM_LETTERS - 1)
        const maxTileWidth = Math.floor((targetWidth - columnGapWidth) / NUM_LETTERS);
    
        const keyboardHeight = KEY_HEIGHT * 3 + KEY_MARGIN * 2;
        const gridPaddingHeight = GRID_PADDING * 2;
        const targetHeight = window.innerHeight - keyboardHeight - gridPaddingHeight;
        const rowGapHeight = GRID_ROW_GAP * (NUM_ROWS - 1);
        const maxTileHeight = Math.floor((targetHeight - rowGapHeight) / NUM_ROWS);
    
        const tileSize = Math.min(maxTileWidth, maxTileHeight);
        const gridWidth = tileSize * NUM_LETTERS + columnGapWidth;
        const gridHeight = tileSize * NUM_ROWS + rowGapHeight;
    
        this.grid.style.width = gridWidth + 'px';
        this.grid.style.height = gridHeight + 'px';
        this.grid.style.marginBottom = (targetHeight - gridHeight) + 'px';
    }

    submit() {
        if (!this.current.isComplete()) {
            return false;
        }
        const upperMatch = this.current.doesMatch(this.upper);
        const lowerMatch = this.current.doesMatch(this.lower);

        if (!upperMatch && !lowerMatch) {
            return false;
        }

        this.numGuesses++;

        if (upperMatch && lowerMatch) {
            console.log('you win')
            this.winCallback();
            return true;
        }
        
        const newRow = new GridRow();

        if (upperMatch) {
            this.grid.children[0].remove();
            this.upper = this.current;
            this.current = newRow;
            this.grid.insertBefore(this.current, this.lower);
        } else {
            this.grid.children[this.grid.children.length - 1].remove();
            this.lower = this.current;
            this.current = newRow;
            this.grid.insertBefore(this.current, this.lower);
        } 

        return true;
    }
}

customElements.define('game-grid', GameGrid);

class LamardleGame extends HTMLElement {
    constructor() {
        super();

        this.container = document.createElement('div');
        this.container.classList.add('container');
        this.appendChild(this.container);

        this.winPopup = document.createElement('div');
        this.winPopup.classList.add('winOverlay');
        this.winPopup.style.display = 'none';
        this.container.appendChild(this.winPopup);

        this.winMessage = document.createElement('div');
        this.winMessage.classList.add('winMessage');
        this.winPopup.appendChild(this.winMessage);

        this.grid = new GameGrid(() => this.winGame());
        this.container.append(this.grid)

        this.keyboard = new GameKeyboard(this.grid);
        this.container.append(this.keyboard);

        document.addEventListener('keydown', e => {        
            if (e.key === 'Backspace') {
                this.keyboard.backspace();
            } else if (e.key === 'Enter') {
                this.keyboard.submit();
            } else if (e.key.match(/^[a-z]$/)) {
                this.keyboard.appendLetter(e.key);
            }
        });
    }

    winGame() {
        this.winMessage.innerText = 'You Won in ' + this.grid.numGuesses + ' tries!';
        this.winPopup.style.display = 'block';
    }
}

customElements.define('lamardle-game', LamardleGame);

loadWords(words => WORD_LIST.setWords(words));