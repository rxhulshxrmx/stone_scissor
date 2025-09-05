import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const roomId = req.query.roomId as string
  if (!roomId) return res.status(400).json({ error: 'Missing roomId' })

  const roomKey = `rps:room:${roomId}`
  const room = await redis.get(roomKey)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  return res.status(200).json({ room })
}

