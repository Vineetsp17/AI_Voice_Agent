/* ========================
   PRODUCTION CONFIG
======================== */

const BACKEND_URL =
    window.location.hostname === "localhost"
        ? "ws://localhost:8000/ws"
        : "wss://ai-voice-agent-u1mp.onrender.com/ws";

let socket = null;
let currentAudio = null;
let typingSpeed = 100;

let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = localStorage.getItem("currentChatId") || null;

/* ========================
   INIT
======================== */

document.addEventListener("DOMContentLoaded", () => {

    document.body.className = localStorage.getItem("theme") || "dark";

    if (!currentChatId || !chats[currentChatId]) {
        createNewChat();
    }

    renderChatList();
    loadCurrentChat();
});

/* ========================
   START CONVERSATION
======================== */

function startConversation() {

    if (socket && socket.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(BACKEND_URL);

    socket.onopen = () => {
        updateStatus("Connected");
        setupAudioRecording();
    };

    socket.onclose = () => {
        updateStatus("Disconnected");
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data);

        if (data.type === "transcript") {
            addMessageInstant("You", data.text, "user");
        }

        if (data.type === "bot_response") {
            addMessageTypewriter("Bot", data.text);
        }

        if (data.type === "tts_audio") {
            playAudio(data.audio);
        }
    };
}

/* ========================
   AUDIO RECORDING (MediaRecorder)
======================== */

async function setupAudioRecording() {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = async (event) => {

        if (event.data.size > 0) {
            const arrayBuffer = await event.data.arrayBuffer();
            socket.send(arrayBuffer);
        }
    };

    mediaRecorder.start(2000); // send every 2 sec
}

/* ========================
   MESSAGE RENDERING
======================== */

function addMessageInstant(sender, text, type, save = true) {

    const container = document.getElementById("chat-container");

    const msg = document.createElement("div");
    msg.className = `message ${type}`;
    msg.innerHTML = `<strong>${sender}:</strong> ${marked.parseInline(text)}`;

    container.appendChild(msg);
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

    if (save) {
        chats[currentChatId].messages.push({ sender, text, type });

        if (type === "user" && chats[currentChatId].title === "New Chat") {
            chats[currentChatId].title =
                text.slice(0, 30) + (text.length > 30 ? "..." : "");
        }

        saveChats();
        renderChatList();
    }
}

function addMessageTypewriter(sender, text) {

    const container = document.getElementById("chat-container");

    const msg = document.createElement("div");
    msg.className = "message bot";
    msg.innerHTML =
        `<strong>${sender}:</strong> 
         <span class="content"></span>
         <span class="cursor"></span>`;

    container.appendChild(msg);

    const content = msg.querySelector(".content");
    const cursor = msg.querySelector(".cursor");

    const words = text.split(" ");
    let index = 0;

    function typeWord() {

        if (index < words.length) {

            content.innerHTML = marked.parseInline(
                words.slice(0, index + 1).join(" ")
            );

            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth"
            });

            index++;
            setTimeout(typeWord, typingSpeed);

        } else {

            cursor.remove();

            chats[currentChatId].messages.push({
                sender,
                text,
                type: "bot"
            });

            saveChats();
        }
    }

    typeWord();
}

/* ========================
   AUDIO PLAYBACK
======================== */

function playAudio(base64Audio) {
    stopCurrentAudio();
    currentAudio = new Audio("data:audio/wav;base64," + base64Audio);
    currentAudio.play();
}

function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

/* ========================
   UTIL
======================== */

function toggleTheme() {
    if (document.body.className === "dark") {
        document.body.className = "light";
        localStorage.setItem("theme", "light");
    } else {
        document.body.className = "dark";
        localStorage.setItem("theme", "dark");
    }
}

function updateStatus(text) {
    document.getElementById("status").innerText = "● " + text;
}



