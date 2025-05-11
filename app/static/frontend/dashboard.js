let sent = {};
let socket = null;

// Подключение к WebSocket
function connectSocket() {
  console.log("📡 WebSocket dashboard.js loaded");

  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ Connected to server via /ws/client");
  };

  socket.onmessage = (event) => {
    console.log("📩 From server:", event.data);
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  socket.onclose = () => {
    console.warn("🔌 WebSocket closed");
    // Повторное подключение через 2 секунды
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

// Отправка команды через WebSocket
async function sendCommand(command) {
  if (sent[command]) return;
  sent[command] = true;

  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "command",
        data: command
      }));
      console.log(`📤 Sent via WS: ${command}`);
    } else {
      console.warn(`⚠️ WebSocket not ready. Command "${command}" not sent.`);
    }
  } catch (err) {
    console.error(`❌ ${command}:`, err);
  }

  setTimeout(() => { sent[command] = false }, 300);
}

window.addEventListener("gamepadconnected", () => {
  document.getElementById("status").textContent = "🎮 Джойстик підключено!";
  console.log("🎮 Gamepad connected:", navigator.getGamepads()[0]);
  pollGamepad();
});

function pollGamepad() {
  const gp = navigator.getGamepads()[0];
  if (!gp) return requestAnimationFrame(pollGamepad);

  const [ali, ele, rud, thr] = [
    gp.axes[0] || 0,
    gp.axes[1] || 0,
    -gp.axes[2] || 0,
    gp.axes[3] || 0
  ];

  const dotL = document.getElementById("dot-left");
  const dotR = document.getElementById("dot-right");

  dotL.style.left = `${40 + thr * 30}px`;
  dotL.style.top = `${40 + rud * 30}px`;
  dotR.style.left = `${40 + ali * 30}px`;
  dotR.style.top = `${40 + ele * 30}px`;

  const ch5 = gp.buttons[4]?.pressed ? 1 : 0;
  const ch6 = gp.buttons[5]?.pressed ? 1 : 0;
  const ch7 = gp.buttons[6]?.pressed ? 1 : 0;
  const ch8 = gp.buttons[7]?.pressed ? 1 : 0;

  document.getElementById("bar-ch5").style.width = `${ch5 * 100}%`;
  document.getElementById("bar-ch6").style.width = `${ch6 * 100}%`;
  document.getElementById("bar-ch7").style.width = `${ch7 * 100}%`;
  document.getElementById("bar-ch8").style.width = `${ch8 * 100}%`;

  const btns = gp.buttons;
  btns.forEach((btn, i) => {
    if (btn.pressed) {
      console.log(`🎮 Button ${i} pressed`);
    }
  });

  if (btns[0]?.pressed) sendCommand("ARM");
  if (btns[1]?.pressed) sendCommand("DISARM");
  if (btns[2]?.pressed) sendCommand("TAKEOFF");
  if (btns[3]?.pressed) sendCommand("LAND");

  if (ele > 0.5) sendCommand("FORWARD");
  if (ele < -0.5) sendCommand("BACKWARD");
  if (ali < -0.5) sendCommand("LEFT");
  if (ali > 0.5) sendCommand("RIGHT");

  requestAnimationFrame(pollGamepad);
}

document.addEventListener("keydown", (e) => {
  console.log(`⌨️ Key pressed: ${e.key}`);
  switch (e.key.toLowerCase()) {
    case "w": sendCommand("FORWARD"); break;
    case "s": sendCommand("BACKWARD"); break;
    case "a": sendCommand("LEFT"); break;
    case "d": sendCommand("RIGHT"); break;
    case " ": sendCommand("TAKEOFF"); break;
    case "l": sendCommand("LAND"); break;
    case "e": sendCommand("ARM"); break;
    case "q": sendCommand("DISARM"); break;
  }
});
