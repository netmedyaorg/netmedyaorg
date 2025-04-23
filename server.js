const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Store connected players
const players = {};
let nextPlayerId = 1;

// Store foods
let foods = [];
const foodCount = 50;
const foodColors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];

// Initialize food
function initFood() {
    for (let i = 0; i < foodCount; i++) {
        foods.push({
            id: i,
            x: Math.random() * 800,
            y: Math.random() * 600,
            radius: 5 + Math.random() * 5,
            color: foodColors[Math.floor(Math.random() * foodColors.length)]
        });
    }
}

// Initialize game
initFood();

wss.on('connection', (ws) => {
    // Assign player ID
    const playerId = nextPlayerId++;
    
    // Create new player
    const playerColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    players[playerId] = {
        id: playerId,
        x: Math.random() * 800,
        y: Math.random() * 600,
        radius: 10,
        color: playerColor,
        segments: [],
        segmentCount: 20,
        angle: 0,
        score: 0
    };
    
    // Initialize player segments
    for (let i = 0; i < players[playerId].segmentCount; i++) {
        players[playerId].segments.push({
            x: players[playerId].x - (i * 5),
            y: players[playerId].y
        });
    }

    console.log(`Player ${playerId} connected`);
    
    // Send initial game state to the new player
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        players: players,
        foods: foods
    }));
    
    // Broadcast new player to all other players
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'newPlayer',
                player: players[playerId]
            }));
        }
    });
    
    // Handle player updates
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'update') {
            // Update player position
            if (players[playerId]) {
                players[playerId].x = data.x;
                players[playerId].y = data.y;
                players[playerId].angle = data.angle;
                players[playerId].segments = data.segments;
                players[playerId].score = data.score;
                
                // Broadcast updated player to all other players
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'updatePlayer',
                            player: players[playerId]
                        }));
                    }
                });
            }
        } else if (data.type === 'eatFood') {
            // Handle food consumption
            const foodId = data.foodId;
            
            // Create new food to replace eaten one
            const newFood = {
                id: foodId,
                x: Math.random() * 800,
                y: Math.random() * 600,
                radius: 5 + Math.random() * 5,
                color: foodColors[Math.floor(Math.random() * foodColors.length)]
            };
            
            // Replace the food
            foods[foodId] = newFood;
            
            // Broadcast new food to all players
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'updateFood',
                        food: newFood
                    }));
                }
            });
        } else if (data.type === 'dead') {
            // Handle player death
            if (players[playerId]) {
                // Reset player
                players[playerId].x = Math.random() * 800;
                players[playerId].y = Math.random() * 600;
                players[playerId].segments = [];
                players[playerId].segmentCount = 20;
                players[playerId].score = 0;
                
                // Initialize player segments
                for (let i = 0; i < players[playerId].segmentCount; i++) {
                    players[playerId].segments.push({
                        x: players[playerId].x - (i * 5),
                        y: players[playerId].y
                    });
                }
                
                // Broadcast reset player to all players
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'resetPlayer',
                            player: players[playerId]
                        }));
                    }
                });
            }
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        
        // Remove player
        delete players[playerId];
        
        // Broadcast player removal to all other players
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'removePlayer',
                    playerId: playerId
                }));
            }
        });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
