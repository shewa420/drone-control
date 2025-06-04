// app/static/js/dashboard.js
let socket = null;
let currentRC = new Array(8).fill(1500);
let lastRC = new Array(8).fill(1500);

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    document.getElementById("status-text").classList.remove("text-danger");
    document.getElementById("status-text").classList.add("text-success");
    document.getElementById("status-text").textContent = "Connected";

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
    document.getElementById("status-text").classList.remove("text-success");
    document.getElementById("status-text").classList.add("text-danger");
    document.getElementById("status-text").textContent = "Disconnected";
    console.warn("🔌 WebSocket closed, reconnecting...");
    setTimeout(connectSocket, 2000);
  };
}
connectSocket();

function scale(v) {
  return Math.round(((v + 1) / 2) * 1000 + 1000);
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

    // Update sticks
    document.getElementById("dot-left").style.left = `${(ch3 - 1000) / 100 * 3.5}px`;
    document.getElementById("dot-left").style.top = `${(ch4 - 1000) / 100 * 3.5}px`;
    document.getElementById("dot-right").style.left = `${(ch1 - 1000) / 100 * 3.5}px`;
    document.getElementById("dot-right").style.top = `${(ch2 - 1000) / 100 * 3.5}px`;

    // Display CH5–CH8
    document.getElementById("ch5-8").textContent = `${ch5} / ${ch6} / ${ch7} / ${ch8}`;

    // Always send full RC array if changed
    if (JSON.stringify(currentRC) !== JSON.stringify(lastRC)) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "rc", channels: currentRC }));
        lastRC = [...currentRC];
      }
    }
  }, 100);
});

// Stream control buttons
const startBtn = document.getElementById("startStream");
const stopBtn = document.getElementById("stopStream");

startBtn.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "start" }));
    console.log("▶️ Stream start sent");
  }
});

stopBtn.addEventListener("click", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stream", action: "stop" }));
    console.log("⏹️ Stream stop sent");
  }
});
