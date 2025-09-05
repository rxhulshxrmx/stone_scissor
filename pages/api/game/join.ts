import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { roomId, playerId, playerName } = req.body || {}
  if (!roomId || !playerId || !playerName) return res.status(400).json({ error: 'Missing fields' })

  const roomKey = `rps:room:${roomId}`
  const now = Date.now()

  let room = await redis.get(roomKey) as any
  if (!room) {
    room = {
      id: roomId,
      players: [],
      gameState: 'waiting',
      choices: {},
      scores: {},
      round: 0,
      updatedAt: now,
    }
  }

  // Ensure player exists (max 2)
  if (!room.players.find((p: any) => p.id === playerId) && room.players.length < 2) {
    room.players.push({ id: playerId, name: playerName })
    room.scores[playerId] = room.scores[playerId] || 0
  }

  if (room.players.length === 2 && room.gameState === 'waiting') {
    room.gameState = 'playing'
    room.round = 1
  }

  room.updatedAt = now
  await redis.set(roomKey, room, { ex: 60 * 60 })
  return res.status(200).json({ room })
}

