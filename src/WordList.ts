export class WordList {
    private words: string[];
    private wordsPromise: Promise<string[]> | undefined;

    constructor() {
        this.words = [];
    }

    setWords(rawWords: string) {
        this.words = rawWords.split('\n');
    }

    loadWords() {
        if (this.wordsPromise === undefined) {
            this.wordsPromise = new Promise(resolve => {
                const request = new XMLHttpRequest();
                request.onreadystatechange = e => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        if (request.status === 200) {
                            this.setWords(request.responseText);
                            resolve(this.words);
                        }
                    }
                };
                request.open('GET', 'five-letters.txt');
                request.send();
            });
        }
        return this.wordsPromise;
    }
}
