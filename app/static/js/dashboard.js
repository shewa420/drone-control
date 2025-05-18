const statusText = document.getElementById("status-text");
const rcDisplay = document.getElementById("rc-display");

let ws = new WebSocket("wss://lte-drone-control.onrender.com/ws/pi");

ws.onopen = () => {
    statusText.innerText = "З'єднано";
    statusText.classList.remove("text-danger");
    statusText.classList.add("text-success");
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "rc" && Array.isArray(data.channels)) {
        rcDisplay.innerHTML = data.channels.map((val, i) =>
            `<div>CH${i + 1}: <span class="fw-semibold">${val}</span></div>`
        ).join("");
    }
};

ws.onclose = () => {
    statusText.innerText = "Немає з’єднання";
    statusText.classList.remove("text-success");
    statusText.classList.add("text-danger");
};
