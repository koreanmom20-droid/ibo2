window.games = window.games || {};

window.games.reaction = {
    screen: document.getElementById('reaction-screen'),
    state: 'idle', // idle, counting, waiting, ready, result
    timeout: null,
    countdownInterval: null,
    startTime: 0,
    
    init: function() {
        this.screen.innerHTML = `
            <button class="back-btn" onclick="window.switchScreen('menu')">Back to Hub</button>
            <div id="reaction-area" class="game-area reaction-idle">
                <div class="content-wrapper">
                    <h1 id="reaction-msg">READY ?</h1>
                    <p id="reaction-sub">press left click to start</p>
                </div>
            </div>
        `;
        
        // Add specific styles for reaction game dynamically
        if (!document.getElementById('reaction-styles')) {
            const style = document.createElement('style');
            style.id = 'reaction-styles';
            style.textContent = `
                .game-area { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: background-color 0.1s; text-align: center; border-radius: 20px;}
                .content-wrapper { pointer-events: none; }
                .reaction-idle { background-color: rgba(40, 40, 80, 0.9); box-shadow: inset 0 0 50px rgba(0,0,0,0.5); }
                .reaction-waiting { background-color: #ff3333; box-shadow: inset 0 0 100px rgba(255,0,0,0.5); }
                .reaction-ready { background-color: #33ff33; box-shadow: inset 0 0 100px rgba(0,255,0,0.5); color: #000; }
                .reaction-ready h1, .reaction-ready p { color: #000; text-shadow: none; }
                #reaction-msg { font-size: 5rem; font-weight: 900; letter-spacing: 2px; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                #reaction-sub { font-size: 2rem; margin-top: 10px; font-weight: 700; opacity: 0.8; }
            `;
            document.head.appendChild(style);
        }

        const area = document.getElementById('reaction-area');
        this.boundHandleClick = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this.handleClick(e);
        };
        area.addEventListener('mousedown', this.boundHandleClick);
        area.addEventListener('touchstart', this.boundHandleClick, {passive: false});
        this.reset();
    },
    
    cleanup: function() {
        clearTimeout(this.timeout);
        clearInterval(this.countdownInterval);
        this.screen.innerHTML = '';
    },
    
    reset: function() {
        this.state = 'idle';
        const area = document.getElementById('reaction-area');
        const msg = document.getElementById('reaction-msg');
        const sub = document.getElementById('reaction-sub');
        
        if (!area) return;
        
        area.className = 'game-area reaction-idle';
        msg.textContent = 'READY ?';
        sub.textContent = 'press left click to start';
    },
    
    handleClick: function() {
        if (this.state === 'idle' || this.state === 'result') {
            this.startCountdown();
        } else if (this.state === 'counting' || this.state === 'waiting') {
            this.tooEarly();
        } else if (this.state === 'ready') {
            this.finish();
        }
    },
    
    startCountdown: function() {
        this.state = 'counting';
        const area = document.getElementById('reaction-area');
        const msg = document.getElementById('reaction-msg');
        const sub = document.getElementById('reaction-sub');
        
        area.className = 'game-area reaction-waiting';
        sub.textContent = 'wait for green...';
        
        let count = 3;
        msg.textContent = count + '...';
        
        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                msg.textContent = count + '...';
            } else {
                clearInterval(this.countdownInterval);
                this.startWaiting();
            }
        }, 1000);
    },
    
    startWaiting: function() {
        this.state = 'waiting';
        const msg = document.getElementById('reaction-msg');
        msg.textContent = 'Wait...';
        
        // Random delay between 1.5s and 5s
        const delay = Math.random() * 3500 + 1500;
        
        this.timeout = setTimeout(() => {
            if (this.state === 'waiting') {
                this.state = 'ready';
                const area = document.getElementById('reaction-area');
                area.className = 'game-area reaction-ready';
                msg.textContent = 'GOOO !!';
                document.getElementById('reaction-sub').textContent = 'Click!';
                this.startTime = performance.now();
            }
        }, delay);
    },
    
    tooEarly: function() {
        clearTimeout(this.timeout);
        clearInterval(this.countdownInterval);
        this.state = 'result';
        const area = document.getElementById('reaction-area');
        const msg = document.getElementById('reaction-msg');
        const sub = document.getElementById('reaction-sub');
        
        area.className = 'game-area reaction-idle';
        msg.textContent = 'Too Early!';
        sub.textContent = 'Click to try again';
    },
    
    finish: function() {
        const endTime = performance.now();
        const score = Math.round(endTime - this.startTime);
        
        // Achievement trigger
        if (score < 200) {
            window.achievements.unlock('reflex');
        }
        
        this.state = 'result';
        const area = document.getElementById('reaction-area');
        const msg = document.getElementById('reaction-msg');
        const sub = document.getElementById('reaction-sub');
        
        area.className = 'game-area reaction-idle';
        let roastMsg = "Click to try again.";
        if (score > 400) {
            roastMsg = "Are you playing on Internet Explorer? 🐢 Click to try again.";
        } else if (score > 300) {
            roastMsg = "My grandma reacts faster than that... Click to try again.";
        } else if (score < 200) {
            roastMsg = "God gamer spotted! 🔥 Click to play again.";
        }

        msg.textContent = `${score} ms`;
        sub.textContent = roastMsg;
    }
};
