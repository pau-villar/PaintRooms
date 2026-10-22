<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { socket } from "../socket";
import { state } from "../state";

const canvas = ref(null);
const color = ref("#000000");
const width = ref(4);

let ctx = null;
let drawing = false;
let last = null;

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  socket.on("draw", drawSegment);
  socket.on("clear_canvas", clearLocal);
});

onUnmounted(() => {
  socket.off("draw", drawSegment);
  socket.off("clear_canvas", clearLocal);
});

// Cuando llegan los segmentos iniciales del servidor, repintamos todo
watch(
  () => state.strokes,
  (segments) => {
    clearLocal();
    segments.forEach(drawSegment);
  }
);

// ---- Utilidades ----
function getPoint(e) {
  const rect = canvas.value.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height,
  };
}

function drawSegment({ from, to, color, width }) {
  const w = canvas.value.width;
  const h = canvas.value.height;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x * w, from.y * h);
  ctx.lineTo(to.x * w, to.y * h);
  ctx.stroke();
}

function clearLocal() {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
}

// ---- Eventos del ratón ----
function onPointerDown(e) {
  drawing = true;
  canvas.value.setPointerCapture(e.pointerId);
  last = getPoint(e);
}

function onPointerMove(e) {
  const point = getPoint(e);
  socket.emit("cursor_move", point);

  if (!drawing) return;
  const segment = { from: last, to: point, color: color.value, width: width.value };
  drawSegment(segment);
  socket.emit("draw", segment);
  last = point;
}

function onPointerUp() {
  drawing = false;
}

// ---- Botón Limpiar ----
function clearCanvas() {
  socket.emit("clear_canvas");
}
</script>

<template>
  <div class="board">
    <div class="toolbar">
      <label>Color <input type="color" v-model="color" /></label>
      <label>
        Grosor {{ width }}
        <input type="range" min="1" max="30" v-model.number="width" />
      </label>
      <button @click="clearCanvas">Limpiar</button>
    </div>

    <div class="canvas-wrap">
      <canvas
        ref="canvas"
        width="700"
        height="420"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      ></canvas>

      <div
        v-for="(c, id) in state.cursors"
        :key="id"
        class="cursor"
        :style="{ left: c.x * 100 + '%', top: c.y * 100 + '%' }"
      >
        <span class="cursor-dot" :style="{ background: c.color }"></span>
        <span class="cursor-name" :style="{ background: c.color }">{{ c.username }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}
.canvas-wrap {
  position: relative;
  max-width: 700px;
}
canvas {
  width: 100%;
  max-width: 700px;
  aspect-ratio: 700 / 420;
  background: #fff;
  border: 1px solid #ccc;
  touch-action: none;
  cursor: crosshair;
  display: block;
}
.cursor {
  position: absolute;
  pointer-events: none;
}
.cursor-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.cursor-name {
  position: absolute;
  top: 6px;
  left: 6px;
  color: white;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>