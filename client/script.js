/* =========================
   GLOBAL STATE
========================= */

let socket = null;
let currentAudio = null;
let typingSpeed = 100;

let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChatId = localStorage.getItem("currentChatId") || null;

/* =========================
   INITIAL LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {

    document.body.className = localStorage.getItem("theme") || "dark";

    if (!currentChatId || !chats[currentChatId]) {
        createNewChat();
    }

    renderChatList();
    loadCurrentChat();
});

/* =========================
   CHAT SESSION MANAGEMENT
========================= */

function createNewChat() {
    const id = "chat_" + Date.now();

    chats[id] = {
        title: "New Chat",
        messages: []
    };

    currentChatId = id;
    saveChats();
    renderChatList();
    loadCurrentChat();
}

function switchChat(id) {
    currentChatId = id;
    saveChats();
    renderChatList();
    loadCurrentChat();
}

function deleteChat(id) {
    delete chats[id];

    const remaining = Object.keys(chats);

    if (remaining.length === 0) {
        createNewChat();
        return;
    }

    if (currentChatId === id) {
        currentChatId = remaining[0];
    }

    saveChats();
    renderChatList();
    loadCurrentChat();
}

function renameChat(id) {
    const newName = prompt("Rename chat:", chats[id].title);
    if (newName && newName.trim() !== "") {
        chats[id].title = newName.trim();
        saveChats();
        renderChatList();
    }
}

function renderChatList() {
    const list = document.getElementById("chat-list");
    list.innerHTML = "";

    Object.keys(chats).forEach(id => {

        const chat = chats[id];

        const item = document.createElement("div");
        item.className = "chat-item" + (id === currentChatId ? " active" : "");

        const title = document.createElement("div");
        title.className = "chat-title";
        title.innerText = chat.title;
        title.ondblclick = () => renameChat(id);

        const deleteBtn = document.createElement("div");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerText = "🗑";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(id);
        };

        item.onclick = () => switchChat(id);

        item.appendChild(title);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    });
}

function loadCurrentChat() {
    const container = document.getElementById("chat-container");
    container.innerHTML = "";

    chats[currentChatId].messages.forEach(msg => {
        addMessageInstant(msg.sender, msg.text, msg.type, false);
    });
}

function clearCurrentChat() {
    chats[currentChatId].messages = [];
    chats[currentChatId].title = "New Chat";
    saveChats();
    renderChatList();
    loadCurrentChat();
}

function saveChats() {
    localStorage.setItem("chats", JSON.stringify(chats));
    localStorage.setItem("currentChatId", currentChatId);
}

/* =========================
   START CONVERSATION (MIC FIXED)
========================= */

function startConversation() {

    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Already connected");
        return;
    }

    socket = new WebSocket("ws://127.0.0.1:8765");

    socket.onopen = () => {
        updateStatus("Connected");
        setupAudioStreaming(); // 🔥 triggers mic popup
    };

    socket.onclose = () => {
        updateStatus("Disconnected");
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data);

        if (data.type === "transcript") {
            stopCurrentAudio();
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

/* =========================
   AUDIO STREAMING
========================= */

async function setupAudioStreaming() {

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = function (e) {
            const input = e.inputBuffer.getChannelData(0);

            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(convertFloat32ToInt16(input));
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

    } catch (err) {
        console.error("Mic permission error:", err);
        alert("Please allow microphone access.");
    }
}

function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf.buffer;
}

/* =========================
   MESSAGE RENDERING
========================= */

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

/* =========================
   AUDIO PLAYBACK
========================= */

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

/* =========================
   THEME + STATUS
========================= */

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