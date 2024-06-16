const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv=require('dotenv');

// dotenv.config({path: __dirname + '../../.env'});
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});
const users = {};
const socketToUser = {}; // Track user by socket ID

//--------------------Deployment--------------------------
const aa=process.env.NODE_ENV;
 console.log("pp",aa)
 const __dirname1 = path.resolve();

 if (process.env.NODE_ENV === "production") {

  // app.use(express.static(path.join(__dirname1, '../client/build')))
  app.use(express.static(path.join(__dirname1, '/client/build')))
console.log(__dirname1)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname1, 'client', 'build', 'index.html'))
  }
  )
}

else {
  app.get("/", (req, res) => {
    res.send("Api is running successfully")
  })
}

//--------------------Deployment--------------------------



io.on('connection', (socket) => {
  console.log('a user connected');

socket.on('join', ({ user, room }) => {
  socket.join(room);
  socketToUser[socket.id] = { user, room };

  if (!users[room]) {
    users[room] = [];
  }
  users[room].push(user);


  io.to(room).emit('whojoined', users[room]);

  console.log(`${user} joined room: ${room}`);
});

  socket.on('sendMessage', (message) => {
    // Add sender ID to the message
    console.log('message',message)
    const newMessage = { senderId: socket.id, content: message.content, username: message.username,time:message.time,room:message.room };
    console.log(newMessage)
    io.to(message.room).emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    const userInfo = socketToUser[socket.id];
    if (userInfo) {
      const { user, room } = userInfo;
      users[room] = users[room].filter(username => username !== user);
      io.to(room).emit('whojoined', users[room]);
      delete socketToUser[socket.id];
      console.log(`${user} left room: ${room}`);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});