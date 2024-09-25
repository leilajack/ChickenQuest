// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images for player, obstacles, coins, power-ups, and background
const playerImg = new Image();
const obstacleImg = new Image();
const coinImg = new Image();
const backgroundImg = new Image();
const shieldImg = new Image();
const speedBoostImg = new Image();

// Load sounds
const cluckSound = new Audio();
const coinSound = new Audio();
const obstacleHitSound = new Audio();
const jumpSound = new Audio();

// Asset sources (all filenames are now lowercase)
playerImg.src = 'assets/player.png';
obstacleImg.src = 'assets/obstacle.png';
coinImg.src = 'assets/coin.png';
backgroundImg.src = 'assets/barn.png';
shieldImg.src = 'assets/shield.png';
speedBoostImg.src = 'assets/speedboost.png';

cluckSound.src = 'assets/cluck.mp3';
coinSound.src = 'assets/coinsound.mp3';
obstacleHitSound.src = 'assets/eaglescream.mp3';
jumpSound.src = 'assets/jump.mp3';

// Game variables
let player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 5,
    originalSpeed: 5, // For resetting after speed boost
    dy: 0,
    gravity: 0.5,
    lift: -10,
    maxFallSpeed: 10,
    isFloating: false,
    movingLeft: false,
    movingRight: false,
    isShielded: false
};

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let obstacles = [];
let coins = [];
let powerUps = [];
let frames = 0;

// Resize canvas to fit the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust player size based on canvas size
    player.width = canvas.width * 0.08;
    player.height = canvas.width * 0.08;

    // Reset player position
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// Handle keyboard input for desktop
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'Up') {
        if (!player.isFloating) { // Prevent double jump
            player.isFloating = true;
            jumpSound.play(); // Play jump sound
        }
    }
    if (event.key === 'ArrowLeft' || event.key === 'Left') {
        player.movingLeft = true;
    }
    if (event.key === 'ArrowRight' || event.key === 'Right') {
        player.movingRight = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'Up') {
        player.isFloating = false;
    }
    if (event.key === 'ArrowLeft' || event.key === 'Left') {
        player.movingLeft = false;
    }
    if (event.key === 'ArrowRight' || event.key === 'Right') {
        player.movingRight = false;
    }
});

// Touch event listeners for mobile control
let lastTouchTime = 0;

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const touchX = event.touches[0].clientX;
    const currentTime = new Date().getTime();

    // Check for double-tap to jump
    if (currentTime - lastTouchTime < 300) {
        if (!player.isFloating) { // Prevent double jump
            player.isFloating = true;
            jumpSound.play(); // Play jump sound
        }
    }
    lastTouchTime = currentTime;

    if (touchX < canvas.width / 2) {
        player.movingLeft = true;
    } else {
        player.movingRight = true;
    }
}, false);

canvas.addEventListener('touchend', () => {
    player.movingLeft = false;
    player.movingRight = false;
    player.isFloating = false;
}, false);

// Function to create obstacles
function createObstacle() {
    let size = 50 + Math.random() * 30; // Size varies between 50 and 80
    size *= 1.25; // Increase size by 25%
    let xPosition = Math.random() * (canvas.width - size);
    obstacles.push({
        x: xPosition,
        y: -size,
        width: size,
        height: size,
        speed: 2 + score / 100 // Increase speed as score increases
    });
}

// Update obstacles
function updateObstacles() {
    if (frames % 100 === 0) {
        createObstacle();
    }
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.speed;
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1);
            score += 5;
            createCoin();
            // No sound when obstacle leaves the screen
        }
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacleImg.complete) {
            ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}

// Function to create coins
function createCoin() {
    let xPosition = Math.random() * (canvas.width - 40);
    coins.push({
        x: xPosition,
        y: -40,
        width: 40,
        height: 40,
        speed: 3
    });
}

// Update coins
function updateCoins() {
    coins.forEach((coin, index) => {
        coin.y += coin.speed;
        if (coin.y > canvas.height) {
            coins.splice(index, 1);
        }
    });
}

// Draw coins
function drawCoins() {
    coins.forEach(coin => {
        if (coinImg.complete) {
            ctx.drawImage(coinImg, coin.x, coin.y, coin.width, coin.height);
        }
    });
}

// Power-up types
const POWER_UP_TYPES = {
    SHIELD: 'shield',
    SPEED_BOOST: 'speedboost' // Changed to lowercase
};

// Function to create power-ups
function createPowerUp() {
    let xPosition = Math.random() * (canvas.width - 40);
    let type = Math.random() < 0.5 ? POWER_UP_TYPES.SHIELD : POWER_UP_TYPES.SPEED_BOOST;
    powerUps.push({
        x: xPosition,
        y: -40,
        width: 40,
        height: 40,
        speed: 2,
        type: type
    });
}

// Update power-ups
function updatePowerUps() {
    if (frames % 500 === 0) { // Adjust frequency as needed
        createPowerUp();
    }
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        let img = powerUp.type === POWER_UP_TYPES.SHIELD ? shieldImg : speedBoostImg;
        if (img.complete) {
            ctx.drawImage(img, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    });
}

// Collision detection
function detectCollisions() {
    // Check collision with obstacles
    obstacles.forEach((obstacle, index) => {
        if (player.x + 10 < obstacle.x + obstacle.width - 10 &&
            player.x + player.width - 10 > obstacle.x + 10 &&
            player.y + 10 < obstacle.y + obstacle.height - 10 &&
            player.y + player.height - 10 > obstacle.y + 10) {

            if (player.isShielded) {
                obstacles.splice(index, 1);
                // Shield absorbs the hit, no life lost
            } else {
                obstacles.splice(index, 1);
                lives -= 1;
                if (obstacleHitSound.readyState >= 2) {
                    obstacleHitSound.play(); // Play eagle scream sound when player is hit
                }
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('highScore', highScore);
                }
                if (lives <= 0) {
                    alert("Game Over! Final Score: " + score);
                    document.location.reload();
                }
            }
        }
    });

    // Check collision with coins
    coins.forEach((coin, index) => {
        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {

            coins.splice(index, 1);
            score += 10;
            if (coinSound.readyState >= 2) {
                coinSound.play(); // Play coin sound when player collects a coin
            }
        }
    });

    // Check collision with power-ups
    powerUps.forEach((powerUp, index) => {
        if (player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y) {

            powerUps.splice(index, 1);
            if (powerUp.type === POWER_UP_TYPES.SHIELD) {
                player.isShielded = true;
                setTimeout(() => {
                    player.isShielded = false;
                }, 5000); // Shield lasts for 5 seconds
            } else if (powerUp.type === POWER_UP_TYPES.SPEED_BOOST) {
                player.speed *= 1.5;
                setTimeout(() => {
                    player.speed = player.originalSpeed;
                }, 5000); // Speed boost lasts for 5 seconds
            }
        }
    });
}

// Draw HUD
function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Lives: " + lives, 10, 60);
    ctx.fillText("High Score: " + highScore, 10, 90);

    if (player.isShielded) {
        ctx.fillText("Shield Active", canvas.width - 150, 30);
    }
}

// Update player movement and gravity
function updatePlayer() {
    if (player.isFloating) {
        player.dy = player.lift;
    } else {
        player.dy += player.gravity;
    }

    player.dy = Math.min(player.dy, player.maxFallSpeed);
    player.y += player.dy;

    // Keep player within canvas bounds
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
    }
    if (player.y < 0) {
        player.y = 0;
        player.dy = 0;
    }
    if (player.movingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.movingRight && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
}

// Main game loop
function gameLoop() {
    frames++;
    updatePlayer();
    updateObstacles();
    updateCoins();
    updatePowerUps();
    detectCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }
    drawObstacles();
    drawCoins();
    drawPowerUps();
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }
    drawHUD();

    requestAnimationFrame(gameLoop);
}

// Start the game immediately
gameLoop();
