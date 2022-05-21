import { GridRow } from "./GridRow";
import { GRID_ROW_GAP, GRID_PADDING } from "./constants";
import { WORD_LIST } from "./context";

export class GameGrid extends HTMLElement {
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
        this.upperStart = this.getRandomWord(this.config.seed);
        this.upper.setLetters(this.upperStart);

        this.lower = new GridRow(this.rowConfig);
        this.lowerStart = this.getRandomWord(this.config.seed + 'salt');
        this.lower.setLetters(this.lowerStart);
        this.lower.id = 'goal';

        this.current = new GridRow(this.rowConfig);
        this.current.setHighlight(true);

        const rowsAbove = Math.ceil((this.config.rows - 3) / 2.0);
        const rowsBelow = Math.floor((this.config.rows - 3) / 2.0);

        Array(rowsAbove).fill()
            .forEach(() => this.grid.appendChild(new GridRow(this.rowConfig)));
        this.grid.appendChild(this.upper);
        this.grid.appendChild(this.current);
        this.grid.appendChild(this.lower);
        Array(rowsBelow).fill()
            .forEach(() => this.grid.appendChild(new GridRow(this.rowConfig)));
    }

    setLetters(letters) {
        this.current.setLetters(letters);
        this.current.updateMatches(this.upper, this.lower);
    }

    getTileSize(gridArea) {
        const columnGapWidth = GRID_ROW_GAP * (this.config.letters - 1);
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
        const columnGapWidth = GRID_ROW_GAP * (this.config.letters - 1);
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
            hash = ((hash << 5) - hash) + code;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}
customElements.define('game-grid', GameGrid);
