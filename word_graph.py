#!/usr/bin/env python3

from argparse import ArgumentParser
from collections import defaultdict
import json
from typing import List

def load_file(path: str):
    with open(path) as f:
        return list(map(str.strip, f.readlines()))


def find_matches(word, num_letters, word_index):
    found_words = defaultdict(int)
    for i, letter in enumerate(word):
        for found_word in word_index[i][letter]:
            if found_word == word:
                continue
            found_words[found_word] += 1
    
    return [w for w, cnt in found_words.items() if cnt >= num_letters]


def track_progress(itr, every=100):
    for i, item in enumerate(itr):
        if i % every == 0:
            print(f"processed {i} items")
        yield item


def create_graph(words: List[str], num_matches):
    if len(words) == 0:
        return []
    word_len = len(words[0])
    word_index = [
        {chr(letter):set() for letter in range(ord('a'), ord('z') + 1)} 
        for _ in range(0, word_len)
    ]
    for word in words:
        if not len(word) == word_len:
            raise "inconsistent word length"
        for i, letter in enumerate(word):
            word_index[i][letter].add(word)

    graph = dict()
    for word in track_progress(words, every=1000):
        graph[word] = find_matches(word, num_matches, word_index)
    return graph


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument(
        "--num-matches",
        required=True,
        type=int,
    )
    parser.add_argument(
        "--input",
        required=True,
    )
    parser.add_argument(
        "--output",
        required=True,
    )

    cli = parser.parse_args()

    graph = create_graph(load_file(cli.input), cli.num_matches)

    with open(cli.output, 'w') as f:
        json.dump(graph, f)


