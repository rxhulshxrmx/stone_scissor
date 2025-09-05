'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface GameState {
  roomId: string
  players: { id: string; name: string; choice?: string; score: number }[]
  round: number
  gameState: 'waiting' | 'playing' | 'results'
  results?: {
    winner: string
    choices: Record<string, string>
  }
  lastUpdate: number
}

const choiceEmojis = {
  stone: '🪨',
  paper: '📄',
  scissors: '✂️'
}

export default function GamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 15))
  const [playerChoice, setPlayerChoice] = useState<string>('')
  const [showResults, setShowResults] = useState(false)

  const roomId = searchParams?.get('room')
  const playerName = searchParams?.get('name')

  // Get game state from localStorage
  const getGameState = useCallback((): GameState | null => {
    if (!roomId) return null
    const stored = localStorage.getItem(`game_${roomId}`)
    return stored ? JSON.parse(stored) : null
  }, [roomId])

  // Save game state to localStorage
  const saveGameState = useCallback((state: GameState) => {
    if (!roomId) return
    localStorage.setItem(`game_${roomId}`, JSON.stringify(state))
    setGameState(state)
  }, [roomId])

  // Initialize or join game
  useEffect(() => {
    if (!roomId || !playerName) {
      router.push('/')
      return
    }

    let currentState = getGameState()
    
    if (!currentState) {
      // Create new game
      currentState = {
        roomId,
        players: [{
          id: playerId,
          name: playerName,
          score: 0
        }],
        round: 0,
        gameState: 'waiting',
        lastUpdate: Date.now()
      }
    } else {
      // Join existing game
      const existingPlayer = currentState.players.find(p => p.name === playerName)
      if (!existingPlayer && currentState.players.length < 2) {
        currentState.players.push({
          id: playerId,
          name: playerName,
          score: 0
        })
        currentState.lastUpdate = Date.now()
      }
      
      // Start game if 2 players
      if (currentState.players.length === 2 && currentState.gameState === 'waiting') {
        currentState.gameState = 'playing'
        currentState.round = 1
        currentState.lastUpdate = Date.now()
      }
    }

    saveGameState(currentState)
  }, [roomId, playerName, playerId, router, getGameState, saveGameState])

  // Poll for updates from other player
  useEffect(() => {
    if (!roomId) return

    const interval = setInterval(() => {
      const currentState = getGameState()
      if (currentState && currentState.lastUpdate !== gameState?.lastUpdate) {
        setGameState(currentState)
        
        // Check if both players made choices
        if (currentState.gameState === 'playing' && 
            currentState.players.length === 2 &&
            currentState.players.every(p => p.choice)) {
          
          // Calculate results
          const [player1, player2] = currentState.players
          const winner = getWinner(player1.choice!, player2.choice!)
          
          if (winner === player1.name) player1.score++
          else if (winner === player2.name) player2.score++
          
          currentState.results = {
            winner,
            choices: {
              [player1.id]: player1.choice!,
              [player2.id]: player2.choice!
            }
          }
          currentState.gameState = 'results'
          currentState.lastUpdate = Date.now()
          
          saveGameState(currentState)
          setShowResults(true)
          
          // Reset for next round after 3 seconds
          setTimeout(() => {
            currentState.players.forEach(p => { delete p.choice })
            currentState.round++
            currentState.gameState = 'playing'
            delete currentState.results
            currentState.lastUpdate = Date.now()
            
            saveGameState(currentState)
            setPlayerChoice('')
            setShowResults(false)
          }, 3000)
        }
      }
    }, 500) // Poll every 500ms

    return () => clearInterval(interval)
  }, [roomId, gameState?.lastUpdate, getGameState, saveGameState])

  const getWinner = (choice1: string, choice2: string): string => {
    if (choice1 === choice2) return 'tie'
    if (
      (choice1 === 'stone' && choice2 === 'scissors') ||
      (choice1 === 'paper' && choice2 === 'stone') ||
      (choice1 === 'scissors' && choice2 === 'paper')
    ) {
      return gameState?.players.find(p => p.choice === choice1)?.name || 'player1'
    }
    return gameState?.players.find(p => p.choice === choice2)?.name || 'player2'
  }

  const makeChoice = useCallback((choice: string) => {
    if (!gameState || gameState.gameState !== 'playing' || playerChoice) return

    setPlayerChoice(choice)
    
    const currentState = getGameState()
    if (!currentState) return

    const myPlayer = currentState.players.find(p => p.name === playerName)
    if (myPlayer) {
      myPlayer.choice = choice
      currentState.lastUpdate = Date.now()
      saveGameState(currentState)
    }
  }, [gameState, playerChoice, playerName, getGameState, saveGameState])

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.players.find(p => p.name === playerName)
  const opponent = gameState.players.find(p => p.name !== playerName)

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Room: {roomId}</h1>
              <p className="text-gray-600">Round {gameState.round}</p>
              <p className="text-xs text-green-600">✅ Always Connected (LocalStorage)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyRoomCode}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Copy Code
              </button>
              <button
                onClick={goHome}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Waiting for players */}
        {gameState.gameState === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {gameState.players.length === 1 ? 'Waiting for opponent...' : 'Get ready!'}
            </h2>
            <div className="space-y-4">
              {gameState.players.map((player) => (
                <div key={player.id} className="flex items-center justify-center gap-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-lg">{player.name}</span>
                  {player.name === playerName && <span className="text-sm text-gray-500">(You)</span>}
                </div>
              ))}
              {gameState.players.length === 1 && (
                <div className="flex items-center justify-center gap-4 opacity-50">
                  <div className="w-4 h-4 bg-gray-300 rounded-full pulse-waiting"></div>
                  <span className="text-lg text-gray-500">Waiting for player...</span>
                </div>
              )}
            </div>
            {gameState.players.length === 1 && (
              <p className="mt-6 text-gray-600">Share room code <strong>{roomId}</strong> with a friend!</p>
            )}
          </div>
        )}

        {/* Game playing */}
        {gameState.gameState === 'playing' && !showResults && (
          <div className="space-y-6">
            {/* Scores */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{currentPlayer?.name} (You)</h3>
                  <p className="text-3xl font-bold text-primary">{currentPlayer?.score || 0}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{opponent?.name || 'Waiting...'}</h3>
                  <p className="text-3xl font-bold text-secondary">{opponent?.score || 0}</p>
                </div>
              </div>
            </div>

            {/* Choice selection */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                Make your choice!
              </h2>
              
              <div className="flex justify-center gap-8">
                {Object.entries(choiceEmojis).map(([choice, emoji]) => (
                  <button
                    key={choice}
                    onClick={() => makeChoice(choice)}
                    disabled={!!playerChoice}
                    className={`choice-btn ${playerChoice === choice ? 'selected' : ''} ${
                      playerChoice && playerChoice !== choice ? 'opacity-50' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="text-center mt-8 space-y-2">
                {playerChoice && (
                  <p className="text-green-600 font-semibold">
                    You chose: {choiceEmojis[playerChoice as keyof typeof choiceEmojis]}
                  </p>
                )}
                {opponent?.choice && (
                  <p className="text-blue-600 font-semibold">
                    {opponent.name} has made their choice!
                  </p>
                )}
                {playerChoice && opponent?.choice && (
                  <p className="text-gray-600 animate-pulse">
                    Revealing results...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && gameState.results && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Round {gameState.round} Results</h2>
            
            <div className="flex justify-center items-center gap-12 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{currentPlayer?.name}</h3>
                <div className={`choice-btn text-6xl ${
                  gameState.results.winner === currentPlayer?.name ? 'winner' :
                  gameState.results.winner === 'tie' ? '' : 'loser'
                }`}>
                  {choiceEmojis[gameState.results.choices[currentPlayer?.id || ''] as keyof typeof choiceEmojis]}
                </div>
              </div>
              
              <div className="text-4xl font-bold text-gray-400">VS</div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{opponent?.name}</h3>
                <div className={`choice-btn text-6xl ${
                  gameState.results.winner === opponent?.name ? 'winner' :
                  gameState.results.winner === 'tie' ? '' : 'loser'
                }`}>
                  {choiceEmojis[gameState.results.choices[opponent?.id || ''] as keyof typeof choiceEmojis]}
                </div>
              </div>
            </div>

            <div className="mb-6">
              {gameState.results.winner === 'tie' ? (
                <p className="text-2xl font-bold text-yellow-600">It's a tie!</p>
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {gameState.results.winner === currentPlayer?.name ? 'You win!' : `${gameState.results.winner} wins!`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{currentPlayer?.name}</h4>
                <p className="text-2xl font-bold text-primary">{currentPlayer?.score || 0}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{opponent?.name}</h4>
                <p className="text-2xl font-bold text-secondary">{opponent?.score || 0}</p>
              </div>
            </div>

            <p className="mt-6 text-gray-600">Next round starting soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
