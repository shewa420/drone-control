let socket = null;
let currentRC = new Array(8).fill(1500);
let lastSentRC = new Array(8).fill(1500);
let lastSwitchState = [1000, 1000, 1000, 1000]; // CH5–CH8

function connectSocket() {
  socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");

    // heartbeat каждые 5 секунд
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

  // отладка буфера WebSocket
  setInterval(() => {
    if (socket) {
      console.log("🔁 WS bufferedAmount:", socket.bufferedAmount);
    }
  }, 1000);

  setInterval(() => {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    const [ail, ele, thr, rud] = [
      gp.axes[0] || 0,
      -(gp.axes[1] || 0),  // Invert ELE
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

    if (JSON.stringify(sticks) !== JSON.stringify(lastSentRC.slice(0, 4))) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "rc",
          channels: currentRC
        }));
        lastSentRC = [...currentRC];
      }
    }

    // только если переключатели изменились
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
    document.getElementById("dot-left").style.left = `${40 + thr * 30}px`;
    document.getElementById("dot-left").style.top = `${40 + rud * 30}px`;
    document.getElementById("dot-right").style.left = `${40 + ail * 30}px`;
    document.getElementById("dot-right").style.top = `${40 + ele * 30}px`;

    document.getElementById("bar-ch5").style.width = `${ch5 / 20}%`;
    document.getElementById("bar-ch6").style.width = `${ch6 / 20}%`;
    document.getElementById("bar-ch7").style.width = `${ch7 / 20}%`;
    document.getElementById("bar-ch8").style.width = `${ch8 / 20}%`;
  }, 100); // 10 Гц
});
