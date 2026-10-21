import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const ROOM_NAMES = ["General", "Dibujo libre", "Garabatos", "Proyecto"];

// roomName -> { strokes: [], users: Map(socketId -> { username, color }) }
const rooms = new Map(
  ROOM_NAMES.map((name) => [name, { strokes: [], users: new Map() }])
);

const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6"];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const getUsersList = (roomName) => {
  const room = rooms.get(roomName);
  return room ? [...room.users.values()] : [];
};

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  // Lista de salas para el Lobby
  socket.on("room_list", (callback) => {
    callback?.(
      [...rooms.entries()].map(([name, room]) => ({
        name,
        users: room.users.size,
      }))
    );
  });

  // Entrar en una sala existente
  socket.on("join_room", ({ roomName, username }, callback) => {
    if (!roomName || !username) return callback?.({ error: "Datos incompletos" });

    const room = rooms.get(roomName);
    if (!room) return callback?.({ error: "La sala no existe" });

    const user = { username, color: randomColor() };
    room.users.set(socket.id, user);
    socket.data.roomName = roomName;
    socket.join(roomName);

    // Estado inicial solo para quien entra
    callback?.({ user, strokes: room.strokes, users: getUsersList(roomName) });

    // Lista actualizada para toda la sala
    io.to(roomName).emit("room_users", getUsersList(roomName));
  });

  socket.on("disconnect", () => {
    const roomName = socket.data.roomName;
    const room = rooms.get(roomName);
    if (!room) return;

    room.users.delete(socket.id);
    io.to(roomName).emit("room_users", getUsersList(roomName));
  });
});

httpServer.listen(3000, () => console.log("Servidor en :3000"));