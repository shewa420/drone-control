let socket = null;
let currentRC = new Array(8).fill(1500);
let lastRC = new Array(8).fill(1500);

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    const statusText = document.getElementById("status-text");
    if (statusText) {
      statusText.classList.remove("text-danger");
      statusText.classList.add("text-success");
      statusText.textContent = "Connected";
    }
  };

  socket.onclose = () => {
    const statusText = document.getElementById("status-text");
    if (statusText) {
      statusText.classList.remove("text-success");
      statusText.classList.add("text-danger");
      statusText.textContent = "Disconnected";
    }
    console.warn("🔌 WebSocket closed, reconnecting...");
    setTimeout(connectSocket, 2000);
  };

  socket.onerror = (e) => console.error("❌ WebSocket error:", e);
  socket.onmessage = (event) => {
    if (event.data !== "pong") {
      console.log("📩 From server:", event.data);
    }
  };
}
connectSocket();

function scale(value) {
  return Math.round(((value + 1) / 2) * 1000 + 1000);
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
  const xLeft = ((ch4 - 1000) / 1000) * 100;
  const yLeft = ((2000 - ch3) / 1000) * 100;
  drawStick("dot-left", xLeft, yLeft);

  const xRight = ((ch1 - 1000) / 1000) * 100;
  const yRight = ((2000 - ch2) / 1000) * 100;
  drawStick("dot-right", xRight, yRight);
}

function updateAux(ch5, ch6, ch7, ch8) {
  const auxDisplay = document.getElementById("ch5-8");
  if (auxDisplay) {
    auxDisplay.textContent = `${ch5} / ${ch6} / ${ch7} / ${ch8}`;
  }
}

window.addEventListener("gamepadconnected", () => {
  console.log("🎮 Gamepad підключено");

  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const ch1 = scale(gp.axes[0] || 0);    // Roll
    const ch2 = scale(-(gp.axes[1] || 0)); // Pitch
    const ch3 = scale(gp.axes[3] || 0);    // Throttle
    const ch4 = scale(-(gp.axes[2] || 0)); // Yaw

    const ch5 = gp.buttons[4]?.pressed ? 2000 : 1000;
    const ch6 = gp.buttons[5]?.pressed ? 2000 : 1000;
    const ch7 = gp.buttons[6]?.pressed ? 2000 : 1000;
    const ch8 = gp.buttons[7]?.pressed ? 2000 : 1000;

    currentRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];
    updateSticks(ch1, ch2, ch3, ch4);
    updateAux(ch5, ch6, ch7, ch8);

    if (JSON.stringify(currentRC) !== JSON.stringify(lastRC)) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "rc", channels: currentRC }));
      }
      lastRC = [...currentRC];
    }
  }, 100);
});

// Управление трансляцией
document.getElementById("startStream")?.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "start" }));
    console.log("▶️ Stream start sent");
  }
});

document.getElementById("stopStream")?.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "stop" }));
    console.log("⏹️ Stream stop sent");
  }
});
