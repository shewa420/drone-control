
let sent = {};

async function sendCommand(command) {
  if (sent[command]) return;
  sent[command] = true;

  try {
    const res = await fetch('/api/drone/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const data = await res.json();
    console.log(`✅ ${command}:`, data.message || data.detail || "OK");
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
    gp.axes[0] || 0,           // CH1 - Roll (AIL)
    -gp.axes[1] || 0,          // CH2 - Pitch (ELE), інвертований
    gp.axes[2] || 0,           // CH4 - Yaw (RUD)
    -gp.axes[3] || 0           // CH3 - Throttle (THR), інвертований
  ];

  const dotL = document.getElementById("dot-left");
  const dotR = document.getElementById("dot-right");

  // 🛠️ Заменили местами RUD и THR (ось X теперь THR, ось Y — RUD)
  dotL.style.left = `${40 + thr * 30}px`;
  dotL.style.top = `${40 + rud * 30}px`;

  dotR.style.left = `${40 + ali * 30}px`;
  dotR.style.top = `${40 + ele * 30}px`;

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
