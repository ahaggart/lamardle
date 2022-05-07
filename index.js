var numGuesses = 0;
var curGuess = '';

const REQUIRED_MATCHES = 3;
const GRID_ROW_GAP = 5;
const GRID_COL_GAP = 5;
const MAX_WIDTH = 500;
const KEYBOARD_HEIGHT_MIN_PERCENT = 0.25;
const NUM_ROWS = 6;
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

function getCurrentRow() {
    return document.getElementById("guess-" + numGuesses);
}

function getPreviousRow() {
    return document.getElementById("guess-" + (numGuesses - 1));
}

function appendLetter(letter) {
    if (curGuess.length == 5) {
        return;
    }
    curGuess += letter;
    getCurrentRow().setLetters(curGuess);
}

function backspace() {
    if (curGuess.length == 0) {
        return;
    }
    curGuess = curGuess.substring(0, curGuess.length - 1);
    getCurrentRow().setLetters(curGuess);
}

function canGuess() {
    const currentRow = getCurrentRow();

    if (currentRow.letters.length !== 5) {
        return false;
    }

    const previousRow = getPreviousRow();

    var matchCount = 0;
    
    for (let i = 0; i < 5; i++) {
        if (currentRow.letters[i] === previousRow.letters[i]) {
            matchCount++;
        }
    }

    if (matchCount < REQUIRED_MATCHES) {
        return false;
    }

    if (!WORD_LIST.words.includes(currentRow.letters)) {
        return false;
    }

    return true;
}

function guess() {
    if (!canGuess()) {
        return;
    }
    numGuesses++;
    const row = new GridRow(numGuesses);
    const grid = document.getElementById("grid");
    grid.insertBefore(
        row,
        document.getElementById("goal")
    );
    grid.children[0].remove();
    curGuess = '';
}

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
    constructor(guessId, pos, letter) {
        super();
        this.pos = pos;
        this.guessId = guessId;
        this.id = 'letter-' + guessId + '-' + pos;
        this.setLetter(letter || this.getAttribute("letter") || "");
        this.classList.add('letter');
    }

    setLetter(letter) {
        this.letter = letter;
        this.innerText = letter;
        const prev = document.getElementById("letter-" + (this.guessId-1) + '-' + this.pos);
        const matches = prev && (prev.letter === this.letter);
        this.style.backgroundColor = matches ? 'var(--matches-color)' : 'var(--non-matches-color)';
    }

    setHighlight(isHighlighted) {
        this.style.borderColor = isHighlighted ? 'var(--highlight-color)' : 'var(--non-highlight-color)';
    }
}

customElements.define('grid-letter', GridLetter);

class GridRow extends HTMLElement {
    tiles = [];
    letters = '';
    constructor(guessId) {
        super();
        this.classList.add('grid-row');
        if (this.hasAttribute('guess-id')) {
            this.guessId = this.getAttribute('guess-id');
        } else {
            this.guessId = guessId;
        }

        if (this.guessId !== undefined) {
            this.id = 'guess-' + this.guessId;
        }

        for (let i = 0; i < 5; i++) {
            const tile = new GridLetter(this.guessId, i, '');
            this.tiles.push(tile);
            this.appendChild(tile);
        }

        this.setLetters(this.getAttribute("letters"));
    }

    setLetters(letters) {
        this.letters = letters || '';
        const paddedLetters = this.letters.padEnd(5, ' ');
        for (let i = 0; i < 5; i++) {
            const highlight = this.id && this.id.includes('guess') && i === this.letters.length;
            this.tiles[i].setHighlight(highlight);
            this.tiles[i].setLetter(paddedLetters[i]);
        }
    }
}

customElements.define('grid-row', GridRow);

class GameKeyboard extends HTMLElement {
    constructor() {
        super();

        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.margin = "0 5px";
        keyboardContainer.appendChild(this.createRow('qwertyuiop'));
        keyboardContainer.appendChild(this.createRow(' asdfghjkl '));
        keyboardContainer.appendChild(this.createRow('+zxcvbnm-'));
        this.appendChild(keyboardContainer);
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
                key.addEventListener('click', guess);
                row.appendChild(key);
            } else if (letter === '-') {
                const key = document.createElement('button');
                key.classList.add('key', 'one-point-five');
                key.innerText = 'del';
                key.addEventListener('click', backspace);
                row.appendChild(key);
            } else {
                const key = document.createElement('button');
                key.classList.add('key');
                key.addEventListener('click', () => appendLetter(letter));
                key.innerText = letter;
                row.appendChild(key);
            }
        }

        return row;
    }
}

customElements.define('game-keyboard', GameKeyboard);

class GameGrid extends HTMLElement {
    constructor() {
        super();

        this.grid = document.createElement('div');
        this.grid.classList.add('grid');
        this.grid.id = 'grid';
        this.appendChild(this.grid);
        this.resizeGrid();
        window.addEventListener('resize', this.resizeGrid);

        WORD_LIST.addListener(words => {
            const start = new GridRow(-1);
            start.setLetters(words[Math.floor(Math.random() * words.length)]);

            const goal = new GridRow();
            goal.setLetters(words[Math.floor(Math.random() * words.length)]); 
            goal.id = 'goal';

            this.grid.appendChild(new GridRow());
            this.grid.appendChild(new GridRow());
            this.grid.appendChild(new GridRow());
            this.grid.appendChild(start);
            this.grid.appendChild(new GridRow(0));
            this.grid.appendChild(goal);
       
        });
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
}

customElements.define('game-grid', GameGrid);

document.addEventListener('keydown', e => {
    if (e.key === 'Backspace') {
        backspace();
    } else if (e.key === 'Enter') {
        guess();
    } else if (e.key.match(/^[a-z]$/)) {
        appendLetter(e.key);
    }
});

loadWords(words => WORD_LIST.setWords(words));