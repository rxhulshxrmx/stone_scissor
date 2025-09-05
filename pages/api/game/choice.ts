import { NextApiRequest, NextApiResponse } from 'next'
import { gameStore } from '@/lib/gameStore'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { playerId, choice } = req.body

    if (!playerId || !choice) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const result = gameStore.makeChoice(playerId, choice)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Error making choice:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' })
  }
}
