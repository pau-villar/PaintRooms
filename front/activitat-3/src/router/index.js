import { createRouter, createWebHistory } from "vue-router";
import LobbyView from "../views/LobbyView.vue";
import RoomView from "../views/RoomView.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "lobby", component: LobbyView },
    { path: "/room/:roomName", name: "room", component: RoomView, props: true },
  ],
});