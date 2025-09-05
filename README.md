# Stone Paper Scissors - Real-time Multiplayer Game

A modern, real-time multiplayer Stone Paper Scissors game built with Next.js, Socket.IO, and Tailwind CSS. Play with friends in real-time with a beautiful, Kahoot-style interface.

## Features

- 🎮 Real-time multiplayer gameplay
- 🎨 Modern, responsive UI with Tailwind CSS
- 🏆 Live scoring system
- 🔗 Room-based matchmaking with shareable codes
- ⚡ Instant result evaluation
- 📱 Mobile-friendly design
- 🚀 Vercel-optimized deployment

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stone_paper_scissor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Enter your name** on the home page
2. **Create a new room** or **join an existing room** with a room code
3. **Share the room code** with a friend
4. **Make your choice** (Stone 🪨, Paper 📄, or Scissors ✂️)
5. **See the results** instantly after both players choose
6. **Play multiple rounds** and track your score!

## Game Rules

- Stone crushes Scissors
- Paper covers Stone  
- Scissors cuts Paper
- Same choices result in a tie

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Connect your repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect the Next.js configuration

3. The app will be deployed with real-time Socket.IO functionality working out of the box.

### Environment Variables

No environment variables are required for basic functionality.

## Project Structure

```
stone_paper_scissor/
├── app/
│   ├── game/
│   │   └── page.tsx          # Game room component
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── server.js                # Socket.IO server
├── package.json
├── tailwind.config.js
├── next.config.js
├── vercel.json              # Vercel deployment config
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
