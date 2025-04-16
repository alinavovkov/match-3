# Match-3 Game

A simple **Match-3 game** implemented using **Vanilla TypeScript** and **Canvas**.

Players can click on two tiles to swap them. If a match of 3, 4, 5 identical tiles is formed (horizontally or vertically), the tiles disappear, new tiles fall from above, and the board refills automatically.

### Features

- 8×8 board with 5 tile types (colored squares)
- Animated falling tiles
- Match detection: 3, 4, or 5 in a row
- Smooth tile swapping and rollback on invalid moves
- Glowing tile borders and red error glow for invalid swaps
- Prevents double-clicks and repeated clicks on the same tile
- User messages for feedback (e.g., successful move, same tile)

### Getting Started local or go to https://alinavovkov.github.io/match-3/

1. Clone or download the project
2. Run a local server (e.g. `Live Server` in VSCode)
3. Open `index.html` in your browser
4. Play!

### Technologies

- TypeScript
- HTML5 Canvas
- SCSS
