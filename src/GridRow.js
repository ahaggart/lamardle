import { GridLetter } from "./GridLetter";
import { INVALID_ANIMATION_LENGTH_MS } from "./constants";

export class GridRow extends HTMLElement {
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
                this.tiles[i].letter === lower.tiles[i].letter
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
