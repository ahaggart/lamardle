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
const HEADER_HEIGHT = 50;
const INVALID_ANIMATION_LENGTH_MS = 400;
const KEYBOARD_HEIGHT = KEY_HEIGHT * 3 + KEY_MARGIN * 2;
const GRID_PADDING_WIDTH = GRID_PADDING * 2;

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
    constructor(config) {
        super();
        this.config = config;
        this.classList.add('grid-row');

        for (let i = 0; i < this.config.letters; i++) {
            const tile = new GridLetter('', i);
            this.tiles.push(tile);
            this.appendChild(tile);
        }

        this.setLetters(this.getAttribute("letters"));
    }

    setLetters(letters) {
        this.letters = letters || '';
        const paddedLetters = this.letters
            .substring(0, this.config.letters)
            .padEnd(this.config.letters, ' ');

        for (let i = 0; i < this.config.letters; i++) {
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

    setHighlight(isHighlighted) {
        this.tiles.forEach(tile => tile.setHighlight(isHighlighted));
    }

    isComplete() {
        return this.letters.length === this.config.letters;
    }

    doesMatch(other) {
        if (!this.isComplete() || !other.isComplete()) {
            return false;
        }

        var matchCount = 0;
        for (let i = 0; i < this.config.letters; i++) {
            if (this.letters[i] === other.letters[i]) {
                matchCount++;
            }
        }
    
        if (matchCount < this.config.matches) {
            return false;
        }

        return true;
    }

    wiggle() {
        this.setAttribute('wiggle', '');
        window.setTimeout(() => this.removeAttribute('wiggle'), INVALID_ANIMATION_LENGTH_MS);
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
                key.classList.add('key', 'one-point-five', 'enter');
                key.innerText = 'enter';
                key.addEventListener('click', () => this.submit());
                row.appendChild(key);
            } else if (letter === '-') {
                const key = document.createElement('button');
                key.classList.add('key', 'one-point-five', 'delete');
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
    constructor(config, callbacks) {
        super();

        this.config = config;
        this.winCallback = callbacks.onWin;

        this.rowConfig = {
            letters: this.config.letters,
            matches: this.config.matches,
        };

        this.numGuesses = 0;

        this.id = 'game-grid';
        this.grid = document.createElement('div');
        this.grid.classList.add('grid');
        this.grid.id = 'grid';
        this.grid.style.setProperty('--num-rows', this.config.rows);
        this.appendChild(this.grid);

        WORD_LIST.addListener(words => {
            this.words = words;
            this.createRows();
            if (callbacks.onLoad) {
                callbacks.onLoad(this);
            }
        });
    }

    getRandomWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    createRows() {
        this.upper = new GridRow(this.rowConfig);
        this.upper.setLetters(this.getRandomWord());

        this.lower = new GridRow(this.rowConfig);
        this.lower.setLetters(this.getRandomWord()); 
        this.lower.id = 'goal';

        this.current = new GridRow(this.rowConfig);
        this.current.setHighlight(true);

        const rowsAbove = Math.ceil((this.config.rows - 3) / 2.0);
        const rowsBelow = Math.floor((this.config.rows - 3) / 2.0);

        Array(rowsAbove).fill()
            .forEach(() => this.grid.appendChild(new GridRow(this.rowConfig)))
        this.grid.appendChild(this.upper);
        this.grid.appendChild(this.current);
        this.grid.appendChild(this.lower);
        Array(rowsBelow).fill()
            .forEach(() => this.grid.appendChild(new GridRow(this.rowConfig)))
    }

    setLetters(letters) {
        this.current.setLetters(letters);
        this.current.updateMatches(this.upper, this.lower);
    }

    getTileSize(gridArea) {
        const columnGapWidth = GRID_ROW_GAP * (this.config.letters - 1)
        const maxTileWidth = Math.floor((gridArea.width - columnGapWidth) / this.config.letters);
    
        const gridPaddingHeight = GRID_PADDING * 2;
        const rowGapHeight = GRID_ROW_GAP * (this.config.rows - 1);
        const maxTileHeight = Math.floor((gridArea.height - rowGapHeight - gridPaddingHeight) / this.config.rows);
    
        return Math.min(maxTileWidth, maxTileHeight);
    }

    /**
     * 
     * @param {width, height} size 
     * @returns amount of "leftover" space under the grid
     */
    resize(size) {
        const columnGapWidth = GRID_ROW_GAP * (this.config.letters - 1)
        const rowGapHeight = GRID_ROW_GAP * (this.config.rows - 1);
        const tileSize = this.getTileSize(size);
        const gridWidth = tileSize * this.config.letters + columnGapWidth;
        const gridHeight = tileSize * this.config.rows + rowGapHeight;
    
        this.grid.style.width = gridWidth + 'px';
        this.grid.style.height = gridHeight + 'px';
        return (size.height - gridHeight - 10);
    }

    submit() {
        if (!this.current.isComplete()) {
            this.current.wiggle();
            return false;
        }

        if (!this.words.includes(this.current.letters)) {
            this.current.wiggle();
            return false;
        }

        const upperMatch = this.current.doesMatch(this.upper);
        const lowerMatch = this.current.doesMatch(this.lower);

        if (!upperMatch && !lowerMatch) {
            this.current.wiggle();
            return false;
        }

        this.numGuesses++;

        if (upperMatch && lowerMatch) {
            this.winCallback();
            return true;
        }
        
        const newRow = new GridRow(this.rowConfig);
        newRow.setHighlight(true);
        this.current.setHighlight(false);

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

class GameTutorial extends HTMLElement {
    constructor(gridConfig, gridArea) {
        super();

        this.overlay = document.createElement('div');
        this.overlay.classList.add('overlay', 'tutorial');
        this.overlay.style.display = 'block';
        this.overlay.onclick = () => this.overlay.style.display = 'none';
        this.appendChild(this.overlay);

        this.textContainer = document.createElement('div');
        this.textContainer.style.width = gridArea.width + 'px';
        this.textContainer.style.margin = 'auto';
        this.overlay.appendChild(this.textContainer);

        const title = document.createElement('div');
        title.classList.add('tutorial-title');
        title.innerText = 'How to Play';
        this.textContainer.appendChild(title);

        this.goal = document.createElement('p');
        this.goal.innerText = [
            'The goal of LAMARDLE is to find words which "match" the words',
            'above or below them. Two words "match" when they share 3 or more',
            'letters in the same position.'
        ].join(' ');
        this.textContainer.appendChild(this.goal);

        const example1 = new GameGrid(
            {letters: gridConfig.letters, rows: 3},
            {
                onLoad: grid => {
                    example1.upper.setLetters('hello');
                    example1.lower.setLetters('world');
                    example1.setLetters('would');
                }
            }
        );

        example1.resize({width: gridArea.width, height: 200});

        this.textContainer.appendChild(example1);
    }
}

customElements.define('game-tutorial', GameTutorial);

class LamardleGame extends HTMLElement {
    constructor() {
        super();

        this.container = document.createElement('div');
        this.container.classList.add('container');
        this.appendChild(this.container);

        this.winPopup = document.createElement('div');
        this.winPopup.classList.add('overlay');
        this.container.appendChild(this.winPopup);

        this.winMessage = document.createElement('div');
        this.winMessage.classList.add('winMessage');
        this.winPopup.appendChild(this.winMessage);

        this.header = document.createElement('div');
        this.header.innerText = 'LAMARDLE';
        this.header.classList.add('header');
        this.container.appendChild(this.header);

        const gridConfig = {
            rows: 7,
            letters: 5,
            matches: 3,
        }

        this.tutorial = new GameTutorial(gridConfig, this.getGridArea());
        this.container.appendChild(this.tutorial);

        this.grid = new GameGrid(gridConfig, {
            onWin: () => this.winGame()
        });
        this.container.append(this.grid)

        this.keyboard = new GameKeyboard(this.grid);
        this.container.append(this.keyboard);

        this.resizeGrid();
        window.addEventListener('resize', () => this.resizeGrid());

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

    getGridArea() {
        return {
            width: Math.min(MAX_WIDTH, window.innerWidth - GRID_PADDING_WIDTH),
            height: window.innerHeight - KEYBOARD_HEIGHT - HEADER_HEIGHT
        };
    }

    resizeGrid() {
        const leftover = this.grid.resize(this.getGridArea());
        this.grid.grid.style.marginBottom = leftover + 'px';
    }

    winGame() {
        this.winMessage.innerText = 'You won in ' + this.grid.numGuesses + ' tries!';
        this.winPopup.style.display = 'block';
    }
}

customElements.define('lamardle-game', LamardleGame);

loadWords(words => WORD_LIST.setWords(words));