import { NextApiRequest, NextApiResponse } from 'next'
import { gameStore } from '@/lib/gameStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { roomId } = req.body

    if (!roomId) {
      return res.status(400).json({ error: 'Missing room ID' })
    }

    const room = gameStore.nextRound(roomId)
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    res.status(200).json({ room })
  } catch (error) {
    console.error('Error starting next round:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
