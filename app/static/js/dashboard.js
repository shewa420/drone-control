
let socket = null;
let currentRC = new Array(8).fill(1500);
let lastSentRC = new Array(8).fill(1500);
let lastSwitchState = [1000, 1000, 1000, 1000];

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

function scale(value) {
  return Math.round(((value + 1) / 2) * 1000 + 1000);
}

function updateGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

  if (!gamepads || !gamepads[0]) return;

  const gp = gamepads[0];

  const [ail, ele, thr, rud] = [
    gp.axes[0] || 0,
    -(gp.axes[1] || 0),
    gp.axes[3] || 0,
    -(gp.axes[2] || 0)
  ];

  const ch1 = scale(ail);
  const ch2 = scale(ele);
  const ch3 = scale(thr);
  const ch4 = scale(rud);

  const ch5 = gp.buttons[4]?.pressed ? 2000 : 1000;
  const ch6 = gp.buttons[5]?.pressed ? 2000 : 1000;
  const ch7 = gp.buttons[6]?.pressed ? 2000 : 1000;
  const ch8 = gp.buttons[7]?.pressed ? 2000 : 1000;

  const switches = [ch5, ch6, ch7, ch8];
  const sticks = [ch1, ch2, ch3, ch4];

  currentRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

  // Send stick updates
  if (JSON.stringify(sticks) !== JSON.stringify(lastSentRC.slice(0, 4))) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "rc",
        channels: currentRC
      }));
      console.log("🛰️ Sent RC:", currentRC);
      lastSentRC = [...currentRC];
    }
  }

  // Send switch updates
  switches.forEach((val, i) => {
    if (val !== lastSwitchState[i]) {
      currentRC[4 + i] = val;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "rc",
          channels: [...currentRC]
        }));
        console.log("🛰️ Switch update:", currentRC);
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

window.addEventListener("gamepadconnected", () => {
  const status = document.getElementById("status");
  if (status) status.textContent = "🎮 Джойстик підключено!";
  console.log("🎮 Gamepad connected");
  setInterval(updateGamepad, 100);
});
