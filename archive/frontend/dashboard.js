let socket = null;
let currentRC = new Array(8).fill(1500);
let lastRC = new Array(8).fill(1500);

// Підключення WebSocket
function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    document.getElementById("conn-status").textContent = "З'єднано";

    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 5000);
  };

  socket.onmessage = (event) => {
    if (event.data === "pong") {
      console.log("🏓 pong received");
    } else {
      console.log("📩 From server:", event.data);
    }
  };

  socket.onerror = (e) => console.error("❌ WebSocket error:", e);
  socket.onclose = () => {
    console.warn("🔌 WebSocket closed");
    document.getElementById("conn-status").textContent = "Відключено";
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

// Масштабування стиків: -1..1 → 1000..2000
function scale(v) {
  return Math.round(((v + 1) / 2) * 1000 + 1000);
}

// Підключення джойстика
window.addEventListener("gamepadconnected", () => {
  document.getElementById("status").textContent = "🎮 Джойстик підключено!";
  console.log("🎮 Gamepad connected");

  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const ch1 = scale(gp.axes[0]);        // Roll
    const ch2 = scale(-gp.axes[1]);       // Pitch (інверсія)
    const ch3 = scale(gp.axes[3]);        // Throttle
    const ch4 = scale(-gp.axes[2]);       // Yaw (інверсія)

    const ch5 = gp.buttons[4]?.pressed ? 2000 : 1000;
    const ch6 = gp.buttons[5]?.pressed ? 2000 : 1000;
    const ch7 = gp.buttons[6]?.pressed ? 2000 : 1000;
    const ch8 = gp.buttons[7]?.pressed ? 2000 : 1000;

    const newRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

    // Надсилаємо лише при зміні
    if (JSON.stringify(newRC) !== JSON.stringify(lastRC)) {
      currentRC = [...newRC];
      lastRC = [...newRC];

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "rc", channels: currentRC }));
        console.log("📤 Sent RC:", currentRC);
      }

      updateSticks(currentRC);
      updateAux(currentRC.slice(4));
    }
  }, 100);
});

// Малювання стиків на канвасі
function updateSticks(ch) {
  drawStick("stick-left", ch[2], ch[3]);   // Throttle / Yaw
  drawStick("stick-right", ch[0], ch[1]);  // Roll / Pitch
}

function drawStick(canvasId, x, y) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = (x - 1000) / 1000 * 75 + 75;
  const cy = (y - 1000) / 1000 * 75 + 75;

  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "blue";
  ctx.fill();
}

// Вивід CH5–CH8
function updateAux(aux) {
  document.getElementById("aux-values").textContent =
    aux.map((v, i) => `CH${i + 5}: ${v}`).join(" | ");
}

// Кнопки трансляції
function sendStartStream() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "start_stream" }));
    console.log("🎥 Start stream sent");
  }
}

function sendStopStream() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stop_stream" }));
    console.log("🛑 Stop stream sent");
  }
}
