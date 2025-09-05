import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { roomId } = req.body || {}
  if (!roomId) return res.status(400).json({ error: 'Missing roomId' })

  const roomKey = `rps:room:${roomId}`
  const room = await redis.get(roomKey) as any
  if (!room) return res.status(404).json({ error: 'Room not found' })

  room.choices = {}
  room.round = (room.round || 0) + 1
  room.gameState = 'playing'
  room.results = undefined
  room.updatedAt = Date.now()
  await redis.set(roomKey, room, { ex: 60 * 60 })
  return res.status(200).json({ room })
}

