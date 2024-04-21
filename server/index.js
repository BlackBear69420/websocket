const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let roomUsernames = {}; // Object to store usernames for each room

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`User with ID: ${socket.id} joined room: ${data.room}`);

    // Initialize usernames array for the room if it doesn't exist
    if (!roomUsernames[data.room]) {
      roomUsernames[data.room] = [];
    }

    // Push username into the array for the room
    roomUsernames[data.room].push({ id: socket.id, username: data.username });
    console.log(`Usernames for room ${data.room}: ${JSON.stringify(roomUsernames[data.room])}`);

    // Emit updated list of usernames to the client
    io.to(data.room).emit("user_list_update", roomUsernames[data.room].map(user => user.username));
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    // Remove user from all room arrays in roomUsernames
    Object.keys(roomUsernames).forEach((room) => {
      roomUsernames[room] = roomUsernames[room].filter(
        (user) => user.id !== socket.id
      );
      console.log(`Usernames for room ${room} after disconnect: ${JSON.stringify(roomUsernames[room])}`);
      // Emit updated list of usernames to the client
      io.to(room).emit("user_list_update", roomUsernames[room].map(user => user.username));
    });
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
