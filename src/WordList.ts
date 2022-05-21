export class WordList {
    private numLetters: any;
    private isReady: boolean;
    private onReady: ((words: string[]) => void)[];
    private words: string[];

    constructor(numLetters: number) {
        this.numLetters = numLetters;
        this.isReady = false;
        this.onReady = [];
        this.words = [];
    }

    addListener(callback: (words: string[]) => void) {
        this.onReady.push(callback);
        if (this.isReady) {
            callback(this.words);
        }
    }

    setWords(rawWords: string) {
        this.words = rawWords.split('\n');
        this.isReady = true;
        this.onReady.forEach(callback => callback(this.words));
    }
}
