import { NextApiRequest, NextApiResponse } from 'next'
import { gameStore } from '@/lib/gameStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { roomId, playerId, playerName } = req.body

    if (!roomId || !playerId || !playerName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const room = gameStore.joinRoom(roomId, playerId, playerName)
    
    res.status(200).json({ room })
  } catch (error) {
    console.error('Error joining room:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
