type WordGraph = {
    [word: string]: string[];
};

export class GameSolver {
    graph: WordGraph;
    private onLoad: Promise<GameSolver> | undefined;

    constructor() {
    }

    getLayer(start: string, targetLayerNumber: number): string[] {
        const layer: string[] = [];
        const visitor = function(
            word: string, 
            parent: string, 
            layerNumber: number
        ): boolean {
            if (layerNumber > targetLayerNumber) {
                return true;
            } else if (layerNumber == targetLayerNumber) {
                layer.push(word);
                return false;
            } else {
                return false;
            }
        }

        this.traverse(start, visitor);

        return layer;
    }

    solve(start: string, end: string): string[] {
        const paths = new Map();
        const visitor = function(
            word: string, 
            parent: string, 
            layerNumber: number
        ): boolean {
            paths.set(word, parent);
            return word === end;
        }

        this.traverse(start, visitor);

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

    traverse(
        start: string, 
        visitor: (word: string, parentWord: string, layer: number) => boolean
    ): void {
        const visited = new Set();
        var currentLayerNumber = 0;
        var currentLayer: string[] = [];
        var nextLayer: string[] = [];

        // bootstrap the traversal
        visited.add(start);
        currentLayer.push(start);
        var done = visitor(start, null, currentLayerNumber);

        while (currentLayer.length > 0) {
            const current = currentLayer.pop();
            var done = false;
            this.graph[current].forEach(word => {
                if (!visited.has(word)) {
                    visited.add(word);
                    nextLayer.push(word);
                    done = visitor(word, current, currentLayerNumber + 1) || done;
                }
            });

            if (done) {
                break;
            }

            if (currentLayer.length === 0 && nextLayer.length !== 0) {
                currentLayerNumber++;
                currentLayer = nextLayer;
                nextLayer = [];
            }
        }
    }

    loadGraph(): Promise<GameSolver> {
        if (this.onLoad === undefined) {
            this.onLoad = new Promise<GameSolver>((resolve) => {
                const request = new XMLHttpRequest();
                request.onreadystatechange = e => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        if (request.status === 200) {
                            this.graph = JSON.parse(request.responseText);
                            resolve(this);
                        }
                    }
                };
                request.open('GET', 'graph.json');
                request.send();
            });
        }

        return this.onLoad;
    }
}
