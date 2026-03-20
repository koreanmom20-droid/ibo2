window.games = window.games || {};

window.games.clicker = {
    screen: document.getElementById('clicker-screen'),
    state: 'idle', // idle, playing, result
    clicks: 0,
    startTime: 0,
    duration: 5000, // 5 seconds
    interval: null,
    
    init: function() {
        this.screen.innerHTML = `
            <button class="back-btn" onclick="window.switchScreen('menu')">Back to Hub</button>
            <div id="clicker-area" class="game-area clicker-idle">
                <div class="content-wrapper">
                    <h1 id="clicker-msg">Click Speed Test</h1>
                    <p id="clicker-sub">Click anywhere to start (5 seconds)</p>
                    <div id="clicker-timer" class="hidden">5.00s</div>
                </div>
            </div>
        `;
        
        if (!document.getElementById('clicker-styles')) {
            const style = document.createElement('style');
            style.id = 'clicker-styles';
            style.textContent = `
                .clicker-idle { background-color: rgba(20, 100, 150, 0.8); }
                .clicker-playing { background-color: rgba(30, 150, 200, 0.9); }
                #clicker-msg { font-size: 4rem; font-weight: 900; margin-bottom: 10px; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                #clicker-sub { font-size: 1.5rem; opacity: 0.9; }
                #clicker-timer { font-size: 2.5rem; font-weight: bold; margin-top: 20px; color: #ffbc00; }
            `;
            document.head.appendChild(style);
        }

        const area = document.getElementById('clicker-area');
        this.boundHandleClick = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this.handleClick(e);
        };
        area.addEventListener('mousedown', this.boundHandleClick);
        area.addEventListener('touchstart', this.boundHandleClick, {passive: false});
        this.reset();
    },
    
    cleanup: function() {
        clearInterval(this.interval);
        this.screen.innerHTML = '';
    },
    
    reset: function() {
        this.state = 'idle';
        this.clicks = 0;
        const msg = document.getElementById('clicker-msg');
        const sub = document.getElementById('clicker-sub');
        const timer = document.getElementById('clicker-timer');
        const area = document.getElementById('clicker-area');
        
        if(!area) return;
        
        area.className = 'game-area clicker-idle';
        msg.textContent = 'Click Speed Test';
        sub.textContent = 'Click anywhere to start (5 seconds)';
        timer.classList.add('hidden');
    },
    
    handleClick: function(e) {
        if (e.target.classList.contains('back-btn')) return;

        if (this.state === 'idle' || this.state === 'result') {
            this.startGame();
            this.clicks++;
            this.updateDisplay();
        } else if (this.state === 'playing') {
            this.clicks++;
            this.updateDisplay();
            
            // Visual feedback
            const area = document.getElementById('clicker-area');
            area.style.transform = 'scale(0.98)';
            setTimeout(() => area.style.transform = 'scale(1)', 50);
        }
    },
    
    startGame: function() {
        this.state = 'playing';
        this.clicks = 0;
        this.startTime = performance.now();
        
        const area = document.getElementById('clicker-area');
        const sub = document.getElementById('clicker-sub');
        const timer = document.getElementById('clicker-timer');
        
        area.className = 'game-area clicker-playing';
        sub.textContent = 'Click as fast as you can!';
        timer.classList.remove('hidden');
        timer.textContent = (this.duration / 1000).toFixed(2) + 's';
        
        this.interval = setInterval(() => {
            const elapsed = performance.now() - this.startTime;
            const remaining = Math.max(0, this.duration - elapsed);
            
            timer.textContent = (remaining / 1000).toFixed(2) + 's';
            
            if (remaining <= 0) {
                this.endGame();
            }
        }, 10);
    },
    
    updateDisplay: function() {
        document.getElementById('clicker-msg').textContent = this.clicks + ' Clicks';
    },
    
    endGame: function() {
        clearInterval(this.interval);
        this.state = 'result';
        
        const cps = (this.clicks / (this.duration / 1000)).toFixed(2);
        
        // Achievement Trigger
        if (parseFloat(cps) >= 10) {
            window.achievements.unlock('clicker');
        }
        
        const area = document.getElementById('clicker-area');
        const msg = document.getElementById('clicker-msg');
        const sub = document.getElementById('clicker-sub');
        const timer = document.getElementById('clicker-timer');
        
        area.className = 'game-area clicker-idle';
        msg.innerHTML = `${cps} CPS<br><span style="font-size:2rem">${this.clicks} total clicks</span>`;
        let roastMsg = "Click to try again.";
        if (cps < 5) {
            roastMsg = "Is your mouse unplugged? 🥱 Click to try again.";
        } else if (cps < 7) {
            roastMsg = "You call that clicking? Do better. Click to try again.";
        } else if (cps >= 10) {
            roastMsg = "Bro has an auto-clicker integrated in his hand! 🤖 Click to play again.";
        }

        sub.textContent = roastMsg;
        timer.classList.add('hidden');
    }
};
