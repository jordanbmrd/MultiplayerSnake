const express = require('express');
const socket = require('socket.io');
const app = express();
const cors = require('cors');

const { makeId } = require('./utils');
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

const state = {};
const clientRooms = {};

// Pour éviter les erreurs CORS
app.use(cors());
app.use(express.json());

const server = app.listen('3000', () => {
	console.log('Server running on PORT 3000');
});

io = socket(server);

io.on('connection', socket => {
    // Contrôles
    socket.on('keydown', key => {
        const roomName = clientRooms[socket.id];
        if (!roomName) return;

        const vel = getUpdatedVelocity(key);

        if (vel) state[roomName].players[socket.number - 1].vel = vel;
    });

    // Une nouvelle partie doit être créée
    socket.on('newGame', () => {
        let roomName = makeId(4);
        clientRooms[socket.id] = roomName;
        socket.emit('gameCode', roomName);

        state[roomName] = initGame();

        socket.join(roomName);
        socket.number = 1;
        socket.emit('init', 1);
    });

    // Un joueur rejoint une partie
    socket.on('joinGame', roomName => {
        const room = io.sockets.adapter.rooms.get(roomName);
        
        let numClients;
        if (room) numClients = room.size;

        // Si personne n'attend dans la partie
        if (numClients === 0) {
            socket.emit('unknownGame');
            return;
        }
        // S'il y a trop de joueurs
        else if (numClients >= 2) {
            socket.emit('tooManyPlayers');
            return;
        }

        clientRooms[socket.id] = roomName;

        socket.join(roomName);
        socket.number = 2;
        socket.emit('init', 2);

        startGameInterval(roomName);
    });
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);
        console.log(winner);

        if (!winner) {
            emitGameState(roomName, state[roomName]);
        }
        else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    io.sockets.in(roomName)
        .emit('gameState', JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName)
        .emit('gameOver', JSON.stringify({ winner }));
}