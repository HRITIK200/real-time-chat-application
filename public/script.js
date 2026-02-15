const socket = io();

const username = localStorage.getItem("username");
const room = localStorage.getItem("room");

let currentRoom;
let currentUser;


currentUser = username;
currentRoom = room;

socket.emit("joinRoom", {
  username: currentUser,
  room: currentRoom
});
function switchRoom(newRoom) {

  if (newRoom === currentRoom) return;

  currentRoom = newRoom;

  socket.emit("joinRoom", {
    username: currentUser,
    room: currentRoom
  });

  document.getElementById("room-title").innerText = newRoom;

  document.querySelector(".messages").innerHTML = "";
}


socket.on("usernameError", (error) => {
  alert(error);
  window.location.href = "/";
});

// Update room title
document.getElementById("room-title").innerText = room;


// Handle tab visibility to manage notifications
let isTabActive = true;

window.onfocus = () => {
  isTabActive = true;
  document.title = "Chat Room";
};

window.onblur = () => {
  isTabActive = false;
};


const form = document.getElementById("chat-form");
const input = document.getElementById("msg");
const messages = document.getElementById("messages");
const usersList = document.getElementById("users");
const roomsList = document.getElementById("rooms");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (input.value.trim() !== "") {
    socket.emit("chatMessage", formatMessage(input.value));
    input.value = "";
  }
});

socket.on("message", (data) => {
  const div = document.createElement("div");

  div.classList.add("message");

  if (data.user === username) {
    div.classList.add("my-message");
  } else if (data.user === "System") {
    div.classList.add("system-message");
  } else {
    div.classList.add("other-message");
  }

  div.innerHTML = `
    <div class="message-content">
      <span class="message-user">${data.user}</span>
      <p>${data.text}</p>
      <span class="message-time">${data.time}</span>
    </div>
  `;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});



socket.on("roomUsers", (users) => {
  usersList.innerHTML = "";

  document.getElementById("online-count").innerText = users.length + " online";

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    usersList.appendChild(li);
  });
});

socket.on("roomList", (rooms) => {
  roomsList.innerHTML = "";
  rooms.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    roomsList.appendChild(li);
  });
});

function formatMessage(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  text = text.replace(/\*(.*?)\*/g, "<i>$1</i>");
  text = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );
  return text;
}

function switchRoom(newRoom) {
  socket.emit("joinRoom", {
    username: currentUser,
    room: newRoom
  });

  document.getElementById("room-title").innerText = newRoom;
}

let users = [];

function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}
