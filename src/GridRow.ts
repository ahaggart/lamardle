import { GridLetter } from "./GridLetter";
import { INVALID_ANIMATION_LENGTH_MS } from "./constants";

export type GridRowConfig = {
    letters: number;
    matches: number;
};

export class GridRow extends HTMLElement {
    private tiles: GridLetter[] = [];
    private letters: string = '';
    private config: GridRowConfig;

    constructor(config: GridRowConfig) {
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

    getLetters() {
        return this.letters;
    }

    setLetters(letters: string) {
        this.letters = letters || '';
        const paddedLetters = this.letters
            .substring(0, this.config.letters)
            .padEnd(this.config.letters, ' ');

        for (let i = 0; i < this.config.letters; i++) {
            this.tiles[i].setLetter(paddedLetters[i]);
        }
    }

    updateMatches(upper: GridRow, lower: GridRow) {
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].setMatch(
                this.tiles[i].letter === upper.tiles[i].letter,
                this.tiles[i].letter === lower.tiles[i].letter
            );
        }
    }

    setHighlight(isHighlighted: boolean) {
        this.tiles.forEach(tile => tile.setHighlight(isHighlighted));
    }

    isComplete() {
        return this.letters.length === this.config.letters;
    }

    doesMatch(other: GridRow) {
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
