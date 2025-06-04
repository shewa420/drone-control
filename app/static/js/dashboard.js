
let socket = null;
let currentRC = new Array(8).fill(1500);
let lastSentRC = new Array(8).fill(1500);
let lastSwitchState = [1000, 1000, 1000, 1000];
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

  // RC sticks
  const [ail, ele, thr, rud] = [
    gp.axes[0] || 0,
    -(gp.axes[1] || 0),
    gp.axes[3] || 0,
    -(gp.axes[2] || 0)
  ];

  const ch1 = scaleAxis(ail);
  const ch2 = scaleAxis(ele);
  const ch3 = scaleAxis(thr);
  const ch4 = scaleAxis(rud);

  // CH5–CH8 from AXIS 4–6 + fallback
  const ch5 = scaleAxis(gp.axes[4] ?? -1);  // ось у центрі ≈ 1500
  const ch6 = scaleAxis(gp.axes[5] ?? -1);
  const ch7 = scaleAxis(gp.axes[6] ?? -1);
  const ch8 = scaleAxis(gp.axes[7] ?? -1);

  const switches = [ch5, ch6, ch7, ch8];
  const sticks = [ch1, ch2, ch3, ch4];

  currentRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

  if (JSON.stringify(sticks) !== JSON.stringify(lastSentRC.slice(0, 4))) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "rc",
        channels: currentRC
      }));
      lastSentRC = [...currentRC];
    }
  }

  switches.forEach((val, i) => {
    if (val !== lastSwitchState[i]) {
      currentRC[4 + i] = val;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "rc",
          channels: [...currentRC]
        }));
      }
      lastSwitchState[i] = val;
    }
  });

  // GUI
  document.getElementById("dot-left").style.left = `${33 + thr * 20}px`;
  document.getElementById("dot-left").style.top = `${33 + rud * 20}px`;
  document.getElementById("dot-right").style.left = `${33 + ail * 20}px`;
  document.getElementById("dot-right").style.top = `${33 + ele * 20}px`;

  document.getElementById("bar-ch5").textContent = ch5;
  document.getElementById("bar-ch6").textContent = ch6;
  document.getElementById("bar-ch7").textContent = ch7;
  document.getElementById("bar-ch8").textContent = ch8;
}

setInterval(updateGamepad, 100);
