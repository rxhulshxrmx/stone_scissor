// In-memory game state store
// Note: In production, you'd want to use a persistent store like Redis

interface Player {
  id: string
  name: string
  ready: boolean
}

interface Room {
  id: string
  players: Player[]
  gameState: 'waiting' | 'playing' | 'results'
  choices: Record<string, string>
  scores: Record<string, number>
  round: number
  lastActivity: number
}

interface RoundResults {
  round: number
  choices: Record<string, string>
  winner: 'player1' | 'player2' | 'tie'
  scores: Record<string, number>
}

class GameStore {
  private rooms = new Map<string, Room>()
  private playerRooms = new Map<string, string>()

  // Clean up inactive rooms (older than 1 hour)
  private cleanup() {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > oneHour) {
        this.rooms.delete(roomId)
        // Clean up player mappings
        for (const player of room.players) {
          this.playerRooms.delete(player.id)
        }
      }
    }
  }

  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    this.cleanup()

    // Leave previous room if any
    const previousRoom = this.playerRooms.get(playerId)
    if (previousRoom && previousRoom !== roomId) {
      this.leaveRoom(playerId)
    }

    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: [],
        gameState: 'waiting',
        choices: {},
        scores: {},
        round: 0,
        lastActivity: Date.now()
      })
    }

    const room = this.rooms.get(roomId)!
    room.lastActivity = Date.now()

    // Add player if not already in room and room has space
    if (room.players.length < 2 && !room.players.find(p => p.id === playerId)) {
      room.players.push({
        id: playerId,
        name: playerName,
        ready: false
      })
      room.scores[playerId] = 0
    }

    this.playerRooms.set(playerId, roomId)

    // Start game if 2 players
    if (room.players.length === 2 && room.gameState === 'waiting') {
      room.gameState = 'playing'
      room.round = 1
    }

    return room
  }

  leaveRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId)
    if (!roomId) return null

    const room = this.rooms.get(roomId)
    if (!room) return null

    room.players = room.players.filter(p => p.id !== playerId)
    delete room.choices[playerId]
    delete room.scores[playerId]
    room.lastActivity = Date.now()

    if (room.players.length === 0) {
      this.rooms.delete(roomId)
      this.playerRooms.delete(playerId)
      return null
    } else {
      room.gameState = 'waiting'
      room.round = 0
      room.choices = {}
    }

    this.playerRooms.delete(playerId)
    return room
  }

  makeChoice(playerId: string, choice: string): { room: Room; results?: RoundResults } {
    const roomId = this.playerRooms.get(playerId)
    if (!roomId) throw new Error('Player not in room')

    const room = this.rooms.get(roomId)
    if (!room || room.gameState !== 'playing') throw new Error('Invalid game state')

    room.choices[playerId] = choice
    room.lastActivity = Date.now()

    // Check if both players have made choices
    const choiceCount = Object.keys(room.choices).length
    if (choiceCount === 2) {
      // Evaluate game
      const playerIds = room.players.map(p => p.id)
      const choice1 = room.choices[playerIds[0]]
      const choice2 = room.choices[playerIds[1]]
      
      const winner = this.getWinner(choice1, choice2)
      
      // Update scores
      if (winner === 'player1') {
        room.scores[playerIds[0]]++
      } else if (winner === 'player2') {
        room.scores[playerIds[1]]++
      }

      const results: RoundResults = {
        round: room.round,
        choices: {
          [playerIds[0]]: choice1,
          [playerIds[1]]: choice2
        },
        winner: winner,
        scores: room.scores
      }

      room.gameState = 'results'
      
      return { room, results }
    }

    return { room }
  }

  nextRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.choices = {}
    room.round++
    room.gameState = 'playing'
    room.lastActivity = Date.now()

    return room
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null
  }

  private getWinner(choice1: string, choice2: string): 'player1' | 'player2' | 'tie' {
    if (choice1 === choice2) return 'tie'
    if (
      (choice1 === 'stone' && choice2 === 'scissors') ||
      (choice1 === 'paper' && choice2 === 'stone') ||
      (choice1 === 'scissors' && choice2 === 'paper')
    ) {
      return 'player1'
    }
    return 'player2'
  }
}

// Export singleton instance
export const gameStore = new GameStore()
export type { Room, Player, RoundResults }
