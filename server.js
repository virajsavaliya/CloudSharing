// server.js

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer);
  let rooms = {};

  io.on('connection', (socket) => {
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const roomId = `room-${ip}`;

    socket.on('join-room', (user) => {
      if (!user) return;
      
      socket.join(roomId);
      socket.currentRoom = roomId;

      if (!rooms[roomId]) {
        rooms[roomId] = {};
      }
      
      const otherUsers = { ...rooms[roomId] };
      rooms[roomId][socket.id] = user;

      socket.emit('existing-users', otherUsers);
      socket.to(roomId).emit('user-joined', { id: socket.id, user: user });
    });

    socket.on('signal', (data) => {
      io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    });

    socket.on('disconnect', () => {
      const { currentRoom, id } = socket;
      if (currentRoom && rooms[currentRoom]) {
        delete rooms[currentRoom][id];
        io.to(currentRoom).emit('user-left', id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});