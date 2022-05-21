import { GameGrid } from './GameGrid';

export class GameKeyboard extends HTMLElement {
    private grid: GameGrid;
    private letters: string;
    private enabled: boolean;
    private container: HTMLDivElement;

    constructor(grid: GameGrid) {
        super();

        this.grid = grid;

        this.letters = '';

        this.enabled = true;

        this.container = document.createElement('div');
        this.container.style.margin = "0 5px";
        this.container.appendChild(this.createRow('qwertyuiop'));
        this.container.appendChild(this.createRow(' asdfghjkl '));
        this.container.appendChild(this.createRow('+zxcvbnm-'));
        this.appendChild(this.container);
    }

    backspace() {
        if (!this.enabled || this.letters.length == 0) {
            return;
        }
        this.letters = this.letters.substring(0, this.letters.length - 1);
        this.grid.setLetters(this.letters);
    }

    appendLetter(letter: string) {
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

    createRow(letters: string) {
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

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}
customElements.define('game-keyboard', GameKeyboard);
