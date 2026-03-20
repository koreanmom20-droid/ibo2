window.games = window.games || {};

// Achievements System
window.achievements = {
    list: {
        reflex: { id: 'reflex', title: '⚡ Lightning Reflex', desc: 'Reaction time < 200ms', unlocked: false, icon: '⚡' },
        clicker: { id: 'clicker', title: '🖱 Click Master', desc: 'Achieve 10+ CPS', unlocked: false, icon: '🖱' },
        aim: { id: 'aim', title: '🎯 Aim God', desc: 'Achieve 95%+ accuracy in Aim Trainer', unlocked: false, icon: '🎯' }
    },
    
    unlock: function(id) {
        if (this.list[id] && !this.list[id].unlocked) {
            this.list[id].unlocked = true;
            this.showToast(this.list[id]);
            this.renderList();
        }
    },
    
    showToast: function(ach) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="toast-icon">${ach.icon}</div>
            <div class="toast-text">
                <h4>Achievement Unlocked!</h4>
                <p>${ach.title}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if(toast.parentNode) toast.parentNode.removeChild(toast);
        }, 4500);
    },
    
    renderList: function() {
        const listEl = document.getElementById('achievements-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';
        Object.values(this.list).forEach(ach => {
            const entry = document.createElement('div');
            entry.className = `ach-entry ${ach.unlocked ? 'unlocked' : ''}`;
            entry.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-details">
                    <h3>${ach.title}</h3>
                    <p>${ach.desc}</p>
                </div>
            `;
            listEl.appendChild(entry);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Database Setup
    window.zynHubUsers = JSON.parse(localStorage.getItem('zynHubUsers')) || {
        'koreanmom': { password: 'admin', isPremium: true, score: 999999 }
    };
    function saveUsers() { localStorage.setItem('zynHubUsers', JSON.stringify(window.zynHubUsers)); }

    window.currentUser = null;
    window.isPremium = false;

    // Login Logic
    const loginModal = document.getElementById('login-modal');
    const loginUser = document.getElementById('login-username');
    const loginPass = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-submit-btn');
    const userDisplay = document.getElementById('user-display');
    const adminBtn = document.getElementById('admin-button');

    loginBtn.addEventListener('click', () => {
        const u = loginUser.value.trim();
        const p = loginPass.value.trim();
        
        if (!u || !p) {
            loginError.textContent = "Please enter both fields.";
            return;
        }

        if (window.zynHubUsers[u]) {
            // Check password
            if (window.zynHubUsers[u].password !== p) {
                loginError.textContent = "Incorrect password.";
                return;
            }
        } else {
            // Register new user
            window.zynHubUsers[u] = { password: p, isPremium: false, score: 0 };
            saveUsers();
        }

        // Login success
        window.currentUser = u;
        window.isPremium = window.zynHubUsers[u].isPremium;
        
        loginModal.classList.add('hidden');
        userDisplay.innerHTML = `👤 ${u} ${window.isPremium ? '💎' : ''}`;
        
        if (u === 'koreanmom') {
            adminBtn.classList.remove('hidden');
            document.getElementById('premium-button').classList.add('hidden');
            adminBtn.style.display = 'block';
        } else if (window.isPremium) {
            document.getElementById('premium-button').innerHTML = '💎 PREMIUM ACTIVE';
        }
    });

    // Admin Panel Logic
    const adminModal = document.getElementById('admin-modal');
    adminBtn.addEventListener('click', () => adminModal.classList.remove('hidden'));
    document.getElementById('close-admin').addEventListener('click', () => adminModal.classList.add('hidden'));

    document.getElementById('admin-grant-btn').addEventListener('click', () => {
        const target = document.getElementById('admin-target-user').value.trim();
        const msg = document.getElementById('admin-msg');
        
        if (!window.zynHubUsers[target]) {
            msg.style.color = "#ff3333";
            msg.textContent = "User not found!";
        } else {
            window.zynHubUsers[target].isPremium = true;
            saveUsers();
            msg.style.color = "#38ef7d";
            msg.textContent = `Premium granted to ${target}!`;
        }
    });

    // Premium Modal Logic
    const premiumBtn = document.getElementById('premium-button');
    const premiumModal = document.getElementById('premium-modal');
    const closePremium = document.getElementById('close-premium');

    premiumBtn.addEventListener('click', () => {
        premiumModal.classList.remove('hidden');
    });

    closePremium.addEventListener('click', () => {
        premiumModal.classList.add('hidden');
    });

    // Leaderboard Modal Logic
    const lbBtn = document.getElementById('leaderboard-button');
    const lbModal = document.getElementById('leaderboard-modal');
    const closeLb = document.getElementById('close-leaderboard');
    const lbLock = document.getElementById('leaderboard-lock');
    const lbList = document.getElementById('leaderboard-list');

    // Generate random usernames
    const prefixes = ['Pro', 'Noob', 'Dark', 'Light', 'Super', 'Hyper', 'Zyn', 'KOR', 'Ultra', 'Slayer'];
    const roots = ['Sniper', 'Gamer', 'Killer', 'Wolf', 'Dragon', 'Ninja', 'Ghost', 'Phantom', 'Demon', 'God'];
    
    function generateLB() {
        lbList.innerHTML = '';
        
        if (!window.isPremium && window.currentUser !== 'koreanmom') {
            lbList.classList.add('hidden');
            lbLock.classList.remove('hidden');
            return;
        }

        lbLock.classList.add('hidden');
        lbList.classList.remove('hidden');

        // Fetch real users from localStorage
        let playerArray = [];
        for (const [name, data] of Object.entries(window.zynHubUsers)) {
            // Requirements: "leader board working but people with premium only"
            if (data.isPremium || name === 'koreanmom') {
                playerArray.push({ name: name, score: data.score || 0 });
            }
        }

        // Pad with fake bots to look populated if there are few real users
        if (playerArray.length < 15) {
            let botScore = 5000;
            for (let i = 0; i < 20; i++) {
                botScore -= Math.floor(Math.random() * 200) + 10;
                playerArray.push({ name: `Bot_${Math.floor(Math.random()*999)}`, score: botScore });
            }
        }

        // Sort descending by score
        playerArray.sort((a, b) => b.score - a.score);

        // Ensure koreanmom is always #1 visually as requested
        const koreanMomIndex = playerArray.findIndex(p => p.name === 'koreanmom');
        if (koreanMomIndex > 0) {
            const temp = playerArray.splice(koreanMomIndex, 1)[0];
            temp.score = 999999;
            playerArray.unshift(temp);
        }

        playerArray.forEach((player, i) => {
            const entry = document.createElement('div');
            entry.className = 'lb-entry';
            
            let rankText = `#${i + 1}`;
            if (i === 0) rankText = '🥇';
            if (i === 1) rankText = '🥈';
            if (i === 2) rankText = '🥉';

            entry.innerHTML = `
                <div class="lb-rank">${rankText}</div>
                <div class="lb-name" style="color: ${player.name==='koreanmom' ? '#ff3333' : 'white'};">${player.name}</div>
                <div class="lb-score">${player.score} pts</div>
            `;
            lbList.appendChild(entry);
        });
    }

    lbBtn.addEventListener('click', () => {
        generateLB();
        lbModal.classList.remove('hidden');
    });

    closeLb.addEventListener('click', () => {
        lbModal.classList.add('hidden');
    });

    // Achievements Modal Logic
    const achBtn = document.getElementById('achievements-button');
    const achModal = document.getElementById('achievements-modal');
    const closeAch = document.getElementById('close-achievements');

    achBtn.addEventListener('click', () => {
        window.achievements.renderList();
        achModal.classList.remove('hidden');
    });

    closeAch.addEventListener('click', () => {
        achModal.classList.add('hidden');
    });

    // Handle "Get Premium" buttons
    const getPremiumBtns = document.querySelectorAll('.get-premium-btn');
    getPremiumBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Redirect to PayPal
            window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=k.aldhahery@gmail.com&item_name=ZynHub+Premium+Subscription&amount=3.00&currency_code=USD', '_blank');
            
            // For testing/smooth UX, we activate it right away in the client (Mock)
            alert('Redirecting to PayPal for checkout! Premium privileges activated for this session.');
            isPremium = true; 
            generateLB(); // refresh view if leaderboard is active
            
            // Visual feedback
            const topPremiumBtn = document.getElementById('premium-button');
            if (topPremiumBtn) topPremiumBtn.innerHTML = '💎 PREMIUM ACTIVE';
            
            // Close modals
            premiumModal.classList.add('hidden');
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === premiumModal) premiumModal.classList.add('hidden');
        if (e.target === lbModal) lbModal.classList.add('hidden');
        if (e.target === achModal) achModal.classList.add('hidden');
        if (e.target === adminModal) adminModal.classList.add('hidden');
    });

    // Navigation Logic
    const screens = {
        'menu': document.getElementById('main-menu'),
        'reaction': document.getElementById('reaction-screen'),
        'clicker': document.getElementById('clicker-screen'),
        'aim': document.getElementById('aim-screen'),
        'tictactoe': document.getElementById('tictactoe-screen'),
    };

    const gameCards = document.querySelectorAll('.game-card');

    window.switchScreen = (screenName) => {
        for (const [key, el] of Object.entries(screens)) {
            if (key === screenName) {
                el.classList.remove('hidden');
                el.classList.add('active');
                
                // Trigger game init if available
                if (key !== 'menu' && window.games && window.games[key]) {
                    window.games[key].init();
                }
            } else {
                el.classList.add('hidden');
                el.classList.remove('active');
                
                // Trigger game cleanup if available
                if (key !== 'menu' && window.games && window.games[key]) {
                    window.games[key].cleanup();
                }
            }
        }
        
        const topRightBar = document.getElementById('top-right-bar');
        if (screenName === 'menu') {
            topRightBar.style.display = 'flex';
        } else {
            topRightBar.style.display = 'none';
        }
    };

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const game = card.getAttribute('data-game');
            switchScreen(game);
        });

        // Add 3D tilt hover effect for a premium feel
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            card.style.transition = 'none';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        });
    });

    // Make space background interactive
    const spaceBg = document.getElementById('space-background');
    document.addEventListener('mousemove', (e) => {
        if (spaceBg) {
            // Move up to 30px in any direction opposite to the mouse
            const moveX = (e.clientX / window.innerWidth - 0.5) * -40;
            const moveY = (e.clientY / window.innerHeight - 0.5) * -40;
            spaceBg.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
});
