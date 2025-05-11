let socket = null;
let currentRC = new Array(8).fill(1500);
let lastSentRC = new Array(8).fill(1500);

function connectSocket() {
  console.log("📡 WebSocket RC client loaded");

  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ Connected to server via /ws/client");
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };

  socket.onclose = () => {
    console.warn("🔌 WebSocket closed");
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

function scale(value) {
  return Math.round(((value + 1) / 2) * 1000 + 1000);
}

window.addEventListener("gamepadconnected", () => {
  document.getElementById("status").textContent = "🎮 Джойстик підключено!";
  console.log("🎮 Gamepad connected:", navigator.getGamepads()[0]);

  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const [ail, ele, thr, rud] = [
      gp.axes[0] || 0,
      gp.axes[1] || 0,
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

    currentRC = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

    // отправляем только если значения изменились
    if (JSON.stringify(currentRC) !== JSON.stringify(lastSentRC)) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "rc",
          channels: currentRC
        }));
        lastSentRC = [...currentRC];
      }
    }

    // Обновление графики
    document.getElementById("dot-left").style.left = `${40 + thr * 30}px`;
    document.getElementById("dot-left").style.top = `${40 + rud * 30}px`;
    document.getElementById("dot-right").style.left = `${40 + ail * 30}px`;
    document.getElementById("dot-right").style.top = `${40 + ele * 30}px`;

    document.getElementById("bar-ch5").style.width = `${ch5 / 20}%`;
    document.getElementById("bar-ch6").style.width = `${ch6 / 20}%`;
    document.getElementById("bar-ch7").style.width = `${ch7 / 20}%`;
    document.getElementById("bar-ch8").style.width = `${ch8 / 20}%`;
  }, 50); // 20 Гц
});
