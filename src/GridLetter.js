export class GridLetter extends HTMLElement {
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
