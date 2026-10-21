<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { socket } from "../socket";
import { state } from "../state";

const router = useRouter();
const username = ref(state.username);
const rooms = ref([]);

onMounted(() => {
  if (!socket.connected) socket.connect();
  socket.emit("room_list", (list) => {
    rooms.value = list;
  });
});

function enter(roomName) {
  const name = username.value.trim();
  if (!name) return alert("Escribe un nombre de usuario");

  state.username = name;
  sessionStorage.setItem("username", name);
  router.push({ name: "room", params: { roomName } });
}
</script>

<template>
  <main class="lobby">
    <h1>PaintRooms</h1>

    <input v-model="username" placeholder="Tu nombre" maxlength="20" />

    <h2>Salas</h2>
    <ul>
      <li v-for="room in rooms" :key="room.name">
        <button @click="enter(room.name)">
          {{ room.name }} ({{ room.users }} usuarios)
        </button>
      </li>
    </ul>
  </main>
</template>