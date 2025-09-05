import { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const getWinner = (choice1: string, choice2: string) => {
  if (choice1 === choice2) return 'tie'
  if (
    (choice1 === 'stone' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'stone') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) return 'player1'
  return 'player2'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { roomId, playerId, choice } = req.body || {}
  if (!roomId || !playerId || !choice) return res.status(400).json({ error: 'Missing fields' })

  const roomKey = `rps:room:${roomId}`
  const room = await redis.get(roomKey) as any
  if (!room) return res.status(404).json({ error: 'Room not found' })

  room.choices[playerId] = choice

  // If both have chosen, evaluate
  if (Object.keys(room.choices).length === 2) {
    const [id1, id2] = room.players.map((p: any) => p.id)
    const winner = getWinner(room.choices[id1], room.choices[id2])
    if (winner === 'player1') room.scores[id1]++
    else if (winner === 'player2') room.scores[id2]++
    room.gameState = 'results'
    room.results = { winner, choices: { [id1]: room.choices[id1], [id2]: room.choices[id2] } }
  }

  room.updatedAt = Date.now()
  await redis.set(roomKey, room, { ex: 60 * 60 })
  return res.status(200).json({ room })
}

