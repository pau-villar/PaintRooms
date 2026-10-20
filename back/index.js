import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

// roomName -> { strokes: [], users: Map(socketId -> { username, color }) }
const rooms = new Map();

const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6"];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function getUsersList(roomName) {
  const room = rooms.get(roomName);
  return room ? [...room.users.values()] : [];
}

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  socket.on("join_room", ({ roomName, username }, callback) => {
    if (!roomName || !username) return;

    // Crear la sala si no existe
    if (!rooms.has(roomName)) {
      rooms.set(roomName, { strokes: [], users: new Map() });
    }
    const room = rooms.get(roomName);

    // Guardar usuario
    const user = { username, color: randomColor() };
    room.users.set(socket.id, user);
    socket.data.roomName = roomName;
    socket.join(roomName);

    // Devolver estado inicial solo a quien entra
    callback?.({ user, strokes: room.strokes, users: getUsersList(roomName) });

    // Avisar a toda la sala de la nueva lista
    io.to(roomName).emit("room_users", getUsersList(roomName));
  });

  socket.on("disconnect", () => {
    const roomName = socket.data.roomName;
    if (!roomName || !rooms.has(roomName)) return;

    const room = rooms.get(roomName);
    room.users.delete(socket.id);

    if (room.users.size === 0) {
      rooms.delete(roomName); // sala vacía: se elimina
    } else {
      io.to(roomName).emit("room_users", getUsersList(roomName));
    }
  });
});

httpServer.listen(3000, () => console.log("Servidor en :3000"));