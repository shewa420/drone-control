let socket = null;
let currentRC = new Array(8).fill(1500);
let gamepadIndex = null;

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WS connected");
    const wsStatus = document.getElementById("ws-status");
    if (wsStatus) {
      wsStatus.textContent = "З'єднано";
      wsStatus.style.color = "green";
    }
  };

  socket.onerror = (e) => console.error("❌ WS error:", e);

  socket.onclose = () => {
    console.warn("🔌 WS closed");
    const wsStatus = document.getElementById("ws-status");
    if (wsStatus) {
      wsStatus.textContent = "Відключено";
      wsStatus.style.color = "red";
    }
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

function scaleAxis(value) {
  return Math.round(((value + 1) / 2) * 1000 + 1000);
}

function getRCValues(gp) {
  const [ail, ele, thr, rud] = [
    gp.axes[0] || 0,
    -(gp.axes[1] || 0),
    gp.axes[3] || 0,
    -(gp.axes[2] || 0)
  ];

  let ch1 = scaleAxis(ail);
  let ch2 = scaleAxis(ele);
  let ch3 = scaleAxis(thr);
  let ch4 = scaleAxis(rud);

  // 🎚 Інверсія тротла
  ch2 = 3000 - ch2;
  ch4 = 3000 - ch4;

  const ch5 = scaleAxis(gp.axes[4] ?? -1);
  const ch6 = scaleAxis(gp.axes[5] ?? -1);
  const ch7 = scaleAxis(gp.axes[6] ?? -1);
  const ch8 = scaleAxis(gp.axes[7] ?? -1);

  return [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];
}

function updateGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;

  if (gamepadIndex !== null && gamepads[gamepadIndex]) {
    gp = gamepads[gamepadIndex];
  } else {
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        gp = gamepads[i];
        gamepadIndex = i;
        console.log("🎮 Геймпад знайдено в слоті", i);
        const status = document.getElementById("status");
        if (status) status.textContent = "🎮 Джойстик підключено!";
        break;
      }
    }
  }

  if (!gp) return;

  const rc = getRCValues(gp);
  currentRC = rc;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "rc",
      channels: rc
    }));
  }

  // 🎛 GUI оновлення
  document.getElementById("dot-left").style.left = `${33 + gp.axes[3] * 20}px`;
  document.getElementById("dot-left").style.top = `${33 - gp.axes[2] * 20}px`;
  document.getElementById("dot-right").style.left = `${33 + gp.axes[0] * 20}px`;
  document.getElementById("dot-right").style.top = `${33 - gp.axes[1] * 20}px`;

  document.getElementById("bar-ch5").textContent = rc[4];
  document.getElementById("bar-ch6").textContent = rc[5];
  document.getElementById("bar-ch7").textContent = rc[6];
  document.getElementById("bar-ch8").textContent = rc[7];
}

setInterval(updateGamepad, 20);  // 🔁 Частота 50 Гц
