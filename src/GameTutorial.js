import { GameGrid } from "./GameGrid";

function paragraph(text) {
    const elem = document.createElement('p');
    elem.innerText = text.join(' ');
    return elem;
}

export class GameTutorial extends HTMLElement {
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

        example1.resize({ width: gridArea.width, height: 200 });
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

        example2.resize({ width: gridArea.width, height: 200 });
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

        example3.resize({ width: gridArea.width, height: 200 });

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
