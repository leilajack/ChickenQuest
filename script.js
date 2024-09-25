// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images for player, obstacles, coins, and background
const playerImg = new Image();
playerImg.src = 'assets/player.png'; // Transparent background for player

const obstacleImg = new Image();
const coinImg = new Image();
const backgroundImg = new Image();
obstacleImg.src = 'assets/obstacle.png'; // Transparent background for obstacles
coinImg.src = 'assets/coin.png'; // Transparent background for coins
backgroundImg.src = 'assets/barn.png'; // Barn background image

// Load the clucking sound
const cluckSound = new Audio('assets/cluck.mp3'); // Clucking sound file

// Set up the player object
let player = {
    x: canvas.width / 2 - 25, // Start in the center
    y: canvas.height - 80, // Near the bottom
    width: 50,
    height: 50,
    speed: 5, // Movement speed
    dy: 0, // Vertical movement
    gravity: 0.3, // Gravity for falling
    lift: -8, // Jump strength
    maxFallSpeed: 10, // Max speed when falling
    isFloating: false,
    movingLeft: false,
    movingRight: false
};

// Explosion effect variables
let explosion = { active: false, x: 0, y: 0, frames: 0, maxFrames: 10 };

// High Score from localStorage
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

// Handle user input for movement (keyboard and touch)
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowUp') {
        player.isFloating = true; // Jump when arrow up is pressed
    }
    if (event.code === 'ArrowLeft') {
        player.movingLeft = true; // Move left
    }
    if (event.code === 'ArrowRight') {
        player.movingRight = true; // Move right
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowUp') {
        player.isFloating = false; // Stop jumping when arrow up is released
    }
    if (event.code === 'ArrowLeft') {
        player.movingLeft = false; // Stop moving left
    }
    if (event.code === 'ArrowRight') {
        player.movingRight = false; // Stop moving right
    }
});

// Touch event listeners for mobile control
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchmove', handleTouchMove, false);

let touchStartX = 0; // Track where the user touches the screen

function handleTouchStart(event) {
    const firstTouch = event.touches[0];
    touchStartX = firstTouch.clientX; // Get the initial touch position
}

function handleTouchMove(event) {
    const touchX = event.touches[0].clientX; // Get the current touch position

    // If the touch moves left or right, move the player accordingly
    if (touchX < touchStartX && player.x > 0) {
        player.x -= player.speed; // Move left
    } else if (touchX > touchStartX && player.x + player.width < canvas.width) {
        player.x += player.speed; // Move right
    }
    
    // Update touch start position
    touchStartX = touchX;
}

// Obstacle variables
let obstacles = [];
let obstacleFrequency = 150; // Slower start for more playability
let obstacleSpeed = 1.5; // Base obstacle speed (50% slower increase)
let frames = 0;
let obstacleCount = 1; // Start with one obstacle per interval

// Function to create new obstacles
function createObstacle() {
    for (let i = 0; i < obstacleCount; i++) {
        let width = 40;
        let xPosition = Math.random() * (canvas.width - width);
        obstacles.push({
            x: xPosition,
            y: -20,
            width: width,
            height: 40, // Set the height of obstacles
            speed: obstacleSpeed // Speed increases over time
        });
    }
}

// Update obstacles and increase difficulty
function updateObstacles() {
    frames++;

    // Increase difficulty at a slower pace
    if (score % 50 === 0 && score > 0) {
        obstacleSpeed += 0.05; // Increase speed at 50% of the previous rate
        obstacleFrequency = Math.max(50, obstacleFrequency - 1); // Reduce time between obstacles more slowly
        obstacleCount = Math.min(5, obstacleCount + 1); // Gradually increase number of obstacles (up to 5)
    }

    // Create new obstacles at regular intervals
    if (frames % obstacleFrequency === 0) {
        createObstacle();
    }

    // Update obstacle positions
    obstacles.forEach((obstacle, index) => {
        obstacle.y += obstacle.speed;

        // If an obstacle passes the player without hitting
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1); // Remove the obstacle
            score += 5; // Increase score

            // Create a bouncing coin when the score increases
            createCoin(player.x + player.width / 2, player.y);
        }
    });
}

// Draw obstacles on the canvas
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Coin variables
let coins = [];

// Function to create coins that bounce up when score increases
function createCoin(x, y) {
    coins.push({
        x: x,
        y: y,
        radius: 20, // Set radius based on image size
        speedY: -15, // Bounce height
        gravity: 0.5, // Slower bounce down
        collected: false
    });
}

// Update coin positions and apply bounce effect
function updateCoins() {
    coins.forEach((coin, index) => {
        coin.y += coin.speedY;
        coin.speedY += coin.gravity; // Gravity affects bounce

        // Remove coins after they hit the ground
        if (coin.y >= canvas.height - coin.radius) {
            coins.splice(index, 1); // Remove coin
        }
    });
}

// Draw coins on the canvas
function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinImg, coin.x, coin.y, coin.radius * 2, coin.radius * 2);
    });
}

// Explosion effect for when the player is hit
function triggerExplosion(x, y) {
    explosion.active = true;
    explosion.x = x;
    explosion.y = y;
    explosion.frames = 0;
}

// Draw explosion effect
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

    ctx.strokeStyle = 'red';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(explosion.x, explosion.y);
        ctx.lineTo(
            explosion.x + Math.cos((i / 10 + 0.5) * Math.PI * 2) * explosion.frames * 5,
            explosion.y + Math.sin((i / 10 + 0.5) * Math.PI * 2) * explosion.frames * 5
        );
        ctx.stroke();
    }

    explosion.frames++;

    if (explosion.frames > explosion.maxFrames) {
        explosion.active = false; // End explosion effect
    }
}

// Collision detection for obstacles
function detectCollisions() {
    obstacles.forEach((obstacle, index) => {
        if (player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
            obstacles.splice(index, 1); // Remove obstacle on collision
            lives -= 1; // Decrease lives

            // Play cluck sound and trigger explosion
            cluckSound.play(); // Play cluck sound on hit
            triggerExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

            // Update high score if necessary
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore); // Save new high score
            }

            if (lives <= 0) {
                alert("Game Over! Final Score: " + score); // Show game over
                document.location.reload(); // Reload game
            }
        }
    });
}

// Variables for score and lives
let score = 0;
let lives = 3;

// Draw the player's

 score, lives, and high score
function drawHUD() {
    ctx.fillStyle = 'white'; // Change HUD text to white for visibility
    ctx.font = '20px Arial';
    ctx.fillText("Score: " + score, 10, 20); // Display score
    ctx.fillText("Lives: " + lives, 10, 50); // Display lives
    ctx.fillText("High Score: " + highScore, 10, 80); // Display high score
}

// Update player movement and gravity
function updatePlayer() {
    if (player.isFloating) {
        player.dy = player.lift; // Jump up
    } else {
        player.dy += player.gravity; // Apply gravity
        if (player.dy > player.maxFallSpeed) player.dy = player.maxFallSpeed; // Limit fall speed
    }

    // Update player position
    player.y += player.dy;

    // Prevent the player from going out of bounds
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
    }
    if (player.y < 0) {
        player.y = 0;
    }

    // Horizontal movement
    if (player.movingLeft && player.x > 0) {
        player.x -= player.speed; // Move left
    }
    if (player.movingRight && player.x + player.width < canvas.width) {
        player.x += player.speed; // Move right
    }
}

// Resize canvas dynamically based on window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust player size dynamically for mobile
    player.width = canvas.width * 0.1;
    player.height = canvas.width * 0.1;
}

// Call the resize function when the window is resized
window.addEventListener('resize', resizeCanvas);

// Initial canvas resize when the game loads
resizeCanvas();

// Draw the game objects
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw background
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    // Draw obstacles, coins, player, explosion, and HUD
    drawObstacles();
    drawCoins();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    drawExplosion(); // Draw explosion effect
    drawHUD(); // Draw HUD with high score
}

// Main game loop
function gameLoop() {
    updatePlayer(); // Update player movement and gravity
    updateObstacles(); // Update falling obstacles
    updateCoins(); // Update bouncing coins
    detectCollisions(); // Check for collisions
    draw(); // Render everything

    requestAnimationFrame(gameLoop); // Repeat game loop
}

// Start the game loop
gameLoop();