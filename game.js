// Game Variables
let scene, camera, renderer;
let player, ground, collectibles = [];
let score = 0;
let timeLeft = 60;
let gameActive = false;
let isPaused = false;
let playerVelocity = { x: 0, z: 0, y: 0 };
let joystickInput = { x: 0, z: 0 };
let isJumping = false;

// Touch controls variables
let touchStartX = 0;
let touchStartY = 0;
let joystickActive = false;

// Initialize Three.js
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x764ba2, 10, 50);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.insertBefore(renderer.domElement, document.getElementById('mobile-controls'));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    // Create game environment
    createEnvironment();
    createPlayer();
    
    // Setup controls
    setupMobileControls();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('orientationchange', onWindowResize, false);
}

// Create game environment
function createEnvironment() {
    // Ground
    const groundGeometry = new THREE.BoxGeometry(30, 1, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4CAF50 
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create decorative elements
    createTrees();
    createClouds();
}

// Create trees
function createTrees() {
    const treePositions = [
        { x: -12, z: -12 }, { x: 12, z: -12 },
        { x: -12, z: 12 }, { x: 12, z: 12 },
        { x: 0, z: -14 }, { x: 0, z: 14 }
    ];

    treePositions.forEach(pos => {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(pos.x, 1.5, pos.z);
        trunk.castShadow = true;
        scene.add(trunk);

        // Tree leaves
        const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(pos.x, 4, pos.z);
        leaves.castShadow = true;
        scene.add(leaves);
    });
}

// Create clouds
function createClouds() {
    for (let i = 0; i < 5; i++) {
        const cloudGroup = new THREE.Group();
        
        for (let j = 0; j < 3; j++) {
            const cloudGeometry = new THREE.SphereGeometry(1 + Math.random(), 6, 5);
            const cloudMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudPart.position.x = j - 1;
            cloudGroup.add(cloudPart);
        }
        
        cloudGroup.position.set(
            (Math.random() - 0.5) * 30,
            10 + Math.random() * 5,
            (Math.random() - 0.5) * 30
        );
        cloudGroup.userData = { speed: 0.01 + Math.random() * 0.02 };
        scene.add(cloudGroup);
    }
}

// Create player
function createPlayer() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x2196F3 });
    player = new THREE.Mesh(geometry, material);
    player.position.y = 0.5;
    player.castShadow = true;
    scene.add(player);
}

// Create collectibles
function createCollectibles() {
    // Clear existing collectibles
    collectibles.forEach(c => scene.remove(c));
    collectibles = [];

    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.OctahedronGeometry(0.5);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        const collectible = new THREE.Mesh(geometry, material);
        
        collectible.position.x = (Math.random() - 0.5) * 25;
        collectible.position.y = 1;
        collectible.position.z = (Math.random() - 0.5) * 25;
        collectible.castShadow = true;
        
        collectibles.push(collectible);
        scene.add(collectible);
    }
}

// Setup mobile controls
function setupMobileControls() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    const jumpBtn = document.getElementById('jump-btn');

    // Joystick controls
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        handleJoystickMove(e.touches[0]);
    });

    joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
            handleJoystickMove(e.touches[0]);
        }
    });

    joystickBase.addEventListener('touchend', (e) => {
        e.preventDefault();
        joystickActive = false;
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickInput = { x: 0, z: 0 };
    });

    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!isJumping && gameActive) {
            jump();
        }
    });
}

// Handle joystick movement
function handleJoystickMove(touch) {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    const rect = joystickBase.getBoundingClientRect();
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 25;
    
    if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
    }
    
    joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    joystickInput.x = deltaX / maxDistance;
    joystickInput.z = deltaY / maxDistance;
}

// Player jump
function jump() {
    if (!isJumping) {
        isJumping = true;
        playerVelocity.y = 0.3;
    }
}

// Update player movement
function updatePlayer(deltaTime) {
    if (!gameActive || isPaused) return;

    const speed = 0.1;
    
    // Apply joystick input
    playerVelocity.x = joystickInput.x * speed;
    playerVelocity.z = joystickInput.z * speed;

    // Apply gravity
    if (player.position.y > 0.5) {
        playerVelocity.y -= 0.015;
    } else {
        player.position.y = 0.5;
        playerVelocity.y = 0;
        isJumping = false;
    }

    // Update position with boundaries
    const newX = player.position.x + playerVelocity.x;
    const newZ = player.position.z + playerVelocity.z;

    if (Math.abs(newX) < 14) player.position.x = newX;
    if (Math.abs(newZ) < 14) player.position.z = newZ;
    player.position.y += playerVelocity.y;

    // Camera follow
    camera.position.x = player.position.x * 0.3;
    camera.position.z = player.position.z * 0.3 + 15;
    camera.lookAt(player.position);
}

// Check collisions
function checkCollisions() {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        const distance = player.position.distanceTo(collectible.position);
        
        if (distance < 1.5) {
            // Collect item
            scene.remove(collectible);
            collectibles.splice(i, 1);
            score += 10;
            updateScore();
            
            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Spawn new collectible
            setTimeout(() => {
                if (gameActive) {
                    const geometry = new THREE.OctahedronGeometry(0.5);
                    const material = new THREE.MeshLambertMaterial({ 
                        color: 0xFFD700,
                        emissive: 0xFFD700,
                        emissiveIntensity: 0.3
                    });
                    const newCollectible = new THREE.Mesh(geometry, material);
                    
                    newCollectible.position.x = (Math.random() - 0.5) * 25;
                    newCollectible.position.y = 1;
                    newCollectible.position.z = (Math.random() - 0.5) * 25;
                    newCollectible.castShadow = true;
                    
                    collectibles.push(newCollectible);
                    scene.add(newCollectible);
                }
            }, 500);
        }
    }
}

// Animate collectibles
function animateCollectibles(time) {
    collectibles.forEach((collectible, index) => {
        collectible.rotation.y += 0.02;
        collectible.position.y = 1 + Math.sin(time * 0.001 + index) * 0.2;
    });
}

// Animate clouds
function animateClouds() {
    scene.children.forEach(child => {
        if (child.userData.speed) {
            child.position.x += child.userData.speed;
            if (child.position.x > 20) {
                child.position.x = -20;
            }
        }
    });
}

// Update displays
function updateScore() {
    document.querySelector('#score-display .value').textContent = score;
}

function updateTime() {
    document.querySelector('#time-display .value').textContent = timeLeft;
}

// Game timer
let timerInterval;
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive && !isPaused && timeLeft > 0) {
            timeLeft--;
            updateTime();
            
            if (timeLeft === 0) {
                endGame();
            }
        }
    }, 1000);
}

// Start game
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('mobile-controls').classList.remove('hidden');
    
    score = 0;
    timeLeft = 60;
    gameActive = true;
    isPaused = false;
    
    updateScore();
    updateTime();
    
    player.position.set(0, 0.5, 0);
    createCollectibles();
    startTimer();
}

// End game
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    document.getElementById('final-score-value').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('mobile-controls').classList.add('hidden');
    
    // Vibrate pattern for game over
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

// Restart game
function restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    startGame();
}

// Show menu
function showMenu() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('mobile-controls').classList.add('hidden');
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? '▶️' : '⏸️';
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const time = clock.getElapsedTime();
    
    if (gameActive && !isPaused) {
        updatePlayer(deltaTime);
        checkCollisions();
        animateCollectibles(time * 1000);
        animateClouds();
    }
    
    renderer.render(scene, camera);
}

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Initialize game
init();
animate();
