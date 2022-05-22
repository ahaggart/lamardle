import { GameSolver } from './GameSolver';

export interface WordProvider {
    getUpper(): string;
    getLower(): string;
}

function getHashCode(str: string) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + code;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function getRandomWord(words: string[], seed: string) {
    return words[Math.abs(getHashCode(seed)) % words.length];
}

export class RandomWordProvider implements WordProvider {
    private words: string[];
    private seed: string;

    constructor(words: string[], seed: string) {
        this.words = words;
        this.seed = seed;
    }

    getUpper(): string {
        return getRandomWord(this.words, this.seed);
    }

    getLower(): string {
        return getRandomWord(this.words, this.seed + 'salt')
    }
}

export class MinimumStepsWordProvider implements WordProvider {
    private words: string[];
    private seed: string;
    private minSteps: number;
    private solver: GameSolver;

    constructor(
        words: string[], 
        seed: string, 
        minSteps: number,
        solver: GameSolver
    ) {
        this.words = words;
        this.seed = seed;
        this.minSteps = minSteps;
        this.solver = solver;
    }

    onceInitialized(callback: (p: MinimumStepsWordProvider) => void) {
        this.solver.loadGraph().then(() => callback(this));
    }

    getUpper(): string {
        return getRandomWord(this.words, this.seed);
    }

    getLower(): string {
        const upper = this.getUpper();
        var numLayers = this.minSteps + 1;
        var choices = this.solver.getLayer(upper, numLayers);
        // if we can't find anthing, try again with a closer layer
        while (choices.length == 0) {
            numLayers--;
            choices = this.solver.getLayer(upper, numLayers);
        }
        return getRandomWord(choices, this.seed);
    }
}
