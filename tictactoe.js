window.games = window.games || {};

window.games.tictactoe = {
    screen: document.getElementById('tictactoe-screen'),
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: false,
    
    init: function() {
        this.screen.innerHTML = `
            <button class="back-btn" onclick="window.switchScreen('menu')">Back to Hub</button>
            <div id="ttt-area" class="game-area">
                <div class="ttt-container">
                    <h1 id="ttt-status">Tic Tac Toe</h1>
                    <div class="board" id="ttt-board">
                        <div class="cell" data-index="0"></div>
                        <div class="cell" data-index="1"></div>
                        <div class="cell" data-index="2"></div>
                        <div class="cell" data-index="3"></div>
                        <div class="cell" data-index="4"></div>
                        <div class="cell" data-index="5"></div>
                        <div class="cell" data-index="6"></div>
                        <div class="cell" data-index="7"></div>
                        <div class="cell" data-index="8"></div>
                    </div>
                    <button id="ttt-restart">Restart Game</button>
                </div>
            </div>
        `;
        
        if (!document.getElementById('ttt-styles')) {
            const style = document.createElement('style');
            style.id = 'ttt-styles';
            style.textContent = `
                .ttt-container { display: flex; flex-direction: column; align-items: center; background: rgba(20, 15, 40, 0.8); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
                #ttt-status { font-size: 2.5rem; margin-bottom: 20px; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
                .board { display: grid; grid-template-columns: repeat(3, 100px); grid-template-rows: repeat(3, 100px); gap: 10px; margin-bottom: 20px; }
                .cell { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 4rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
                .cell:hover { background: rgba(255,255,255,0.1); }
                .cell.x { color: #00f2fe; text-shadow: 0 0 15px rgba(0,242,254,0.8); }
                .cell.o { color: #ffbc00; text-shadow: 0 0 15px rgba(255,188,0,0.8); }
                #ttt-restart { background: linear-gradient(45deg, #a18cd1, #fbc2eb); border: none; padding: 10px 30px; border-radius: 30px; font-size: 1.2rem; font-weight: bold; cursor: pointer; color: #111; transition: transform 0.2s, box-shadow 0.2s; }
                #ttt-restart:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(251, 194, 235, 0.5); }
            `;
            document.head.appendChild(style);
        }

        const cells = document.querySelectorAll('.cell');
        this.boundHandleCellClick = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this.handleCellClick(e);
        };
        cells.forEach(cell => {
            cell.addEventListener('mousedown', this.boundHandleCellClick);
            cell.addEventListener('touchstart', this.boundHandleCellClick, {passive: false});
        });
        
        document.getElementById('ttt-restart').addEventListener('click', this.reset.bind(this));
        
        this.reset();
    },
    
    cleanup: function() {
        this.screen.innerHTML = '';
    },
    
    reset: function() {
        this.board = ['', '', '', '', '', '', '', '', ''];
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        document.getElementById('ttt-status').textContent = `Player X's Turn`;
        
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    },
    
    handleCellClick: function(e) {
        const cell = e.target;
        const index = parseInt(cell.getAttribute('data-index'));
        
        if (this.board[index] !== '' || !this.gameActive) {
            return;
        }
        
        this.board[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        this.checkWin();
    },
    
    checkWin: function() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        let roundWon = false;
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                roundWon = true;
                break;
            }
        }
        
        const status = document.getElementById('ttt-status');
        
        if (roundWon) {
            status.textContent = `Player ${this.currentPlayer} Wins!`;
            this.gameActive = false;
            return;
        }
        
        if (!this.board.includes('')) {
            status.textContent = `Game Ended in a Draw!`;
            this.gameActive = false;
            return;
        }
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Player ${this.currentPlayer}'s Turn`;
    }
};
