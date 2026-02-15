const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {}; 
// {
//   roomName: { users: [username1, username2] }
// }

const users = [];

function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {

    // Remove from previous room if exists
    const existingUser = getCurrentUser(socket.id);
    if (existingUser) {
      socket.leave(existingUser.room);

      socket.to(existingUser.room).emit("message", {
        user: "System",
        text: `${existingUser.username} left the room`,
        time: new Date().toLocaleTimeString()
      });

      userLeave(socket.id);
    }

    // Join new room
    const user = userJoin(socket.id, username, room);
    socket.join(room);

    // Notify others
    socket.to(room).emit("message", {
      user: "System",
      text: `${username} joined the room`,
      time: new Date().toLocaleTimeString()
    });

    // Send updated users list
    io.to(room).emit("roomUsers", {
      room,
      users: getRoomUsers(room)
    });

  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      socket.to(user.room).emit("message", {
        user: "System",
        text: `${user.username} disconnected`,
        time: new Date().toLocaleTimeString()
      });

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

});



server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
