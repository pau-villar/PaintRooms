<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { socket } from "../socket";
import { state } from "../state";

const props = defineProps({ roomName: String });
const router = useRouter();

const onUsers = (users) => {
  state.users = users;
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
});

onUnmounted(() => {
  socket.off("room_users", onUsers);
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
      <h2>Usuarios ({{ state.users.length }})</h2>
      <ul>
        <li v-for="u in state.users" :key="u.username + u.color">
          <span class="dot" :style="{ background: u.color }"></span>
          {{ u.username }}
        </li>
      </ul>
    </aside>

    <section>
      <!-- Aquí irá el canvas -->
      <p>Canvas próximamente</p>
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