// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images and sounds
const playerImg = new Image();
playerImg.src = 'assets/player.png';

const obstacleImg = new Image();
obstacleImg.src = 'assets/obstacle.png';

const coinImg = new Image();
coinImg.src = 'assets/coin.png';

const backgroundImg = new Image();
backgroundImg.src = 'assets/barn.png';

const speedBoostImg = new Image();
speedBoostImg.src = 'assets/speedBoost.png';

const shieldImg = new Image();
shieldImg.src = 'assets/shield.png';

const coinSound = new Audio('assets/Coinsound.mp3');
const cluckSound = new Audio('assets/cluck.mp3');
const obstacleHitSound = new Audio('assets/EagleScream.mp3');

// Game variables
let player = {
    x: 0,
    y: 0,
    width: 75,  // Adjusted width
    height: 75, // Adjusted height
    speed: 5,
    dy: 0,
    gravity: 0.3,
    isFloating: false,
    movingLeft: false,
    movingRight: false,
    isShielded: false,
};

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let obstacles = [];
let coins = [];
let powerUps = [];

// Power-up types
const POWER_UP_TYPES = {
    SPEED_BOOST: 'speed',
    SHIELD: 'shield'
};

// Resize canvas to fit the window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset player dimensions based on canvas size
    player.width = canvas.width * 0.1; // 10% of canvas width
    player.height = canvas.height * 0.1; // 10% of canvas height
}

// Initial setup
function init() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10; // Keep player above the bottom
    resizeCanvas();
}

// Function to create obstacles
function createObstacle() {
    const width = 50 + Math.random() * 30; 
    const xPosition = Math.random() * (canvas.width - width);
    obstacles.push({
        x: xPosition,
        y: -20,
        width: width * 1.25, 
        height: 62.5, // Adjusted height for 25% increase
        speed: 1.5 + score / 100 
    });
}

// Function to create coins
function createCoin() {
    const xPosition = Math.random() * canvas.width;
    coins.push({
        x: xPosition,
        y: -20,
        radius: 25, // Adjusted radius for better visibility
        speedY: 2,
    });
}

// Function to create power-ups
function createPowerUp() {
    const type = Math.random() < 0.5 ? POWER_UP_TYPES.SPEED_BOOST : POWER_UP_TYPES.SHIELD;
    const xPosition = Math.random() * (canvas.width - 50);
    powerUps.push({
        x: xPosition,
        y: -20,
        type: type,
        width: 40, // Adjusted width
        height: 40  // Adjusted height
    });
}

// Update functions
function updateObstacles() {
    if (Math.random() < 0.02) createObstacle(); 
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.speed;
        if (obstacle.y > canvas.height) obstacles.splice(index, 1);
    });
}

function updateCoins() {
    if (Math.random() < 0.05) createCoin(); 
    coins.forEach((coin, index) => {
        coin.y += coin.speedY;
        if (coin.y > canvas.height) coins.splice(index, 1);
    });
}

function updatePowerUps() {
    if (Math.random() < 0.01) createPowerUp(); 
    powerUps.forEach((powerUp, index) => {
        powerUp.y += 2; 
        if (powerUp.y > canvas.height) powerUps.splice(index, 1);
    });
}

// Draw functions
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinImg, coin.x, coin.y, coin.radius * 2, coin.radius * 2);
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.type === POWER_UP_TYPES.SPEED_BOOST) {
            ctx.drawImage(speedBoostImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        } else if (powerUp.type === POWER_UP_TYPES.SHIELD) {
            ctx.drawImage(shieldImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    });
}

// Collision detection
function detectCollisions() {
    obstacles.forEach((obstacle, index) => {
        if (player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
            if (!player.isShielded) {
                lives -= 1;
                cluckSound.play();
                if (lives <= 0) {
                    alert("Game Over! Final Score: " + score);
                    document.location.reload();
                }
            } else {
                obstacles.splice(index, 1);
            }
        }
    });

    coins.forEach((coin, index) => {
        if (player.x < coin.x + coin.radius * 2 && player.x + player.width > coin.x &&
            player.y < coin.y + coin.radius * 2 && player.y + player.height > coin.y) {
            score += 10;
            coinSound.play();
            coins.splice(index, 1);
        }
    });

    powerUps.forEach((powerUp, index) => {
        if (player.x < powerUp.x + powerUp.width && player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height && player.y + player.height > powerUp.y) {
            if (powerUp.type === POWER_UP_TYPES.SPEED_BOOST) {
                player.speed *= 1.5; 
                setTimeout(() => player.speed /= 1.5, 5000); 
            } else if (powerUp.type === POWER_UP_TYPES.SHIELD) {
                player.isShielded = true; 
                setTimeout(() => player.isShielded = false, 5000); 
            }
            powerUps.splice(index, 1);
        }
    });
}

// Draw HUD
function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Lives: " + lives, 10, 50);
    ctx.fillText("High Score: " + highScore, 10, 80);
}

// Update player movement
function updatePlayer() {
    if (player.isFloating) player.dy = -player.speed; // Jump action
    else player.dy += player.gravity;

    player.y += player.dy;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
    if (player.y < 0) player.y = 0;
    if (player.movingLeft && player.x > 0) player.x -= player.speed;
    if (player.movingRight && player.x + player.width < canvas.width) player.x += player.speed;
}

// Main game loop
function gameLoop() {
    updatePlayer();
    updateObstacles();
    updateCoins();
    updatePowerUps();
    detectCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    drawObstacles();
    drawCoins();
    drawPowerUps();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    drawHUD();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
gameLoop();
