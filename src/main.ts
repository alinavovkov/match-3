const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const tileSize = 64;
const boardSize = 8;
const tileTypes = 5;

type Tile = number;
type Board = Tile[][];

type FallingTile = {
    type: Tile;
    row: number;
    col: number;
    y: number;
    speed: number;
};

let selected: { row: number; col: number } | null = null;
let board: Board = createEmptyBoard();
let isFalling = true;

function createEmptyBoard(): Board {
    return Array.from({ length: boardSize }, () => Array(boardSize).fill(-1));
}

function getRandomTile(): Tile {
    return Math.floor(Math.random() * tileTypes);
}

function createFallingTiles(): FallingTile[] {
    const tiles: FallingTile[] = [];

    for (let col = 0; col < boardSize; col++) {
        const usedTiles: Tile[] = [];

        for (let i = 0; i < boardSize; i++) {
            const row = boardSize - 1 - i;

            let tile: Tile;
            do {
                tile = getRandomTile();
            } while (
                usedTiles.length >= 2 &&
                tile === usedTiles[usedTiles.length - 1] &&
                tile === usedTiles[usedTiles.length - 2]
            );
            usedTiles.push(tile);

            tiles.push({
                type: tile,
                row: row,
                col: col,
                y: - (i + 1) * tileSize * 2,
                speed: 5 + Math.random() * 2
            });
        }
    }

    return tiles;
}

function animateFallingTiles(tiles: FallingTile[], onFinish: (board: Board) => void) {
    function step() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let allLanded = true;

        for (const tile of tiles) {
            const targetY = tile.row * tileSize;

            if (tile.y < targetY) {
                tile.y += tile.speed;
                if (tile.y > targetY) tile.y = targetY;
                allLanded = false;
            }

            drawTile(tile.type, tile.col * tileSize, tile.y);
        }

        if (allLanded) {
            const board = createEmptyBoard();
            for (const tile of tiles) {
                board[tile.row][tile.col] = tile.type;
            }
            onFinish(board);
        } else {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function drawTile(tile: Tile, x: number, y: number, highlight: false | 'selected' | 'error' = false) {
    if (tile === -1) {
        ctx.clearRect(x, y, tileSize, tileSize);
        return;
    }

    const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
    ctx.fillStyle = colors[tile];
    ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

    if (highlight) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;

        if (highlight === 'error') {
            ctx.strokeStyle = 'crimson';
            ctx.shadowColor = 'crimson';
        } else {
            ctx.strokeStyle = '#9ecaed';
            ctx.shadowColor = '#9ecaed';
        }

        ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
        ctx.restore();
    }
}

function drawBoard(
    board: Board,
    highlight?: {
        from?: { row: number; col: number },
        to?: { row: number; col: number },
        state?: 'selected' | 'error'
    }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            let highlightType: false | 'selected' | 'error' = false;

            if (
                (highlight?.from?.row === row && highlight?.from?.col === col) ||
                (highlight?.to?.row === row && highlight?.to?.col === col)
            ) {
                highlightType = highlight.state || 'selected';
            }

            drawTile(board[row][col], col * tileSize, row * tileSize, highlightType);
        }
    }
}

function swapTiles(board: Board, a: { row: number; col: number }, b: { row: number; col: number }) {
    const temp = board[a.row][a.col];
    board[a.row][a.col] = board[b.row][b.col];
    board[b.row][b.col] = temp;
}

function hasMatchAt(board: Board, row: number, col: number): boolean {
    const tile = board[row][col];

    if (tile === -1) return false;

    if (
        col >= 2 &&
        tile === board[row][col - 1] &&
        tile === board[row][col - 2]
    ) return true;

    if (
        row >= 2 &&
        tile === board[row - 1][col] &&
        tile === board[row - 2][col]
    ) return true;

    return false;
}

function hasAnyMatch(board: Board): boolean {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (hasMatchAt(board, row, col)) return true;
        }
    }
    return false;
}

function runMatchCycle() {
    const matches = findMatches(board);

    if (matches.length === 0) {
        isFalling = false;
        return;
    }

    isFalling = true;
    removeMatches(board, matches);
    drawBoard(board);

    setTimeout(() => {
        collapseBoard(board);
        refillBoard(board);
        drawBoard(board);

        setTimeout(() => {
            runMatchCycle();
        }, 250);
    }, 300);
}

function findMatches(board: Board): { row: number; col: number }[] {
    const matches: { row: number; col: number }[] = [];
    const added = new Set<string>();

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize - 2; col++) {
            const t = board[row][col];
            if (t !== -1 && t === board[row][col + 1] && t === board[row][col + 2]) {
                for (let k = 0; k < 3; k++) {
                    const key = `${row}:${col + k}`;
                    if (!added.has(key)) {
                        matches.push({ row, col: col + k });
                        added.add(key);
                    }
                }

                let k = col + 3;
                while (k < boardSize && board[row][k] === t) {
                    const key = `${row}:${k}`;
                    if (!added.has(key)) {
                        matches.push({ row, col: k });
                        added.add(key);
                    }
                    k++;
                }

                col = k - 1;
            }
        }
    }

    for (let col = 0; col < boardSize; col++) {
        for (let row = 0; row < boardSize - 2; row++) {
            const t = board[row][col];
            if (t !== -1 && t === board[row + 1][col] && t === board[row + 2][col]) {
                for (let k = 0; k < 3; k++) {
                    const key = `${row + k}:${col}`;
                    if (!added.has(key)) {
                        matches.push({ row: row + k, col });
                        added.add(key);
                    }
                }

                let k = row + 3;
                while (k < boardSize && board[k][col] === t) {
                    const key = `${k}:${col}`;
                    if (!added.has(key)) {
                        matches.push({ row: k, col });
                        added.add(key);
                    }
                    k++;
                }

                row = k - 1;
            }
        }
    }

    return matches;
}

function removeMatches(board: Board, matches: { row: number; col: number }[]) {
    for (const { row, col } of matches) {
        board[row][col] = -1;
    }
}

function collapseBoard(board: Board) {
    for (let col = 0; col < boardSize; col++) {
        let emptyRow = boardSize - 1;
        for (let row = boardSize - 1; row >= 0; row--) {
            if (board[row][col] !== -1) {
                board[emptyRow][col] = board[row][col];
                if (emptyRow !== row) {
                    board[row][col] = -1;
                }
                emptyRow--;
            }
        }
    }
}

function refillBoard(board: Board) {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === -1) {
                board[row][col] = getRandomTile();
            }
        }
    }
}

const fallingTiles = createFallingTiles();
animateFallingTiles(fallingTiles, (finalBoard) => {
    board = finalBoard;
    drawBoard(board);
    isFalling = false;
});



canvas.addEventListener("click", (e) => {
    if (isFalling) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (!selected) {
        selected = { row, col };
        drawBoard(board, { from: selected });
        return;
    } else {
        const dr = Math.abs(selected.row - row);
        const dc = Math.abs(selected.col - col);

        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            const from = selected;
            const to = { row, col };

            swapTiles(board, from, to);
            drawBoard(board, { from, to });

            if (hasAnyMatch(board)) {
                setTimeout(() => {
                    runMatchCycle();
                }, 200);
            } else {
                setTimeout(() => {
                    drawBoard(board, { from, to, state: 'error' });

                    setTimeout(() => {
                        swapTiles(board, from, to);
                        drawBoard(board);
                    }, 300);
                }, 500);
            }
        }
        selected = null;
    }
});
