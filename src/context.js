import { NUM_LETTERS } from "./constants";
import { WordList } from "./WordList";


export const WORD_LIST = new WordList(NUM_LETTERS);
export function loadWords(callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = e => {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                callback(request.responseText);
            }
        }
    };
    request.open('GET', 'five-letters.txt');
    request.send();
}
