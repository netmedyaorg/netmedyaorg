// Game canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let animationId;
let gameOver = false;

// Player snake
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    color: '#00ff00',
    speed: 3,
    segments: [],
    segmentCount: 20,
    angle: 0
};

// Initialize player segments
for (let i = 0; i < player.segmentCount; i++) {
    player.segments.push({
        x: player.x - (i * 5),
        y: player.y
    });
}

// Food array
const foods = [];
const foodCount = 50;
const foodColors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];

// AI snakes
const aiSnakes = [];
const aiSnakeCount = 5;

// Initialize food
function initFood() {
    for (let i = 0; i < foodCount; i++) {
        foods.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 5 + Math.random() * 5,
            color: foodColors[Math.floor(Math.random() * foodColors.length)]
        });
    }
}

// Initialize AI snakes
function initAISnakes() {
    for (let i = 0; i < aiSnakeCount; i++) {
        const snake = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 10,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: 2 + Math.random(),
            segments: [],
            segmentCount: 10 + Math.floor(Math.random() * 20),
            angle: Math.random() * Math.PI * 2,
            turnSpeed: 0.05
        };

        // Initialize AI snake segments
        for (let j = 0; j < snake.segmentCount; j++) {
            snake.segments.push({
                x: snake.x - (j * 5),
                y: snake.y
            });
        }

        aiSnakes.push(snake);
    }
}

// Mouse control
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Update player position based on mouse
function updatePlayerPosition() {
    // Calculate angle to mouse
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    player.angle = Math.atan2(dy, dx);

    // Move player in that direction
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;

    // Keep player within bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width) player.x = canvas.width;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height) player.y = canvas.height;

    // Update segments
    player.segments.unshift({ x: player.x, y: player.y });
    player.segments.pop();
}

// Update AI snakes
function updateAISnakes() {
    aiSnakes.forEach(snake => {
        // Randomly change direction occasionally
        if (Math.random() < 0.02) {
            snake.angle += (Math.random() - 0.5) * snake.turnSpeed;
        }

        // Move snake
        snake.x += Math.cos(snake.angle) * snake.speed;
        snake.y += Math.sin(snake.angle) * snake.speed;

        // Bounce off walls
        if (snake.x < 0 || snake.x > canvas.width) {
            snake.angle = Math.PI - snake.angle;
        }
        if (snake.y < 0 || snake.y > canvas.height) {
            snake.angle = -snake.angle;
        }

        // Update segments
        snake.segments.unshift({ x: snake.x, y: snake.y });
        snake.segments.pop();

        // Check for food collision
        foods.forEach((food, index) => {
            const dx = snake.x - food.x;
            const dy = snake.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < snake.radius + food.radius) {
                // Grow snake
                snake.segments.push({ ...snake.segments[snake.segments.length - 1] });
                snake.segmentCount++;
                
                // Remove food and add new one
                foods.splice(index, 1);
                foods.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: 5 + Math.random() * 5,
                    color: foodColors[Math.floor(Math.random() * foodColors.length)]
                });
            }
        });
    });
}

// Check collisions with food
function checkFoodCollisions() {
    foods.forEach((food, index) => {
        const dx = player.x - food.x;
        const dy = player.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + food.radius) {
            // Increase score
            score += Math.floor(food.radius);
            document.getElementById('player-score').textContent = `Score: ${score}`;

            // Grow snake
            player.segments.push({ ...player.segments[player.segments.length - 1] });
            player.segmentCount++;
            
            // Remove food and add new one
            foods.splice(index, 1);
            foods.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 5 + Math.random() * 5,
                color: foodColors[Math.floor(Math.random() * foodColors.length)]
            });
        }
    });
}

// Check collisions with AI snakes
function checkSnakeCollisions() {
    aiSnakes.forEach(snake => {
        // Check collision with player head
        const dx = player.x - snake.x;
        const dy = player.y - snake.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + snake.radius) {
            gameOver = true;
        }

        // Check collision with snake segments
        for (let i = 1; i < snake.segments.length; i++) {
            const segment = snake.segments[i];
            const dx = player.x - segment.x;
            const dy = player.y - segment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < player.radius) {
                gameOver = true;
            }
        }
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw food
    foods.forEach(food => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        ctx.closePath();
    });

    // Draw AI snakes
    aiSnakes.forEach(snake => {
        // Draw segments
        for (let i = snake.segments.length - 1; i >= 0; i--) {
            const segment = snake.segments[i];
            const radius = snake.radius * (1 - i / snake.segments.length * 0.5);
            
            ctx.beginPath();
            ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = snake.color;
            ctx.fill();
            ctx.closePath();
        }

        // Draw eyes
        const eyeOffset = snake.radius * 0.5;
        const eyeRadius = snake.radius * 0.3;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(snake.angle - 0.3) * eyeOffset,
            snake.y + Math.sin(snake.angle - 0.3) * eyeOffset,
            eyeRadius, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            snake.x + Math.cos(snake.angle + 0.3) * eyeOffset,
            snake.y + Math.sin(snake.angle + 0.3) * eyeOffset,
            eyeRadius, 0, Math.PI * 2
        );
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    });

    // Draw player snake
    for (let i = player.segments.length - 1; i >= 0; i--) {
        const segment = player.segments[i];
        const radius = player.radius * (1 - i / player.segments.length * 0.5);
        
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    }

    // Draw player eyes
    const eyeOffset = player.radius * 0.5;
    const eyeRadius = player.radius * 0.3;
    
    // Left eye
    ctx.beginPath();
    ctx.arc(
        player.x + Math.cos(player.angle - 0.3) * eyeOffset,
        player.y + Math.sin(player.angle - 0.3) * eyeOffset,
        eyeRadius, 0, Math.PI * 2
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(
        player.x + Math.cos(player.angle + 0.3) * eyeOffset,
        player.y + Math.sin(player.angle + 0.3) * eyeOffset,
        eyeRadius, 0, Math.PI * 2
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Draw game over message if game is over
    if (gameOver) {
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 80);
    }
}

// Game loop
function gameLoop() {
    if (!gameOver) {
        updatePlayerPosition();
        updateAISnakes();
        checkFoodCollisions();
        checkSnakeCollisions();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    } else {
        draw();
        cancelAnimationFrame(animationId);
    }
}

// Start game
function startGame() {
    // Reset game state
    score = 0;
    gameOver = false;
    document.getElementById('player-score').textContent = `Score: ${score}`;

    // Reset player
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.segments = [];
    player.segmentCount = 20;
    for (let i = 0; i < player.segmentCount; i++) {
        player.segments.push({
            x: player.x - (i * 5),
            y: player.y
        });
    }

    // Clear and initialize food and AI snakes
    foods.length = 0;
    aiSnakes.length = 0;
    initFood();
    initAISnakes();

    // Start game loop
    gameLoop();
}

// Restart game on click if game over
canvas.addEventListener('click', () => {
    if (gameOver) {
        startGame();
    }
});

// Initialize and start game
initFood();
initAISnakes();
startGame();
