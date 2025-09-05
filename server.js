const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Game state management
const rooms = new Map();
const playerRooms = new Map();

// Game logic
const choices = ['stone', 'paper', 'scissors'];
const getWinner = (choice1, choice2) => {
  if (choice1 === choice2) return 'tie';
  if (
    (choice1 === 'stone' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'stone') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) {
    return 'player1';
  }
  return 'player2';
};

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Join a room
    socket.on('join-room', (roomId, playerName) => {
      // Leave previous room if any
      const previousRoom = playerRooms.get(socket.id);
      if (previousRoom) {
        socket.leave(previousRoom);
        const room = rooms.get(previousRoom);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length === 0) {
            rooms.delete(previousRoom);
          } else {
            io.to(previousRoom).emit('player-left', room);
          }
        }
      }

      // Join new room
      socket.join(roomId);
      playerRooms.set(socket.id, roomId);

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          players: [],
          gameState: 'waiting', // waiting, playing, results
          choices: {},
          scores: {},
          round: 0
        });
      }

      const room = rooms.get(roomId);
      
      // Add player if not already in room and room has space
      if (room.players.length < 2 && !room.players.find(p => p.id === socket.id)) {
        room.players.push({
          id: socket.id,
          name: playerName,
          ready: false
        });
        room.scores[socket.id] = 0;
      }

      // Emit room state to all players in room
      io.to(roomId).emit('room-update', room);

      // Start game if 2 players
      if (room.players.length === 2 && room.gameState === 'waiting') {
        room.gameState = 'playing';
        room.round = 1;
        io.to(roomId).emit('game-start', room);
      }
    });

    // Player makes a choice
    socket.on('make-choice', (choice) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.gameState !== 'playing') return;

      room.choices[socket.id] = choice;

      // Check if both players have made choices
      const choiceCount = Object.keys(room.choices).length;
      if (choiceCount === 2) {
        // Evaluate game
        const playerIds = room.players.map(p => p.id);
        const choice1 = room.choices[playerIds[0]];
        const choice2 = room.choices[playerIds[1]];
        
        const winner = getWinner(choice1, choice2);
        
        // Update scores
        if (winner === 'player1') {
          room.scores[playerIds[0]]++;
        } else if (winner === 'player2') {
          room.scores[playerIds[1]]++;
        }

        const results = {
          round: room.round,
          choices: {
            [playerIds[0]]: choice1,
            [playerIds[1]]: choice2
          },
          winner: winner,
          scores: room.scores
        };

        room.gameState = 'results';
        
        // Send results to all players
        io.to(roomId).emit('round-results', results);

        // Reset for next round after 3 seconds
        setTimeout(() => {
          room.choices = {};
          room.round++;
          room.gameState = 'playing';
          io.to(roomId).emit('next-round', room);
        }, 3000);
      } else {
        // Notify that player made choice (without revealing what it is)
        socket.to(roomId).emit('player-chose');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          delete room.choices[socket.id];
          delete room.scores[socket.id];
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            room.gameState = 'waiting';
            io.to(roomId).emit('player-left', room);
          }
        }
        playerRooms.delete(socket.id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
