// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images for player, obstacles, coins, and background
const playerImg = new Image();
playerImg.src = 'assets/player.png'; 

const obstacleImg = new Image();
obstacleImg.src = 'assets/obstacle.png'; 

const coinImg = new Image();
coinImg.src = 'assets/coin.png'; 

const backgroundImg = new Image();
backgroundImg.src = 'assets/barn.png'; 

// Load clucking sound
const cluckSound = new Audio('assets/cluck.mp3'); 

// Set up the player object
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 5,
    dy: 0,
    gravity: 0.3,
    lift: -8,
    maxFallSpeed: 10,
    isFloating: false,
    movingLeft: false,
    movingRight: false
};

// Explosion effect variables
let explosion = { active: false, x: 0, y: 0, frames: 0, maxFrames: 10 };

// High Score from localStorage
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

// Obstacle variables
let obstacles = [];
let obstacleFrequency = 150;
let obstacleSpeed = 1.5;
let frames = 0;
let obstacleCount = 1;

// Game variables
let score = 0;
let lives = 3;
let lastTouchTime = 0;

// Handle keyboard input for desktop
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowUp') player.isFloating = true; 
    if (event.code === 'ArrowLeft') player.movingLeft = true; 
    if (event.code === 'ArrowRight') player.movingRight = true; 
});
document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowUp') player.isFloating = false; 
    if (event.code === 'ArrowLeft') player.movingLeft = false; 
    if (event.code === 'ArrowRight') player.movingRight = false; 
});

// Touch event listeners for mobile control
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const touchX = event.touches[0].clientX;
    const currentTime = new Date().getTime();

    // Check for double-tap jump
    if (currentTime - lastTouchTime < 300) {
        player.isFloating = true; // Double-tap to jump
    }
    lastTouchTime = currentTime;

    if (touchX < canvas.width / 2) {
        player.movingLeft = true; // Move left
    } else {
        player.movingRight = true; // Move right
    }
}, false);

canvas.addEventListener('touchend', (event) => {
    player.movingLeft = false;
    player.movingRight = false;
    player.isFloating = false; // Stop jumping
}, false);

// Function to create obstacles
function createObstacle() {
    for (let i = 0; i < obstacleCount; i++) {
        let width = 40;
        let xPosition = Math.random() * (canvas.width - width);
        obstacles.push({
            x: xPosition,
            y: -20,
            width: width,
            height: 40,
            speed: obstacleSpeed
        });
    }
}

// Update obstacles
function updateObstacles() {
    frames++;
    if (score % 50 === 0 && score > 0) {
        obstacleSpeed += 0.05;
        obstacleFrequency = Math.max(50, obstacleFrequency - 1);
        obstacleCount = Math.min(5, obstacleCount + 1);
    }
    if (frames % obstacleFrequency === 0) createObstacle();
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.speed;
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1);
            score += 5;
            createCoin(player.x + player.width / 2, player.y);
        }
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Coin variables
let coins = [];
function createCoin(x, y) {
    coins.push({
        x: x,
        y: y,
        radius: 20,
        speedY: -15,
        gravity: 0.5
    });
}

// Update and draw coins
function updateCoins() {
    coins.forEach((coin, index) => {
        coin.y += coin.speedY;
        coin.speedY += coin.gravity;
        if (coin.y >= canvas.height - coin.radius) coins.splice(index, 1);
    });
}
function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinImg, coin.x, coin.y, coin.radius * 2, coin.radius * 2);
    });
}

// Explosion effect
function triggerExplosion(x, y) {
    explosion.active = true;
    explosion.x = x;
    explosion.y = y;
    explosion.frames = 0;
}
function drawExplosion() {
    if (!explosion.active) return;
    ctx.strokeStyle = 'yellow';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(explosion.x, explosion.y);
        ctx.lineTo(
            explosion.x + Math.cos((i / 10) * Math.PI * 2) * explosion.frames * 5,
            explosion.y + Math.sin((i / 10) * Math.PI * 2) * explosion.frames * 5
        );
        ctx.stroke();
    }
    explosion.frames++;
    if (explosion.frames > explosion.maxFrames) explosion.active = false;
}

// Collision detection
function detectCollisions() {
    obstacles.forEach((obstacle, index) => {
        if (player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
            obstacles.splice(index, 1);
            lives -= 1;
            cluckSound.play();
            triggerExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
            if (lives <= 0) {
                alert("Game Over! Final Score: " + score);
                document.location.reload();
            }
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

// Update player movement and gravity
function updatePlayer() {
    if (player.isFloating) player.dy = player.lift;
    else player.dy += player.gravity;
    if (player.dy > player.maxFallSpeed) player.dy = player.maxFallSpeed;
    player.y += player.dy;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
    if (player.y < 0) player.y = 0;
    if (player.movingLeft && player.x > 0) player.x -= player.speed;
    if (player.movingRight && player.x + player.width < canvas.width) player.x += player.speed;
}

// Resize canvas and set max dimensions
function resizeCanvas() {
    const maxCanvasWidth = 1600;
    const maxCanvasHeight = 1600;
    canvas.width = Math.min(window.innerWidth, maxCanvasWidth);
    canvas.height = Math.min(window.innerHeight, maxCanvasHeight);
    player.width = canvas.width * 0.1;
    player.height = canvas.width * 0.1;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Main game loop
function gameLoop() {
    updatePlayer();
    updateObstacles();
    updateCoins();
    detectCollisions();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    drawObstacles();
    drawCoins();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    drawExplosion();
    drawHUD();
    requestAnimationFrame(gameLoop);
}
gameLoop();
