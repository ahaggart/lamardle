var numGuesses = 0;

const REQUIRED_MATCHES = 3;

function getCurrentRow() {
    return document.getElementById("guess-" + numGuesses);
}

function getPreviousRow() {
    return document.getElementById("guess-" + (numGuesses - 1));
}

function handleChange(e) {
    if (e.target.value.length > 5) {
        e.target.value = e.target.value.substring(0, 5);
        return;
    }
    const value = e.target.value;
    const row = getCurrentRow();
    row.setLetters(value);
};

document.getElementById("text").addEventListener('input', handleChange);

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
    
    document.getElementById("text").value = "";
}

function onSubmit(e) {
    e.preventDefault();
    guess();
}

document.getElementById("guesser").addEventListener('submit', onSubmit);

class GridLetter extends HTMLSpanElement {
    constructor(guessId, pos, letter) {
        super();
        this.pos = pos;
        this.guessId = guessId;
        this.id = 'letter-' + guessId + '-' + pos;
        this.innerText = letter || this.getAttribute("letter") || "";
        this.classList.add('letter');
    }

    setLetter(letter) {
        this.innerText = letter;
        this.style.backgroundColor = 'var(--non-matches-color)';
    }

    setHighlight(isHighlighted) {
        this.style.borderColor = isHighlighted ? 'var(--highlight-color)' : 'var(--non-highlight-color)';
    }
}

customElements.define('grid-letter', GridLetter, { extends: 'span' });

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
        this.id = this.id || ('guess-' + this.guessId);

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

console.log("got here");