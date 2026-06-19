const socket = io();

const map = L.map("map").setView([0, 0], 2);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

const markers = {};
const users = {};

// --- Custom Icons ---
function createSelfIcon() {
    return L.divIcon({
        className: '',
        html: `<div class="pulse-icon"><div class="pulse-dot"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function createSelfIcon() {
    return L.divIcon({
        className: '',
        html: `<div class="pulse-icon"><div class="pulse-dot"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function createOtherIcon() {
    return L.divIcon({
        className: '',
        html: `<div class="other-dot"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}

// --- Panel UI ---
function updatePanel() {
    const list = document.getElementById("user-list");
    const count = document.getElementById("user-count");
    count.textContent = Object.keys(users).length;

    list.innerHTML = "";

    // Show "me" first
    Object.entries(users).forEach(([id, data]) => {
        const isMe = id === socket.id;
        const item = document.createElement("div");
        item.className = "user-item";
        item.innerHTML = `
            <div class="user-label ${isMe ? 'me' : 'other'}">
                ${isMe ? '⬤ You' : '⬤ User ' + id.slice(0, 5)}
            </div>
            <div class="user-coords">
                ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}
            </div>
        `;
        if (isMe) list.prepend(item);
        else list.appendChild(item);
    });
}

socket.on("connect", () => {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                socket.emit("send-location", { latitude, longitude });
            },
            (error) => {
                console.error("Geolocation error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
});

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    users[id] = { latitude, longitude };

    if (id === socket.id) {
        map.setView([latitude, longitude], 16);
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        const icon = id === socket.id ? createSelfIcon() : createOtherIcon();
        markers[id] = L.marker([latitude, longitude], { icon })
            .addTo(map)
            .bindPopup(id === socket.id ? "You" : "User " + id.slice(0, 5));
    }

    updatePanel();
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    delete users[id];
    updatePanel();
});