let socket = null;
let currentRC = new Array(8).fill(1500);
let lastSwitchState = [1000, 1000, 1000, 1000];

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => console.log("✅ WS connected");
  socket.onerror = (e) => console.error("❌ WS error:", e);
  socket.onclose = () => {
    console.warn("🔌 WS closed");
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

function scale(v) {
  return Math.round(((v + 1) / 2) * 1000 + 1000);
}

window.addEventListener("gamepadconnected", () => {
  document.getElementById("status").textContent = "🎮 Джойстик підключено!";
  console.log("🎮 Gamepad connected");

  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

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

    currentRC = [ch1, ch2, 3000 - ch3, ch4, ch5, ch6, ch7, ch8];

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "rc",
        channels: currentRC
      }));
      console.log("📤 Sent RC:", currentRC);
    }

    // GUI оновлення
    document.getElementById("dot-left").style.left = `${40 + thr * 30}px`;
    document.getElementById("dot-left").style.top = `${40 + rud * 30}px`;
    document.getElementById("dot-right").style.left = `${40 + ail * 30}px`;
    document.getElementById("dot-right").style.top = `${40 + ele * 30}px`;

    document.getElementById("bar-ch5").textContent = ch5;
    document.getElementById("bar-ch6").textContent = ch6;
    document.getElementById("bar-ch7").textContent = ch7;
    document.getElementById("bar-ch8").textContent = ch8;
  }, 50); // 20 Гц
});