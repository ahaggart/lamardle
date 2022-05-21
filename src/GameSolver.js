export class GameSolver {
    constructor() {
    }

    solve(start, end) {
        const paths = new Map();
        paths.set(start, null);
        var visiting = [start];
        var toVisit = [];
        while (visiting.length > 0) {
            const current = visiting.pop();
            var done = false;
            this.graph[current].forEach(word => {
                if (!paths.has(word)) {
                    paths.set(word, current);
                    toVisit.push(word);
                    if (word === end)
                        done = true;
                }
            });

            if (done) {
                break;
            }

            if (visiting.length === 0 && toVisit.length !== 0) {
                visiting = toVisit;
                toVisit = [];
            }
        }

        const path = [end];
        var current = end;
        if (paths.has(end)) {
            while (current !== start) {
                current = paths.get(current);
                path.push(current);
            }
            return path;
        }

        return [];
    }

    loadGraph() {
        const request = new XMLHttpRequest();
        const promise = new Promise((resolve, reject) => {
            request.onreadystatechange = e => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        this.graph = JSON.parse(request.responseText);
                        resolve();
                    }
                }
            };
            request.open('GET', 'graph.json');
            request.send();
        });

        return promise;
    }
}
