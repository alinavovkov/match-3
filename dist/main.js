"use strict";
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 64;
const boardSize = 8;
const tileTypes = 5;
let selected = null;
let board = createEmptyBoard();
let isFalling = true;
function createEmptyBoard() {
    return Array.from({ length: boardSize }, () => Array(boardSize).fill(-1));
}
function getRandomTile() {
    return Math.floor(Math.random() * tileTypes);
}
function createFallingTiles() {
    const tiles = [];
    let attempts = 0;
    do {
        board = createEmptyBoard();
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                let tile;
                do {
                    tile = getRandomTile();
                    board[row][col] = tile;
                } while (hasMatchAt(board, row, col));
            }
        }
        attempts++;
    } while (hasAnyMatch(board) && attempts < 100);
    for (let col = 0; col < boardSize; col++) {
        for (let i = 0; i < boardSize; i++) {
            const row = boardSize - 1 - i;
            tiles.push({
                type: board[row][col],
                row: row,
                col: col,
                y: -(i + 1) * tileSize * 2,
                speed: 5 + Math.random() * 2
            });
        }
    }
    console.log(`Board initialized in ${attempts} attempt`);
    if (hasAnyMatch(board)) {
        console.log("MATCH FOUND ON INIT!", board);
    }
    else {
        console.log("No match on init");
    }
    return tiles;
}
function animateFallingTiles(tiles, onFinish) {
    function step() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let allLanded = true;
        for (const tile of tiles) {
            const targetY = tile.row * tileSize;
            if (tile.y < targetY) {
                tile.y += tile.speed;
                if (tile.y > targetY)
                    tile.y = targetY;
                allLanded = false;
            }
            drawTile(tile.type, tile.col * tileSize, tile.y);
        }
        if (allLanded) {
            onFinish(board);
        }
        else {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}
function drawTile(tile, x, y, highlight = false) {
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
        }
        else {
            ctx.strokeStyle = '#9ecaed';
            ctx.shadowColor = '#9ecaed';
        }
        ctx.strokeRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
        ctx.restore();
    }
}
function drawBoard(board, highlight) {
    var _a, _b, _c, _d;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            let highlightType = false;
            if ((((_a = highlight === null || highlight === void 0 ? void 0 : highlight.from) === null || _a === void 0 ? void 0 : _a.row) === row && ((_b = highlight === null || highlight === void 0 ? void 0 : highlight.from) === null || _b === void 0 ? void 0 : _b.col) === col) ||
                (((_c = highlight === null || highlight === void 0 ? void 0 : highlight.to) === null || _c === void 0 ? void 0 : _c.row) === row && ((_d = highlight === null || highlight === void 0 ? void 0 : highlight.to) === null || _d === void 0 ? void 0 : _d.col) === col)) {
                highlightType = highlight.state || 'selected';
            }
            drawTile(board[row][col], col * tileSize, row * tileSize, highlightType);
        }
    }
}
function swapTiles(board, a, b) {
    const temp = board[a.row][a.col];
    board[a.row][a.col] = board[b.row][b.col];
    board[b.row][b.col] = temp;
}
function hasMatchAt(board, row, col) {
    const tile = board[row][col];
    if (tile === -1)
        return false;
    if (col >= 2 &&
        tile === board[row][col - 1] &&
        tile === board[row][col - 2])
        return true;
    if (row >= 2 &&
        tile === board[row - 1][col] &&
        tile === board[row - 2][col])
        return true;
    return false;
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
function runMatchCycle() {
    const matches = findMatches(board);
    if (matches.length === 0) {
        isFalling = false;
        return;
    }
    isFalling = true;
    animateRemove(matches, () => {
        removeMatches(board, matches);
        collapseBoard(board);
        animateRefill(board, () => {
            isFalling = false;
            drawBoard(board);
        });
    });
}
function findMatches(board) {
    const matches = [];
    const added = new Set();
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
function removeMatches(board, matches) {
    for (const { row, col } of matches) {
        board[row][col] = -1;
    }
}
function collapseBoard(board) {
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
function refillBoard(board) {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === -1) {
                board[row][col] = getRandomTile();
            }
        }
    }
}
function animateRefill(board, onFinish) {
    const fallingTiles = [];
    const newTiles = [];
    for (let col = 0; col < boardSize; col++) {
        for (let row = 0; row < boardSize; row++) {
            if (board[row][col] === -1) {
                const newTile = getRandomTile();
                newTiles.push({ row, col, type: newTile });
                fallingTiles.push({
                    type: newTile,
                    row,
                    col,
                    y: -tileSize * 2,
                    speed: 0
                });
            }
        }
    }
    const duration = 2000;
    const startTime = performance.now();
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard(board);
        for (const tile of fallingTiles) {
            const targetY = tile.row * tileSize;
            tile.y = -tileSize * 2 + (targetY + tileSize * 2) * eased;
            drawTile(tile.type, tile.col * tileSize, tile.y);
        }
        if (progress < 1) {
            requestAnimationFrame(step);
        }
        else {
            for (const { row, col, type } of newTiles) {
                board[row][col] = type;
            }
            drawBoard(board);
            onFinish();
        }
    }
    requestAnimationFrame(step);
}
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
function animateRemove(matches, onFinish) {
    const duration = 500;
    const startTime = performance.now();
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const isMatched = matches.some(m => m.row === row && m.col === col);
                if (isMatched)
                    continue;
                drawTile(board[row][col], col * tileSize, row * tileSize);
            }
        }
        for (const { row, col } of matches) {
            const tile = board[row][col];
            if (tile === -1)
                continue;
            const scale = 1 - progress;
            const size = tileSize * scale;
            const offset = (tileSize - size) / 2;
            const x = col * tileSize + offset;
            const y = row * tileSize + offset;
            ctx.save();
            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = ['red', 'green', 'blue', 'yellow', 'purple'][tile];
            ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
            ctx.restore();
        }
        if (progress < 1) {
            requestAnimationFrame(step);
        }
        else {
            onFinish();
        }
    }
    requestAnimationFrame(step);
}
function showMessage(text, type = 'info', duration = 2000) {
    const messageElement = document.getElementById('message');
    if (!messageElement)
        return;
    messageElement.textContent = text;
    messageElement.className = type;
    setTimeout(() => {
        if (messageElement.textContent === text) {
            messageElement.classList.add('hidden');
        }
    }, duration);
}
const fallingTiles = createFallingTiles();
animateFallingTiles(fallingTiles, () => {
    drawBoard(board);
    isFalling = false;
});
canvas.addEventListener("click", (e) => {
    if (isFalling)
        return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    if (!selected) {
        selected = { row, col };
        drawBoard(board, { from: selected });
        return;
    }
    if (selected.row === row && selected.col === col) {
        showMessage("Please select a different tile", 'error');
        return;
    }
    const dr = Math.abs(selected.row - row);
    const dc = Math.abs(selected.col - col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const from = selected;
        const to = { row, col };
        swapTiles(board, from, to);
        drawBoard(board, { from, to });
        if (hasAnyMatch(board)) {
            showMessage("Increadible!", 'info');
            setTimeout(() => {
                runMatchCycle();
            }, 200);
        }
        else {
            setTimeout(() => {
                drawBoard(board, { from, to, state: 'error' });
                showMessage("Match wasn't here", 'error');
                setTimeout(() => {
                    swapTiles(board, from, to);
                    drawBoard(board);
                }, 300);
            }, 500);
        }
    }
    selected = null;
});
