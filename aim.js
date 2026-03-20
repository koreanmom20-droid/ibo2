window.games = window.games || {};

window.games.aim = {
    screen: document.getElementById('aim-screen'),
    scene: null,
    camera: null,
    renderer: null,
    target: null,
    gun: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    animationId: null,
    stars: null,
    boundPointerLockChange: null,
    boundShoot: null,
    boundOnMouseMove: null,
    boundOnKeyDown: null,
    boundOnWindowResize: null,
    
    // Game State
    isPlaying: false,
    score: 0,
    totalShots: 0,
    totalHits: 0,
    difficulty: 1, // 1 to 5
    targetParams: { speed: 0.05, size: 2 },
    
    // Target Animation & Timing
    time: 0,
    baseY: 10,
    baseX: 0,
    targetTimer: 0,
    maxTargetTime: 0,
    clock: null,

    init: function() {
        this.screen.innerHTML = `
            <button class="back-btn" onclick="window.switchScreen('menu')" style="z-index: 10;">Back to Hub</button>
            <div id="aim-ui">
                <div id="crosshair">+</div>
                <div id="aim-stats">
                    Score: <span id="aim-score">0</span> | 
                    Acc: <span id="aim-acc">0</span>% |
                    Shots: <span id="aim-shots">0</span>/<span id="aim-max-shots">10</span> |
                    Level: <select id="aim-difficulty">
                        <option value="1">1 (Easy)</option>
                        <option value="2">2 (Normal)</option>
                        <option value="3">3 (Hard)</option>
                        <option value="4">4 (Expert)</option>
                        <option value="5">5 (Aimbot)</option>
                    </select>
                </div>
                <div id="aim-start-overlay">
                    <h1>Aim Trainer</h1>
                    <p>Click to Lock Pointer and Start</p>
                    <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 10px; color: #ffbc00;">Press keys 1-5 to change difficulty while playing!</p>
                    <p style="font-size: 0.8rem; opacity: 0.7">(Press ESC to unlock)</p>
                </div>
                <div id="aim-end-overlay" style="display: none; position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); flex-direction: column; justify-content: center; align-items: center; pointer-events: auto; z-index: 20;">
                    <h1 style="font-size: 4rem; color: #ff3333; margin-bottom: 20px;">Round Complete</h1>
                    <p id="aim-end-stats" style="font-size: 2rem; color: white; margin-bottom: 10px;"></p>
                    <p id="aim-end-roast" style="font-size: 1.5rem; color: #ffbc00; font-style: italic; text-align: center; max-width: 80%; padding: 20px;"></p>
                    <button id="aim-restart-btn" class="modal-btn" style="margin-top: 30px; background: #38ef7d; border: none; color: black;">Play Again</button>
                    <button class="modal-btn" onclick="window.switchScreen('menu')" style="margin-top: 15px;">Main Menu</button>
                </div>
                <div id="aim-mobile-controls" style="display: none; position: absolute; bottom: 30px; right: 30px; z-index: 10; pointer-events: auto;">
                    <button id="aim-mobile-fire" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,51,51,0.3); border: 2px solid rgba(255,51,51,0.8); color: white; font-size: 1.2rem; font-weight: bold; backdrop-filter: blur(5px);">FIRE</button>
                </div>
            </div>
            <div id="aim-canvas-container" style="touch-action: none;"></div>
        `;

        if (!document.getElementById('aim-styles')) {
            const style = document.createElement('style');
            style.id = 'aim-styles';
            style.textContent = `
                #aim-canvas-container { position: absolute; top:0; left:0; width: 100%; height: 100%; z-index: 1; }
                #aim-ui { position: absolute; top:0; left:0; width: 100%; height: 100%; z-index: 5; pointer-events: none; }
                #crosshair { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: lime; font-size: 24px; font-weight: bold; text-shadow: 0 0 5px #000; pointer-events: none; }
                #aim-stats { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 10px; font-size: 1.5rem; color: white; pointer-events: auto; background-filter: blur(5px); display: flex; align-items: center; gap: 10px; }
                #aim-difficulty { background: #333; color: white; border: 1px solid #666; padding: 5px; border-radius: 5px; font-size: 1.2rem; outline: none; }
                #aim-start-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: auto; cursor: pointer; transition: opacity 0.3s; }
                #aim-start-overlay h1 { font-size: 4rem; color: #ff3333; text-shadow: 0 0 20px rgba(255,0,0,0.5); margin-bottom: 20px; }
            `;
            document.head.appendChild(style);
        }

        this.initThreeJS();
        this.setupEventListeners();
        
        // Ensure UI updates diffculty logic
        document.getElementById('aim-difficulty').addEventListener('change', (e) => {
            this.setDifficulty(parseInt(e.target.value));
        });

        // Setup restart button
        document.getElementById('aim-restart-btn').addEventListener('click', () => {
            document.getElementById('aim-end-overlay').style.display = 'none';
            this.setDifficulty(this.difficulty);
            document.getElementById('aim-start-overlay').style.display = 'flex';
            document.getElementById('aim-start-overlay').style.opacity = '1';
        });
    },

    setupEventListeners: function() {
        const container = document.getElementById('aim-canvas-container');
        const overlay = document.getElementById('aim-start-overlay');
        const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (isMobile) {
            document.getElementById('aim-mobile-controls').style.display = 'block';
            document.getElementById('aim-start-overlay').querySelector('p').textContent = "Tap to Start (Drag to aim, tap FIRE to shoot)";
        }
        
        // Start Game
        overlay.addEventListener('click', () => {
            if (isMobile) {
                this.isPlaying = true;
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 300);
            } else {
                container.requestPointerLock = container.requestPointerLock || container.mozRequestPointerLock;
                if(container.requestPointerLock) container.requestPointerLock();
            }
        });

        this.boundPointerLockChange = this.pointerLockChange.bind(this);
        this.boundShoot = this.shoot.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        this.boundOnWindowResize = this.onWindowResize.bind(this);

        document.addEventListener('pointerlockchange', this.boundPointerLockChange, false);
        // We attach mousedown to container instead of document to avoid UI clicks firing shots
        container.addEventListener('mousedown', this.boundShoot, false);
        document.addEventListener('mousemove', this.boundOnMouseMove, false);
        document.addEventListener('keydown', this.boundOnKeyDown, false);
        window.addEventListener('resize', this.boundOnWindowResize, false);
        
        // Mobile Touch Events
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        
        this.boundTouchStart = (e) => {
            if (!this.isPlaying) return;
            if (e.target.id === 'aim-mobile-fire') return;
            e.preventDefault();
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
        };
        
        this.boundTouchMove = (e) => {
            if (!this.isPlaying) return;
            if (e.target.id === 'aim-mobile-fire') return;
            e.preventDefault(); // Prevent scrolling
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const movementX = touchX - this.lastTouchX;
            const movementY = touchY - this.lastTouchY;
            
            const sensitivity = 0.006;
            this.camera.rotation.y -= movementX * sensitivity;
            this.camera.rotation.x -= movementY * sensitivity;
            this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            this.camera.rotation.z = 0;
            
            this.lastTouchX = touchX;
            this.lastTouchY = touchY;
        };
        
        container.addEventListener('touchstart', this.boundTouchStart, {passive: false});
        container.addEventListener('touchmove', this.boundTouchMove, {passive: false});
        
        document.getElementById('aim-mobile-fire').addEventListener('touchstart', (e) => {
             e.preventDefault();
             if (this.isPlaying) this.shoot();
        }, {passive: false});
    },

    onKeyDown: function(e) {
        if (!this.isPlaying) return;
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
            const level = parseInt(e.key);
            document.getElementById('aim-difficulty').value = level.toString();
            this.setDifficulty(level);
        }
    },

    pointerLockChange: function() {
        const overlay = document.getElementById('aim-start-overlay');
        if (document.pointerLockElement === document.getElementById('aim-canvas-container')) {
            this.isPlaying = true;
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
        } else {
            this.isPlaying = false;
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);
        }
    },

    setDifficulty: function(level) {
        this.difficulty = level;
        // Speeds: 0.03, 0.05, 0.08, 0.12, 0.18 -> Changed to be much slower
        // Sizes: 3, 2.5, 2, 1.5, 1
        this.targetParams.speed = 0.02 + (level * 0.01) + (level >= 3 ? 0.02 : 0);
        this.targetParams.size = 3.5 - (level * 0.3); // Target size adjusts slightly by level
        
        if (this.target) {
            this.target.scale.set(this.targetParams.size, this.targetParams.size, this.targetParams.size);
        }
        
        // reset score on difficulty change
        this.score = 0;
        this.totalShots = 0;
        this.totalHits = 0;
        document.getElementById('aim-score').textContent = this.score;
        document.getElementById('aim-acc').textContent = '0';
        document.getElementById('aim-shots').textContent = '0';
        document.getElementById('aim-max-shots').textContent = (level * 10).toString();
        this.resetTarget();
    },

    initThreeJS: function() {
        const container = document.getElementById('aim-canvas-container');
        
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFFFFF); // Clear White
        
        // Remove fog for total clarity
        // this.scene.fog = new THREE.FogExp2(0xFFFFFF, 0.005); 

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Define Big Box Room
        const roomGeo = new THREE.BoxGeometry(100, 50, 60);
        // We invert the room so we are inside it
        const roomMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0, side: THREE.BackSide });
        const room = new THREE.Mesh(roomGeo, roomMat);
        room.position.set(0, 25, -10);
        this.scene.add(room);

        // Add a back wall target grid visual
        const gridGeo = new THREE.PlaneGeometry(40, 20);
        const gridMat = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true, transparent: true, opacity: 0.2 });
        const gridWall = new THREE.Mesh(gridGeo, gridMat);
        gridWall.position.set(0, 10, -39.9);
        this.scene.add(gridWall);
        
        // Define 9 grid positions based on the exact requirements
        this.gridPositions = [
            {x: -15, y: 15}, {x: 0, y: 15}, {x: 15, y: 15},
            {x: -15, y: 10}, {x: 0, y: 10}, {x: 15, y: 10},
            {x: -15, y: 5},  {x: 0, y: 5},  {x: 15, y: 5}
        ];
        this.lastGridIndex = -1;

        // Create Gun (AKM-like geometry attached to camera)
        this.createGun();

        // Clock for timing
        this.clock = new THREE.Clock();

        // Create Target
        const targetGeo = new THREE.SphereGeometry(1, 32, 32);
        // Using MeshBasicMaterial so it doesn't get darkened by lighting (always highly visible)
        const targetMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.target = new THREE.Mesh(targetGeo, targetMat);
        this.scene.add(this.target);
        this.setDifficulty(this.difficulty); // Applies initial size
        this.resetTarget();

        // Start Loop
        this.animate();
    },

    createGun: function() {
        this.gun = new THREE.Group();
        
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.3 });
        
        // Slide / Barrel (Top horizontal part)
        const slideGeo = new THREE.BoxGeometry(0.5, 0.6, 3);
        const slide = new THREE.Mesh(slideGeo, gunMat);
        slide.position.set(0, 0.5, -1.5);
        this.gun.add(slide);

        // Grip (Angled handle)
        const gripGeo = new THREE.BoxGeometry(0.4, 1.2, 0.8);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.4, -0.5);
        grip.rotation.x = 0.2;
        this.gun.add(grip);

        // Position Pistol relative to camera
        this.gun.position.set(1.5, -1.2, -1.5);
        this.camera.add(this.gun);
        this.scene.add(this.camera);

        // Recoil state tracking
        this.recoil = 0;
    },

    resetTarget: function() {
        // Pick one of the 9 positions (not the last one)
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * 9);
        } while(nextIndex === this.lastGridIndex && this.gridPositions.length > 1);
        
        this.lastGridIndex = nextIndex;
        const pos = this.gridPositions[nextIndex];
        
        this.baseX = pos.x;
        this.baseY = pos.y;
        
        // Fix the z distance to the back wall
        this.target.position.set(this.baseX, this.baseY, -39);
        this.target.scale.set(this.targetParams.size, this.targetParams.size, this.targetParams.size);
        this.time = 0;
        
        // Set target timer based on difficulty (Level 1 = 3s, Level 5 = 0.8s)
        this.maxTargetTime = 3.0 - (this.difficulty * 0.45);
        if (this.maxTargetTime < 0.6) this.maxTargetTime = 0.6;
        this.targetTimer = this.maxTargetTime;
    },

    onMouseMove: function(event) {
        if (!this.isPlaying) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        const sensitivity = 0.002;

        this.camera.rotation.y -= movementX * sensitivity;
        this.camera.rotation.x -= movementY * sensitivity;

        // Clamp vertical look
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
        
        // Reset Z rotation caused by complex euler turns
        this.camera.rotation.z = 0;
    },

    shoot: function() {
        if (!this.isPlaying) return;

        // Trigger smooth recoil variable
        this.recoil = 1.0; 

        this.totalShots++;

        // Raycasting for hit detection
        this.raycaster.setFromCamera(new THREE.Vector2(0,0), this.camera); // Shoot from center of screen
        
        const intersects = this.raycaster.intersectObject(this.target);

        if (intersects.length > 0) {
            // Hit!
            this.totalHits++;
            this.score += 10;
            
            // Visual feedback on target
            this.target.material.color.setHex(0xffffff);
            setTimeout(() => {
                if(this.target) this.target.material.color.setHex(0xff0000);
            }, 100);

            this.resetTarget();
        }
        
        // Update stats and check achievement
        const accuracy = Math.round((this.totalHits / this.totalShots) * 100);
        document.getElementById('aim-score').textContent = this.score;
        document.getElementById('aim-acc').textContent = accuracy;
        document.getElementById('aim-shots').textContent = this.totalShots;
        
        if (this.totalShots >= 10 && accuracy >= 95) {
            window.achievements.unlock('aim');
        }

        const maxShots = this.difficulty * 10;
        if (this.totalShots >= maxShots) {
            this.endGame(accuracy);
        }
    },

    endGame: function(accuracy) {
        this.isPlaying = false;
        if (document.pointerLockElement) {
             document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
             if(document.exitPointerLock) document.exitPointerLock();
        }

        // Save Score to LocalStorage
        if (window.currentUser && window.zynHubUsers[window.currentUser]) {
            let u = window.zynHubUsers[window.currentUser];
            if (this.score > (u.score || 0)) {
                u.score = this.score;
                localStorage.setItem('zynHubUsers', JSON.stringify(window.zynHubUsers));
            }
        }

        const overlay = document.getElementById('aim-end-overlay');
        const statsEl = document.getElementById('aim-end-stats');
        const roastEl = document.getElementById('aim-end-roast');

        statsEl.textContent = `Score: ${this.score} | Accuracy: ${accuracy}%`;

        let roastMsg = "Not bad, keep practicing.";
        if (accuracy < 20) {
            roastMsg = "Are you aiming with your feet? 🦶💀";
        } else if (accuracy < 40) {
            roastMsg = "Stormtrooper academy called, you passed the entrance exam. 🧑‍🚀";
        } else if (accuracy < 60) {
            roastMsg = "My blind dog aims better than you... 🐶";
        } else if (accuracy > 90) {
            roastMsg = "Aimbot enabled. We are watching you. 👁️";
        }

        roastEl.textContent = roastMsg;
        overlay.style.display = 'flex';
    },

    onWindowResize: function() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate: function() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock ? this.clock.getDelta() : 0.016;

        if (this.isPlaying && this.target) {
            this.time += this.targetParams.speed;
            
            // Time pressure mechanic
            this.targetTimer -= delta;
            
            // Target shrinking visual feedback
            const scalePercentage = Math.max(0, this.targetTimer / this.maxTargetTime);
            // Don't let it shrink to exactly 0 to avoid matrix errors, stop at 0.01
            const currentScale = Math.max(0.01, this.targetParams.size * scalePercentage);
            this.target.scale.set(currentScale, currentScale, currentScale);
            
            // If timer runs out, count as a miss
            if (this.targetTimer <= 0) {
                this.totalShots++; // Missed shot penalty
                
                // Update UI visually
                const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
                document.getElementById('aim-acc').textContent = accuracy;
                document.getElementById('aim-shots').textContent = this.totalShots;
                
                this.resetTarget();
                
                const maxShots = this.difficulty * 10;
                if (this.totalShots >= maxShots) {
                    this.endGame(accuracy);
                }
            }
            
            if (this.difficulty >= 3) {
                // Smooth moving target in a figure-8 or orbital pattern around its sector
                const moveScale = (this.difficulty - 2) * 2; // Level 3 = 2, 4 = 4, 5 = 6 limit
                const xMovement = Math.sin(this.time * 2) * moveScale;
                const yMovement = Math.cos(this.time * 3) * (moveScale * 0.8);
                
                this.target.position.x = this.baseX + xMovement;
                this.target.position.y = this.baseY + yMovement;
            } else {
                // Levels 1 & 2: Target is perfectly stationary on the grid.
                this.target.position.x = this.baseX;
                this.target.position.y = this.baseY;
            }
        }
        
        // Handle smooth gun recoil recovery
        if (this.gun) {
            if (this.recoil > 0) {
                this.recoil -= 0.1; // Recovery speed
                if (this.recoil < 0) this.recoil = 0;
            }
            
            // Apply recoil visually safely
            this.gun.position.z = -1.5 + (this.recoil * 0.6);
            this.gun.rotation.x = this.recoil * 0.15;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    cleanup: function() {
        this.isPlaying = false;
        
        // Disable pointer lock
        if (document.pointerLockElement) {
             document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
             if(document.exitPointerLock) document.exitPointerLock();
        }

        const container = document.getElementById('aim-canvas-container');
        if (this.boundPointerLockChange) document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
        if (this.boundShoot && container) container.removeEventListener('mousedown', this.boundShoot);
        if (this.boundOnMouseMove) document.removeEventListener('mousemove', this.boundOnMouseMove);
        if (this.boundOnKeyDown) document.removeEventListener('keydown', this.boundOnKeyDown);
        if (this.boundOnWindowResize) window.removeEventListener('resize', this.boundOnWindowResize);
        
        if (this.boundTouchStart && container) container.removeEventListener('touchstart', this.boundTouchStart);
        if (this.boundTouchMove && container) container.removeEventListener('touchmove', this.boundTouchMove);

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            const container = document.getElementById('aim-canvas-container');
            if(container && this.renderer.domElement.parentNode === container) {
                container.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.scene = null;
            this.camera = null;
            this.renderer = null;
        }

        this.screen.innerHTML = '';
    }
};
