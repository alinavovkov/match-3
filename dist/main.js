"use strict";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 64;
const boardSize = 8;
const tileTypes = 5;
let selected = null;
function getRandomTile() {
    return Math.floor(Math.random() * tileTypes);
}
function createEmptyBoard() {
    return Array.from({ length: boardSize }, () => Array(boardSize).fill(-1));
}
function hasMatchAt(board, row, col) {
    const tile = board[row][col];
    // Горизонталь
    if (col >= 2 &&
        tile === board[row][col - 1] &&
        tile === board[row][col - 2])
        return true;
    // Вертикаль
    if (row >= 2 &&
        tile === board[row - 1][col] &&
        tile === board[row - 2][col])
        return true;
    return false;
}
function generateBoard() {
    const board = createEmptyBoard();
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            let tile;
            do {
                tile = getRandomTile();
                board[row][col] = tile;
            } while (hasMatchAt(board, row, col));
        }
    }
    return board;
}
function drawBoard(board) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            drawTile(board[row][col], col * tileSize, row * tileSize);
        }
    }
}
function drawTile(tile, x, y) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
    ctx.fillStyle = colors[tile];
    ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
}
function swapTiles(board, a, b) {
    const temp = board[a.row][a.col];
    board[a.row][a.col] = board[b.row][b.col];
    board[b.row][b.col] = temp;
}
function hasAnyMatch(board) {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (hasMatchAt(board, row, col))
                return true;
        }
    }
    return false;
}
function handleMatches() {
    const toRemove = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
    // знайти всі матчі
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize - 2; col++) {
            const t = board[row][col];
            if (t === board[row][col + 1] && t === board[row][col + 2]) {
                toRemove[row][col] = toRemove[row][col + 1] = toRemove[row][col + 2] = true;
            }
        }
    }
    for (let col = 0; col < boardSize; col++) {
        for (let row = 0; row < boardSize - 2; row++) {
            const t = board[row][col];
            if (t === board[row + 1][col] && t === board[row + 2][col]) {
                toRemove[row][col] = toRemove[row + 1][col] = toRemove[row + 2][col] = true;
            }
        }
    }
    // видалити
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
    if (hasAnyMatch(board)) {
        setTimeout(() => {
            handleMatches();
            drawBoard(board);
        }, 200);
    }
}
const board = generateBoard();
drawBoard(board);
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    if (!selected) {
        selected = { row, col };
    }
    else {
        const dr = Math.abs(selected.row - row);
        const dc = Math.abs(selected.col - col);
        // лише сусідні
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            swapTiles(board, selected, { row, col });
            drawBoard(board); // 💥 додай ось тут перерисовку ОДРАЗУ після обміну
            if (hasAnyMatch(board)) {
                setTimeout(() => {
                    handleMatches();
                    drawBoard(board);
                }, 200);
            }
            else {
                // скасовуємо обмін через 200мс для ефекту
                setTimeout(() => {
                    swapTiles(board, selected, { row, col });
                    drawBoard(board);
                }, 200);
            }
        }
        selected = null;
    }
});
