let socket = null;
let lastRC = new Array(8).fill(1500);

// 🎮 Масштабування значення: -1..1 → 1000..2000
function scale(value) {
    return Math.round(((value + 1) / 2) * 1000 + 1000);
}

function connectSocket() {
    socket = new WebSocket("wss://lte-drone-control.onrender.com/ws/client");

    socket.onopen = () => {
        console.log("✅ WebSocket підключено");
        document.getElementById("status-text").textContent = "З'єднано";
        document.getElementById("status-text").classList.replace("text-danger", "text-success");
    };

    socket.onmessage = (event) => {
        console.log("[📩] Отримано від сервера:", event.data);
    };

    socket.onclose = () => {
        console.warn("🔌 WebSocket відключено. Повторне підключення через 2с...");
        document.getElementById("status-text").textContent = "Немає з’єднання";
        document.getElementById("status-text").classList.replace("text-success", "text-danger");
        setTimeout(connectSocket, 2000);
    };
}

connectSocket();

// 📤 Відправка трансляції
function sendStartStream() {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "start_stream" }));
        console.log("🎥 Команда старт трансляції надіслана");
    }
}

function sendStopStream() {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stop_stream" }));
        console.log("🛑 Команда зупинки трансляції надіслана");
    }
}

// 🎮 Обробка Gamepad
window.addEventListener("gamepadconnected", () => {
    console.log("🎮 Gamepad підключено");

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

        const rc = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

        // Лише при зміні
        if (JSON.stringify(rc) !== JSON.stringify(lastRC)) {
            lastRC = rc;

            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "rc", channels: rc }));
            }

            updateSticks(rc);
            updateAux(rc.slice(4));
        }

    }, 100); // 10 Гц
});

// 🎯 Малювання стиків
function updateSticks(ch) {
    drawStick("stick-left", ch[2], ch[3]);   // Throttle/Yaw
    drawStick("stick-right", ch[0], ch[1]);  // Roll/Pitch
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

// 📊 Вивід CH5–CH8
function updateAux(aux) {
    document.getElementById("aux-values").textContent =
        aux.map((v, i) => `CH${i + 5}: ${v}`).join(" | ");
}
