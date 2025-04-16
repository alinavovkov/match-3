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


function drawTile(tile: Tile, x: number, y: number, highlight = false) {
    if (tile === -1) {
        ctx.clearRect(x, y, tileSize, tileSize);
        return;
    }

    const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
    ctx.fillStyle = highlight ? 'crimson' : colors[tile];
    ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
}

function drawBoard(board: Board, highlight?: { from: { row: number; col: number }, to: { row: number; col: number } }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const isHighlighted = highlight &&
                ((highlight.from.row === row && highlight.from.col === col) ||
                    (highlight.to.row === row && highlight.to.col === col));

            drawTile(board[row][col], col * tileSize, row * tileSize, isHighlighted);
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

function handleMatches() {
    const toRemove: boolean[][] = Array.from({ length: boardSize }, () =>
        Array(boardSize).fill(false)
    );

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize - 2; col++) {
            const t = board[row][col];
            if (
                t !== -1 &&
                t === board[row][col + 1] &&
                t === board[row][col + 2]
            ) {
                toRemove[row][col] = toRemove[row][col + 1] = toRemove[row][col + 2] = true;
            }
        }
    }

    for (let col = 0; col < boardSize; col++) {
        for (let row = 0; row < boardSize - 2; row++) {
            const t = board[row][col];
            if (
                t !== -1 &&
                t === board[row + 1][col] &&
                t === board[row + 2][col]
            ) {
                toRemove[row][col] = toRemove[row + 1][col] = toRemove[row + 2][col] = true;
            }
        }
    }

    for (let col = 0; col < boardSize; col++) {
        for (let row = boardSize - 1; row >= 0; row--) {
            if (toRemove[row][col]) {
                for (let r = row; r > 0; r--) {
                    board[r][col] = board[r - 1][col];
                }
                board[0][col] = getRandomTile();
            }
        }
    }

    drawBoard(board);

    if (hasAnyMatch(board)) {
        setTimeout(() => {
            handleMatches();
        }, 200);
    }
}

// 🎮 Запуск гри
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
    } else {
        const dr = Math.abs(selected.row - row);
        const dc = Math.abs(selected.col - col);

        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            swapTiles(board, selected, { row, col });
            drawBoard(board);

            if (hasAnyMatch(board)) {
                setTimeout(() => {
                    handleMatches();
                }, 200);
            } else {
                const from = selected;
                const to = { row, col };
                drawBoard(board, { from, to });

                setTimeout(() => {
                    swapTiles(board, from, to);
                    drawBoard(board);
                }, 300);
            }
        }

        selected = null;
    }
});
