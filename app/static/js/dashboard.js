// app/static/js/dashboard.js
let socket = null;
let currentRC = new Array(8).fill(1500);
let lastRC = new Array(8).fill(1500);

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    const statusText = document.getElementById("status-text");
    statusText.classList.remove("text-danger");
    statusText.classList.add("text-success");
    statusText.textContent = "Connected";

    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 5000);
  };

  socket.onmessage = (event) => {
    if (event.data === "pong") return;
    console.log("📩 From server:", event.data);
  };

  socket.onerror = (e) => console.error("❌ WebSocket error:", e);
  socket.onclose = () => {
    const statusText = document.getElementById("status-text");
    statusText.classList.remove("text-success");
    statusText.classList.add("text-danger");
    statusText.textContent = "Disconnected";
    console.warn("🔌 WebSocket closed, reconnecting...");
    setTimeout(connectSocket, 2000);
  };
}
connectSocket();

function scale(v) {
  return Math.round(((v + 1) / 2) * 1000 + 1000);
}

function drawStick(canvasId, xValue, yValue) {
  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(xValue, yValue, 4, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
}

function updateSticks(ch1, ch2, ch3, ch4) {
  const xLeft = (ch4 - 1000) / 1000 * 100;
  const yLeft = (2000 - ch3) / 1000 * 100;
  drawStick("dot-left", xLeft, yLeft);

  const xRight = (ch1 - 1000) / 1000 * 100;
  const yRight = (2000 - ch2) / 1000 * 100;
  drawStick("dot-right", xRight, yRight);
}

window.addEventListener("gamepadconnected", () => {
  console.log("🎮 Gamepad connected");
  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const ail = gp.axes[0] || 0; // CH1 Roll
    const ele = gp.axes[1] || 0; // CH2 Pitch (inverted)
    const thr = gp.axes[3] || 0; // CH3 Throttle
    const rud = gp.axes[2] || 0; // CH4 Yaw (inverted)

    const ch1 = scale(ail);
    const ch2 = scale(-ele);
    const ch3 = scale(thr);
    const ch4 = scale(-rud);

    const ch5 = gp.buttons[4]?.pressed ? 2000 : 1000;
    const ch6 = gp.buttons[5]?.pressed ? 2000 : 1000;
    const ch7 = gp.buttons[6]?.pressed ? 2000 : 1000;
    const ch8 = gp.buttons[7]?.pressed ? 2000 : 1000;

    currentRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];
    updateSticks(ch1, ch2, ch3, ch4);

    document.getElementById("ch5-8").textContent = `${ch5} / ${ch6} / ${ch7} / ${ch8}`;

    if (JSON.stringify(currentRC) !== JSON.stringify(lastRC)) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "rc", channels: currentRC }));
      }
      lastRC = [...currentRC];
    }
  }, 100);
});

// Stream control buttons
const startBtn = document.getElementById("startStream");
const stopBtn = document.getElementById("stopStream");

startBtn?.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "start" }));
    console.log("▶️ Stream start sent");
  }
});

stopBtn?.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "stop" }));
    console.log("⏹️ Stream stop sent");
  }
});
