'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')
  const router = useRouter()

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(id)
  }

  const joinRoom = () => {
    if (playerName.trim() && roomId.trim()) {
      router.push(`/game?room=${roomId}&name=${encodeURIComponent(playerName)}`)
    }
  }

  const createRoom = () => {
    if (playerName.trim()) {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      router.push(`/game?room=${newRoomId}&name=${encodeURIComponent(playerName)}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🪨📄✂️
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Stone Paper Scissors
          </h2>
          <p className="text-gray-600">Real-time multiplayer game</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room Code
            </label>
            <div className="flex gap-2">
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                maxLength={6}
              />
              <button
                onClick={generateRoomId}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Generate random room code"
              >
                🎲
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={joinRoom}
              disabled={!playerName.trim() || !roomId.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
            
            <div className="text-center text-gray-500 text-sm">or</div>
            
            <button
              onClick={createRoom}
              disabled={!playerName.trim()}
              className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create New Room
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Share the room code with a friend to play together!</p>
        </div>
      </div>
    </div>
  )
}
