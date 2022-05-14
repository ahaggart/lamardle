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
const HEADER_ICON_SIZE = 25;
const COOKIE_EXPIRATION_DAYS = 3;
const UP_ARROW = '\uD83D\uDD3C';
const DOWN_ARROW = '\uD83D\uDD3D';
const NO_ARROW = '\u23FA';
const SOLUTION_MARKER = '\u002A\uFE0F\u20E3';

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

        this.enabled = true;

        const keyboardContainer = document.createElement('div');
        keyboardContainer.style.margin = "0 5px";
        keyboardContainer.appendChild(this.createRow('qwertyuiop'));
        keyboardContainer.appendChild(this.createRow(' asdfghjkl '));
        keyboardContainer.appendChild(this.createRow('+zxcvbnm-'));
        this.appendChild(keyboardContainer);
    }

    backspace() {
        if (!this.enabled || this.letters.length == 0) {
            return;
        }
        this.letters = this.letters.substring(0, this.letters.length - 1);
        this.grid.setLetters(this.letters);
    }

    appendLetter(letter) {
        if (!this.enabled || this.letters.length == 5) {
            return;
        }
        this.letters += letter;
        this.grid.setLetters(this.letters);
    }

    submit() {
        if (this.enabled && this.grid.submit()) {
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

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
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
        this.upperMatches = [];
        this.lowerMatches = [];

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

    getRandomWord(seed) {
        return this.words[Math.abs(this.getHashCode(seed)) % this.words.length];
    }

    createRows() {
        this.upper = new GridRow(this.rowConfig);
        this.upper.setLetters(this.getRandomWord(this.config.seed));

        this.lower = new GridRow(this.rowConfig);
        this.lower.setLetters(this.getRandomWord(this.config.seed + 'salt')); 
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
            this.upperMatches.push(this.upper.letters);
            this.lowerMatches.push(this.lower.letters);
            this.winCallback({
                upper: this.upperMatches,
                solution: this.current.letters,
                lower: this.lowerMatches,
            });
            return true;
        }
        
        const newRow = new GridRow(this.rowConfig);
        newRow.setHighlight(true);
        this.current.setHighlight(false);

        if (upperMatch) {
            this.upperMatches.push(this.upper.letters);
            this.grid.children[0].remove();
            this.upper = this.current;
            this.current = newRow;
            this.grid.insertBefore(this.current, this.lower);
        } else {
            this.lowerMatches.push(this.lower.letters);
            this.grid.children[this.grid.children.length - 1].remove();
            this.lower = this.current;
            this.current = newRow;
            this.grid.insertBefore(this.current, this.lower);
        } 

        return true;
    }

    getHashCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+code;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}

customElements.define('game-grid', GameGrid);

function paragraph(text) {
    const elem = document.createElement('p');
    elem.innerText = text.join(' ');
    return elem;
}

class GameTutorial extends HTMLElement {
    constructor(gameData, gridConfig, gridArea) {
        super();

        this.overlay = document.createElement('div');
        this.overlay.classList.add('overlay', 'tutorial', 'hidden');
        this.appendChild(this.overlay);

        this.textContainer = document.createElement('div');
        this.textContainer.style.width = gridArea.width + 'px';
        this.textContainer.style.margin = 'auto';
        this.overlay.appendChild(this.textContainer);

        const title = document.createElement('div');
        title.classList.add('tutorial-title');
        title.innerText = 'How to Play';
        this.textContainer.appendChild(title);

        this.textContainer.appendChild(paragraph([
            'The goal of LAMARDLE is to find words which "match" the words',
            'above or below them. Two words "match" when they share 3 or more',
            'letters in the same position.'
        ]));

        const example1 = new GameGrid(
            { ...gridConfig, rows: 3 },
            {
                onLoad: () => {
                    example1.upper.setLetters('hello');
                    example1.lower.setLetters('world');
                }
            }
        );

        example1.resize({width: gridArea.width, height: 200});
        this.textContainer.appendChild(example1);

        this.textContainer.appendChild(paragraph([
            'When you enter a word that matches the word above or below, it',
            'will replace that word. If the word matches both words, you win!'
        ]));

        const example2 = new GameGrid(
            { ...gridConfig, rows: 3 },
            {
                onLoad: () => {
                    example2.upper.setLetters('hello');
                    example2.lower.setLetters('world');
                    example2.setLetters('would');
                }
            }
        );

        example2.resize({width: gridArea.width, height: 200});
        this.textContainer.appendChild(example2);

        this.textContainer.appendChild(paragraph([
            'In the example above, the middle word "would" matches "w", "o",',
            '"l", and "d" from "world". It also matches "l" from "hello". When',
            'entered, the lower word "world" is replaced with "would", so the',
            'next word should match either "hello" or "would".' 
        ]));

        const example3 = new GameGrid(
            { ...gridConfig, rows: 3 },
            {
                onLoad: () => {
                    example3.upper.setLetters('hello');
                    example3.lower.setLetters('world');
                    example3.setLetters('would');
                    example3.submit();
                }
            }
        );

        example3.resize({width: gridArea.width, height: 200});

        this.textContainer.appendChild(example3);

        this.textContainer.appendChild(paragraph([
            'Tap anywhere to continue. Happy Mother\'s Day!' 
        ]));

        if (!gameData.hasVisited()) {
            this.show();
        }
        this.overlay.onclick = () => {
            this.hide();
            gameData.setVisited();
        };
    }

    show() {
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.overlay.classList.add('hidden');
    }
}

customElements.define('game-tutorial', GameTutorial);

class GameData {
    schema = {
        visited: (value) => value === 'true',
        streak: (value) => parseInt(value),
        mostRecent: (value) => value,
    };

    constructor(date) {
        this.date = date;
        const cookieData = this.parseCookie();

        this.data = {
            visited: cookieData.visited ?? false,
            streak: cookieData.streak ?? 0,
            mostRecent: cookieData.mostRecent ?? '',
        }

        this.checkStreak();
    }

    setVisited() {
        this.data.visited = true;
        this.saveData();
    }

    hasVisited() {
        return this.data.visited;
    }

    checkStreak() {
        if (this.data.mostRecent === this.formatDate(this.date)) {
            return;
        } 

        const dayBefore = new Date(this.date);
        dayBefore.setDate(this.date.getDate() - 1);
        
        if (this.data.mostRecent !== this.formatDate(dayBefore)) {
            this.data.streak = 0;
        }
    }

    addStreak() {
        if (this.data.mostRecent === this.formatDate(this.date)) {
            return;
        } 

        this.data.streak++;
        this.data.mostRecent = this.formatDate(this.date);
        this.saveData();
    }

    saveData() {
        const cookieExpirationDate = new Date();
        cookieExpirationDate.setDate(new Date().getDate() + COOKIE_EXPIRATION_DAYS);
        const expirationString = 'expires=' + cookieExpirationDate.toUTCString();
        for (let prop in this.data) {
            document.cookie = prop + '=' + this.data[prop] + ';' + expirationString;
        }
    }

    parseCookie() {
        const data = {}
        if (document.cookie) {
            decodeURI(document.cookie)
                .split(';')
                .map(entry => entry.split("="))
                .forEach(keyValue => {
                    const key = keyValue[0].trim();
                    const value = keyValue[1];
                    if (this.schema.hasOwnProperty(key)) {
                        data[key] = this.schema[key](value);
                    }
                });
        }
        return data;
    }

    formatDate(date) {
        return [
            date.getFullYear().toString(),
            (date.getMonth() + 1).toString().padStart(2, '0'),
            date.getDate().toString().padStart(2, '0'),
        ].join('');
    }

}

class LamardleGame extends HTMLElement {
    constructor() {
        super();

        this.gameData = new GameData(new Date());

        this.container = document.createElement('div');
        this.container.classList.add('container');
        this.appendChild(this.container);

        this.winPopup = document.createElement('div');
        this.winPopup.classList.add('overlay', 'hidden');
        this.container.appendChild(this.winPopup);
        this.winPopup.onclick = () => {
            this.winPopup.classList.add('hidden');
            this.keyboard.disable();
        }

        this.winMessage = document.createElement('div');
        this.winMessage.classList.add('winMessage');
        this.winPopup.appendChild(this.winMessage);

        this.winMessageText = document.createElement('div');
        this.winMessage.appendChild(this.winMessageText);

        this.winMessageShare = document.createElement('div');
        this.winMessageShare.classList.add('share-result');
        this.winMessageShare.innerText = 'Share!';
        this.winMessage.appendChild(this.winMessageShare);

        this.header = document.createElement('div');
        this.header.classList.add('header');
        this.container.appendChild(this.header);

        this.spacerLeft = document.createElement('div');
        this.spacerLeft.classList.add('spacer-left');
        this.header.appendChild(this.spacerLeft);

        this.spacerLeft.appendChild(this.createHeaderLink(
            'home.svg', 
            './',
            { altText: 'go to daily puzzle' }
        ));

        this.spacerLeft.appendChild(this.createHeaderLink(
            'dice-3.svg',
            './?seed=' + this.randomString(),
            { altText: 'go to random puzzle' }
        ));

        this.titleText = document.createElement('div');
        this.titleText.innerText = 'LAMARDLE';
        this.titleText.classList.add('title-text')
        this.header.appendChild(this.titleText);

        this.spacerRight = document.createElement('div');
        this.spacerRight.classList.add('spacer-right');
        this.header.appendChild(this.spacerRight);

        this.spacerRight.appendChild(this.createHeaderLink(
            'source.svg',
            'https://github.com/ahaggart/lamardle',
            { newTab: true, altText: 'go to source code' }
        ));
        
        const helpButton = this.createHeaderIcon('help.svg', {
            altText: 'show tutorial'
        });
        this.spacerRight.appendChild(helpButton);

        this.urlSeed = new URL(document.location).searchParams.get('seed');
        const dateSeed = this.gameData.formatDate(this.gameData.date);
        this.seed = this.urlSeed ?? dateSeed;

        const gridConfig = {
            seed: this.seed,
            rows: 7,
            letters: 5,
            matches: 3,
        }

        this.tutorial = new GameTutorial(
            this.gameData, 
            gridConfig, 
            this.getGridArea(),
        );
        this.container.appendChild(this.tutorial);

        helpButton.onclick = () => this.tutorial.show();

        this.grid = new GameGrid(gridConfig, {
            onWin: solution => this.winGame(solution)
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

    createHeaderLink(iconPath, linkPath, options = {}) {
        const link = document.createElement('a');
        link.setAttribute('href', linkPath);
        if (options.newTab) link.setAttribute('target', '_blank');
        link.appendChild(this.createHeaderIcon(iconPath, options));
        return link;
    }
    
    createHeaderIcon(path, options = {}) {
        const icon = document.createElement('img');
        icon.setAttribute('src', path);
        icon.setAttribute('width', HEADER_ICON_SIZE);
        icon.setAttribute('height', HEADER_ICON_SIZE);
        if (options.altText) {
            icon.setAttribute('alt', options.altText);
        }
        if (options.title || options.altText) {
            icon.setAttribute('title', options.title ?? options.altText);
        }
        return icon;
    }

    getGridArea() {
        return {
            width: Math.min(MAX_WIDTH, window.innerWidth - GRID_PADDING_WIDTH),
            height: window.innerHeight - KEYBOARD_HEIGHT - HEADER_HEIGHT,
        };
    }

    resizeGrid() {
        const leftover = this.grid.resize(this.getGridArea());
        this.grid.grid.style.marginBottom = leftover + 'px';
    }

    computeMatching(solution, matches) {
        const matchingLetters = [];
        var current = solution;

        // iterate the array in reverse
        for (let i = 0; i < matches.length; i++) {
            const next = matches[matches.length - i - 1];
            const currentMatch = current
                .split('')
                .map((letter, pos) => [letter, next.charAt(pos)])
                .map(([a, b]) => a === b)
            matchingLetters.push(currentMatch);
            current = next;
        }
        // reverse the output
        matchingLetters.reverse();

        return matchingLetters;
    }

    formatMatching(sequence, matchChar, nonMatchChar) {
        return sequence
            .map(rowMatch => 
                rowMatch
                    .map(letterMatch => letterMatch ? matchChar : nonMatchChar)
                    .join('')
            )
    }

    createShareMessage(solution, title) {
        const upperSequence = this.formatMatching(
            this.computeMatching(solution.solution, solution.upper),
            DOWN_ARROW, NO_ARROW
        );

        const lowerSequence = this.formatMatching(
            this.computeMatching(solution.solution, solution.lower),
            UP_ARROW, NO_ARROW
        );

        lowerSequence.reverse();

        return Array.prototype.concat(
            [
                'lamardle',
                title,
                this.grid.numGuesses + ' tries',
            ],
            upperSequence,
            [solution.solution.split('').map(() => SOLUTION_MARKER).join('')],
            lowerSequence,
        ).join('\n');
    }

    winGame(solution) {
        const messageLines = [];
        messageLines.push('You won in ' + this.grid.numGuesses + ' tries!');
        this.winPopup.classList.remove('hidden');
        
        if (this.seed === this.gameData.formatDate(this.gameData.date)) {
            this.gameData.addStreak();
            messageLines.push('Current Streak: ' + this.gameData.data.streak);
        }
        this.winMessageText.innerText = messageLines.join('\n');
        this.winMessageShare.onclick = e => {
            e.stopPropagation();
            const shareMessage = this.createShareMessage(
                solution,
                document.location.origin + '?seed=' + this.seed,
            );
            const failMessage = 'Failed to Share :(';
            
            const oldText = this.winMessageShare.innerText;
            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    text: shareMessage,
                })
                .catch(() => this.winMessageShare.innerText = failMessage);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareMessage);
                this.winMessageShare.innerText = 'Copied to clipboard!';
                window.setTimeout(() => this.winMessageShare.innerText = oldText, 3000);
            } else {
                this.winMessageShare.innerText = failMessage;
            }
        };
    }

    randomString() {
        const codes = [];
        for (let i = 0; i < 16; i++) {
            codes.push(Math.floor(Math.random() * 10));
        }
        return codes.join('');
    }
}

customElements.define('lamardle-game', LamardleGame);

loadWords(words => WORD_LIST.setWords(words));