import { loadWords, WORD_LIST } from "./context";

require('./LamardleGame');

loadWords(words => WORD_LIST.setWords(words));
