<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { socket } from "../socket";
import { state } from "../state";
import CanvasBoard from "../components/CanvasBoard.vue";

const props = defineProps({ roomName: String });
const router = useRouter();

const onUsers = (users) => {
  state.users = users;
};

const onCursorMove = (data) => {
  state.cursors[data.id] = data;
};

const onCursorLeave = (id) => {
  delete state.cursors[id];
};

onMounted(() => {
  // Si no hay nombre (entró directo por URL), vuelve al lobby
  if (!state.username) return router.replace("/");

  socket.connect();
  socket.emit(
    "join_room",
    { roomName: props.roomName, username: state.username },
    (res) => {
      if (res.error) {
        alert(res.error);
        return router.replace("/");
      }
      state.me = res.user;
      state.users = res.users;
      state.strokes = res.strokes;
    }
  );
  socket.on("room_users", onUsers);
  socket.on("cursor_move", onCursorMove);
  socket.on("cursor_leave", onCursorLeave);
});

onUnmounted(() => {
  socket.off("room_users", onUsers);
  socket.off("cursor_move", onCursorMove);
  socket.off("cursor_leave", onCursorLeave);
  state.cursors = {};
  socket.disconnect(); // el servidor nos quita de la sala
});
</script>

<template>
  <main class="room">
    <header>
      <button @click="router.push('/')">← Salir</button>
      <h1>{{ roomName }}</h1>
    </header>

    <aside>
      <h2>Usuarios: {{ state.users.length }}</h2>
      <ul>
        <li v-for="u in state.users" :key="u.username + u.color">
          <span class="dot" :style="{ background: u.color }"></span>
          {{ u.username }}
        </li>
      </ul>
    </aside>

    <section>
      <CanvasBoard />
    </section>
  </main>
</template>

<style>
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
</style>