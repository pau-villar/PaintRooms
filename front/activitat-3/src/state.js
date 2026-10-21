import { reactive } from "vue";

export const state = reactive({
  username: sessionStorage.getItem("username") || "",
  me: null,      // mi usuario { username, color }
  users: [],     // usuarios de la sala
  strokes: [],   // trazos iniciales (los usaremos más adelante)
});