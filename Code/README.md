# DrawSocket - Collaborative Drawing Community

A real-time collaborative drawing application with community features, built with Node.js, WebSocket, and SQLite.

## Features

### 🎨 Drawing & Collaboration
- **Real-time Drawing**: Multiple users can draw simultaneously on the same canvas
- **Multiple Brush Styles**: Normal, spray, paint, and roller brushes
- **Customizable Tools**: Brush sizes, color picker, eraser
- **Live Collaboration**: See other users drawing in real-time

### 🏠 Community Features  
- **Gallery Browse**: Explore artworks created by the community
- **User Profiles**: Personal profiles with artwork collections
- **Comments & Likes**: Interact with other users' artworks
- **Drawing Rooms**: Join existing drawing sessions or create new ones

### 🔐 User Management
- **User Registration & Login**: Secure account system
- **Personal Avatars**: Auto-generated user avatars
- **Profile Management**: Track your artwork and activity

### 🛠 Administration
- **Data Management**: One-click clear all app data (preserves user accounts)
- **Session Management**: Manage drawing rooms and sessions
- **SQLite Database**: Lightweight database for easy deployment

## Tech Stack

- **Backend**: Node.js, Express.js, WebSocket (ws), SQLite3
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Database**: SQLite with user management, sessions, artworks, comments
- **Real-time**: WebSocket for live drawing synchronization

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lds-cyx/draw.git
cd draw
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and visit: `http://localhost:3000`

### Dependencies
```json
{
  "express": "^4.18.0",
  "ws": "^8.13.0",
  "sqlite3": "^5.1.6",
  "uuid": "^9.0.0"
}
```

## Project Structure

```
drawsocket/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── drawings.db            # SQLite database (auto-created)
├── public/
│   ├── index.html         # Main HTML page
│   ├── multipage-app.js   # Main application logic
│   ├── multipage-styles.css # Main styles
│   ├── avatar-helper.js   # Avatar generation
│   ├── sessions-page.js   # Session management
│   ├── brush-styles.css   # Brush styling
│   └── pagination.css     # Pagination styling
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Sessions & Drawing
- `GET /api/sessions` - Get drawing sessions (paginated)
- `POST /api/sessions/new` - Create new drawing session
- `GET /api/sessions/:id/actions` - Get drawing actions for session
- `DELETE /api/sessions/:id` - Delete session

### Artworks
- `GET /api/artworks` - Get published artworks (paginated)
- `POST /api/artworks` - Publish artwork
- `POST /api/artworks/save` - Save artwork privately
- `GET /api/artworks/:id` - Get artwork details

### Community
- `GET /api/artworks/:id/comments` - Get artwork comments
- `POST /api/artworks/:id/comments` - Add comment
- `POST /api/artworks/:id/like` - Like/unlike artwork

### Administration
- `POST /api/clear-app-data` - Clear all app data (admin feature)

## Database Schema

The application uses SQLite with the following tables:
- `users` - User accounts and profiles  
- `sessions` - Drawing room sessions
- `draw_actions` - Individual drawing actions
- `artworks` - Published artworks
- `comments` - Artwork comments
- `likes` - User likes on artworks

## Features Overview

### Drawing Interface
- Multi-page application design
- Real-time canvas synchronization
- Brush customization tools
- Online user indicators

### Community Features
- Artwork gallery with pagination
- User profiles and artwork collections
- Comments and social interactions
- Like system for artworks

### Admin Features
- One-click data clearing (preserves users)
- Session management
- Database maintenance tools

## Development

### Running in Development
```bash
# Install dependencies
npm install

# Start server with auto-reload (if using nodemon)
npm run dev

# Or start normally
npm start
```

### Database Management
The SQLite database is automatically created on first run. To reset data:
- Use the admin clear data feature in the app
- Or manually delete `drawings.db` file

## Deployment

This application is designed for easy deployment:

1. **Server Requirements**: Node.js environment
2. **Database**: SQLite (no external database required)
3. **Static Files**: Served via Express static middleware
4. **WebSocket**: Built-in WebSocket server for real-time features

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Screenshots

[Add screenshots of your application here]

---

**DrawSocket** - Where creativity meets collaboration! 🎨✨
