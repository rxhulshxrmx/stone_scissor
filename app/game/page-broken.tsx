'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
}

interface RoundResults {
  round: number
  choices: Record<string, string>
  winner: 'player1' | 'player2' | 'tie'
  scores: Record<string, number>
}

const choiceEmojis = {
  stone: '🪨',
  paper: '📄',
  scissors: '✂️'
}

export default function GamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [playerChoice, setPlayerChoice] = useState<string>('')
  const [opponentChose, setOpponentChose] = useState(false)
  const [results, setResults] = useState<RoundResults | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 15))

  const roomId = searchParams?.get('room')
  const playerName = searchParams?.get('name')

  // Polling function to get room status
  const pollRoomStatus = useCallback(async () => {
    if (!roomId) return

    try {
      const response = await fetch(`/api/game/status?roomId=${roomId}`)
      if (response.ok) {
        const data = await response.json()
        const newRoom = data.room

        // Check if opponent made a choice
        if (newRoom.gameState === 'playing') {
          const choiceCount = Object.keys(newRoom.choices).length
          const myChoice = newRoom.choices[playerId]
          
          if (choiceCount === 1 && !myChoice) {
            setOpponentChose(true)
          } else if (choiceCount === 1 && myChoice) {
            setOpponentChose(false)
          }
        }

        setRoom(newRoom)
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error polling room status:', error)
      setConnectionStatus('disconnected')
    }
  }, [roomId, playerId])

  // Join room on component mount
  useEffect(() => {
    if (!roomId || !playerName) {
      router.push('/')
      return
    }

    const joinRoom = async () => {
      try {
        const response = await fetch('/api/game/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, playerId, playerName })
        })

        if (response.ok) {
          const data = await response.json()
          setRoom(data.room)
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        console.error('Error joining room:', error)
        setConnectionStatus('disconnected')
      }
    }

    joinRoom()
  }, [roomId, playerName, playerId, router])

  // Set up polling for room updates
  useEffect(() => {
    if (connectionStatus !== 'connected' || !roomId) return

    const interval = setInterval(pollRoomStatus, 1000) // Poll every second

    return () => clearInterval(interval)
  }, [connectionStatus, roomId, pollRoomStatus])

  // Handle results and next round
  useEffect(() => {
    if (!room) return

    if (room.gameState === 'results' && Object.keys(room.choices).length === 2) {
      const playerIds = room.players.map(p => p.id)
      const choice1 = room.choices[playerIds[0]]
      const choice2 = room.choices[playerIds[1]]
      
      // Determine winner
      let winner: 'player1' | 'player2' | 'tie' = 'tie'
      if (choice1 !== choice2) {
        if (
          (choice1 === 'stone' && choice2 === 'scissors') ||
          (choice1 === 'paper' && choice2 === 'stone') ||
          (choice1 === 'scissors' && choice2 === 'paper')
        ) {
          winner = 'player1'
        } else {
          winner = 'player2'
        }
      }

      const results: RoundResults = {
        round: room.round,
        choices: room.choices,
        winner,
        scores: room.scores
      }

      setResults(results)
      setShowResults(true)
      setOpponentChose(false)

      // Auto-start next round after 3 seconds
      setTimeout(async () => {
        try {
          await fetch('/api/game/next-round', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId })
          })
          
          setPlayerChoice('')
          setOpponentChose(false)
          setShowResults(false)
          setResults(null)
        } catch (error) {
          console.error('Error starting next round:', error)
        }
      }, 3000)
    }
  }, [room, roomId])

  const makeChoice = useCallback(async (choice: string) => {
    if (!room || room.gameState !== 'playing' || playerChoice) return

    setPlayerChoice(choice)

    try {
      const response = await fetch('/api/game/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, choice })
      })

      if (!response.ok) {
        setPlayerChoice('') // Reset on error
      }
    } catch (error) {
      console.error('Error making choice:', error)
      setPlayerChoice('') // Reset on error
    }
  }, [room?.gameState, playerChoice, playerId])

  const copyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Connecting to game...</p>
        </div>
      </div>
    )
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Connection lost</p>
          <button onClick={goHome} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading room...</p>
        </div>
      </div>
    )
  }

  const currentPlayer = room.players.find(p => p.id === playerId)
  const opponent = room.players.find(p => p.id !== playerId)

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Room: {roomId}</h1>
              <p className="text-gray-600">Round {room.round || 0}</p>
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
        {room.gameState === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {room.players.length === 1 ? 'Waiting for opponent...' : 'Get ready!'}
            </h2>
            <div className="space-y-4">
              {room.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-center gap-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-lg">{player.name}</span>
                  {player.id === playerId && <span className="text-sm text-gray-500">(You)</span>}
                </div>
              ))}
              {room.players.length === 1 && (
                <div className="flex items-center justify-center gap-4 opacity-50">
                  <div className="w-4 h-4 bg-gray-300 rounded-full pulse-waiting"></div>
                  <span className="text-lg text-gray-500">Waiting for player...</span>
                </div>
              )}
            </div>
            {room.players.length === 1 && (
              <p className="mt-6 text-gray-600">Share room code <strong>{roomId}</strong> with a friend!</p>
            )}
          </div>
        )}

        {/* Game playing */}
        {room.gameState === 'playing' && !showResults && (
          <div className="space-y-6">
            {/* Scores */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{currentPlayer?.name} (You)</h3>
                  <p className="text-3xl font-bold text-primary">{room.scores[playerId] || 0}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{opponent?.name || 'Opponent'}</h3>
                  <p className="text-3xl font-bold text-secondary">{room.scores[opponent?.id || ''] || 0}</p>
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
                {opponentChose && (
                  <p className="text-blue-600 font-semibold">
                    Opponent has made their choice!
                  </p>
                )}
                {playerChoice && opponentChose && (
                  <p className="text-gray-600 animate-pulse">
                    Revealing results...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && results && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Round {results.round} Results</h2>
            
            <div className="flex justify-center items-center gap-12 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{currentPlayer?.name}</h3>
                <div className={`choice-btn text-6xl ${
                  results.winner === 'player1' && room.players[0]?.id === playerId ? 'winner' :
                  results.winner === 'player2' && room.players[1]?.id === playerId ? 'winner' :
                  results.winner === 'tie' ? '' : 'loser'
                }`}>
                  {choiceEmojis[results.choices[playerId] as keyof typeof choiceEmojis]}
                </div>
              </div>
              
              <div className="text-4xl font-bold text-gray-400">VS</div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{opponent?.name}</h3>
                <div className={`choice-btn text-6xl ${
                  results.winner === 'player1' && room.players[0]?.id === opponent?.id ? 'winner' :
                  results.winner === 'player2' && room.players[1]?.id === opponent?.id ? 'winner' :
                  results.winner === 'tie' ? '' : 'loser'
                }`}>
                  {choiceEmojis[results.choices[opponent?.id || ''] as keyof typeof choiceEmojis]}
                </div>
              </div>
            </div>

            <div className="mb-6">
              {results.winner === 'tie' ? (
                <p className="text-2xl font-bold text-yellow-600">It's a tie!</p>
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {results.winner === 'player1' 
                    ? (room.players[0]?.id === playerId ? 'You win!' : `${room.players[0]?.name} wins!`)
                    : (room.players[1]?.id === playerId ? 'You win!' : `${room.players[1]?.name} wins!`)
                  }
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{currentPlayer?.name}</h4>
                <p className="text-2xl font-bold text-primary">{results.scores[playerId] || 0}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{opponent?.name}</h4>
                <p className="text-2xl font-bold text-secondary">{results.scores[opponent?.id || ''] || 0}</p>
              </div>
            </div>

            <p className="mt-6 text-gray-600">Next round starting soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
