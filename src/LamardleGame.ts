import { HEADER_ICON_SIZE, MAX_WIDTH, GRID_PADDING_WIDTH, KEYBOARD_HEIGHT, HEADER_HEIGHT, DOWN_ARROW, NO_ARROW, UP_ARROW, SOLUTION_MARKER, NUM_LETTERS, REQUIRED_MATCHES, NUM_ROWS } from './constants';
import { GameKeyboard } from "./GameKeyboard";
import { GameGrid, GridSolution } from './GameGrid';
import { GameTutorial } from "./GameTutorial";
import { GameSolver } from "./GameSolver";
import { GameData } from "./GameData";
import { WordList } from "./WordList";
import { RandomWordProvider, MinimumStepsWordProvider } from './WordProvider';

type HeaderIconOptions = {
    altText?: string;
    title?: string;
};

type HeaderLinkOptions = HeaderIconOptions & {
    newTab?: boolean;
}

export class LamardleGame extends HTMLElement {
    private gameData: GameData;
    private container: HTMLDivElement;
    private winPopup: HTMLDivElement;
    private keyboard: GameKeyboard;
    private winMessage: HTMLDivElement;
    private winMessageText: HTMLDivElement;
    private winMessageShare: HTMLDivElement;
    private header: HTMLDivElement;
    private spacerLeft: HTMLDivElement;
    private titleText: HTMLDivElement;
    private spacerRight: HTMLDivElement;
    private urlSeed: string;
    private seed: string;
    private mode: string;
    private tutorial: GameTutorial;
    private grid: GameGrid;
    private solver: GameSolver;
    private wordList: WordList;
    private winMessageHardmode: HTMLAnchorElement;

    constructor() {
        super();

        this.gameData = new GameData(new Date());
        this.wordList = new WordList();
        this.mode = new URL(document.location.href).searchParams.get('mode');

        this.container = document.createElement('div');
        this.container.classList.add('container');
        this.appendChild(this.container);

        this.winPopup = document.createElement('div');
        this.winPopup.classList.add('overlay', 'hidden');
        this.container.appendChild(this.winPopup);
        this.winPopup.onclick = () => {
            this.winPopup.classList.add('hidden');
            this.keyboard.disable();
            // this.keyboard.hide();
        };

        this.winMessage = document.createElement('div');
        this.winMessage.classList.add('winMessage');
        this.winPopup.appendChild(this.winMessage);

        this.winMessageText = document.createElement('div');
        this.winMessage.appendChild(this.winMessageText);

        this.winMessageShare = document.createElement('div');
        this.winMessageShare.classList.add('win-msg-button', 'share-result');
        this.winMessageShare.innerText = 'Share!';
        this.winMessage.appendChild(this.winMessageShare);

        this.winMessageHardmode = document.createElement('a');
        this.winMessageHardmode.classList.add('win-msg-button', 'try-hard-mode');
        this.winMessageHardmode.innerText = 'Try Hard Mode!';
        const hardModeUrl = new URL(document.location.href);
        hardModeUrl.searchParams.set('mode', 'hard')
        this.winMessageHardmode.setAttribute('target', '_blank');
        this.winMessageHardmode.href = hardModeUrl.toString();
        this.winMessageHardmode.onclick = e => {
            e.stopPropagation();
        }
        if (this.mode === 'hard') {
            this.winMessageHardmode.classList.add('hidden');
        }
        this.winMessage.appendChild(this.winMessageHardmode);

        this.header = document.createElement('div');
        this.header.classList.add('header');
        this.container.appendChild(this.header);

        this.spacerLeft = document.createElement('div');
        this.spacerLeft.classList.add('spacer-left');
        this.header.appendChild(this.spacerLeft);

        this.spacerLeft.appendChild(this.createHeaderLink(
            'home.svg',
            this.getDailyPuzzleLink(),
            { altText: 'go to daily puzzle' }
        ));

        this.spacerLeft.appendChild(this.createHeaderLink(
            'dice-3.svg',
            this.getRandomPuzzleLink(),
            { altText: 'go to random puzzle' }
        ));

        this.titleText = document.createElement('div');
        this.titleText.innerText = 'LAMARDLE';
        this.titleText.classList.add('title-text');
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

        this.urlSeed = new URL(document.location.href).searchParams.get('seed');
        const dateSeed = this.gameData.formatDate(this.gameData.getDate());
        this.seed = this.urlSeed ?? dateSeed;

        const gridConfig = {
            seed: this.seed,
            rows: NUM_ROWS,
            letters: NUM_LETTERS,
            matches: REQUIRED_MATCHES,
        };

        this.tutorial = new GameTutorial(
            this.gameData,
            gridConfig,
            this.getGridArea()
        );
        this.container.appendChild(this.tutorial);

        helpButton.onclick = () => this.tutorial.show();

        this.grid = new GameGrid(gridConfig, {
            onWin: solution => this.winGame(solution),
        });
        this.container.append(this.grid);

        this.keyboard = new GameKeyboard(this.grid);
        this.container.append(this.keyboard);

        this.solver = new GameSolver();

        this.resizeGrid();
        window.addEventListener('resize', () => this.resizeGrid());

        this.wordList.loadWords().then(words => {
            if (this.mode === 'hard') {
                new MinimumStepsWordProvider(words, this.seed, 5, this.solver)
                    .onceInitialized(provider => {
                        this.grid.initialize(words, provider);
                    })
            } else {
                this.grid.initialize(
                    words, 
                    new RandomWordProvider(words, this.seed)
                );
            }
        });

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

    createHeaderLink(
        iconPath: string, 
        linkPath: string, 
        options: HeaderLinkOptions = {}
    ): HTMLAnchorElement {
        const link = document.createElement('a');
        link.setAttribute('href', linkPath);
        if (options.newTab)
            link.setAttribute('target', '_blank');
        link.appendChild(this.createHeaderIcon(iconPath, options));
        return link;
    }

    createHeaderIcon(
        path: string, 
        options: HeaderIconOptions = {}
    ): HTMLImageElement {
        const icon = document.createElement('img');
        icon.setAttribute('src', path);
        icon.setAttribute('width', HEADER_ICON_SIZE.toString());
        icon.setAttribute('height', HEADER_ICON_SIZE.toString());
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
        this.grid.getContainer().style.marginBottom = leftover + 'px';
    }

    computeMatching(solution: string, matches: string[]) {
        const matchingLetters = [];
        var current = solution;

        // iterate the array in reverse
        for (let i = 0; i < matches.length; i++) {
            const next = matches[matches.length - i - 1];
            const currentMatch = current
                .split('')
                .map((letter, pos) => [letter, next.charAt(pos)])
                .map(([a, b]) => a === b);
            matchingLetters.push(currentMatch);
            current = next;
        }
        // reverse the output
        matchingLetters.reverse();

        return matchingLetters;
    }

    formatMatching(
        sequence: boolean[][], 
        matchChar: string, 
        nonMatchChar: string
    ): string[] {
        return sequence
            .map(rowMatch => rowMatch
                .map(letterMatch => letterMatch ? matchChar : nonMatchChar)
                .join('')
            );
    }

    createShareMessage(solution: GridSolution, href: string) {
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
                href,
                this.grid.getNumGuesses().toString() + ' tries',
            ],
            upperSequence,
            [solution.solution.split('').map(() => SOLUTION_MARKER).join('')],
            lowerSequence
        ).join('\n');
    }

    computePar() {
        const minSolution = this.solver.solve(
            this.grid.getUpperStart(),
            this.grid.getLowerStart()
        );
        return Math.max(1, minSolution.length - 2);
    }

    async winGame(solution: GridSolution) {
        const messageLines = [];
        messageLines.push('You won in ' + this.grid.getNumGuesses() + ' tries!');

        await this.solver.loadGraph();

        messageLines.push('Par: ' + this.computePar());

        if (this.seed === this.gameData.formatDate(this.gameData.getDate())) {
            this.gameData.addStreak();
            messageLines.push('Current Streak: ' + this.gameData.getStreak());
        }

        this.winPopup.classList.remove('hidden');

        this.winMessageText.innerText = messageLines.join('\n');

        this.winMessageShare.onclick = e => {
            e.stopPropagation();
            const shareUrl = new URL(document.location.href);
            console.log(document.location.href)
            shareUrl.searchParams.set('seed', this.seed);
            const shareMessage = this.createShareMessage(
                solution,
                shareUrl.toString()
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

    getDailyPuzzleLink() {
        return './';
    }

    getRandomPuzzleLink() {
        return './?seed=' + this.randomString();
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
