// ============================
// BACKEND URL (Production Safe)
// ============================

const BACKEND_URL =
    window.location.hostname === "localhost"
        ? "ws://localhost:8000/ws"
        : "wss://ai-voice-agent-u1mp.onrender.com/ws";

let socket = null;
let mediaRecorder = null;
let audioStream = null;
let isRecording = false;

const connectionIndicator = document.querySelector("#connectionStatus");
const startBtn = document.querySelector("#startBtn");
const clearBtn = document.querySelector("#clearBtn");
const chatContainer = document.querySelector("#chatContainer");

// ============================
// Connection Status UI
// ============================

function setStatus(status) {
    if (!connectionIndicator) return;
    connectionIndicator.textContent = status;

    if (status === "Connected") {
        connectionIndicator.style.color = "#00ff88";
    } else if (status === "Connecting") {
        connectionIndicator.style.color = "#ffaa00";
    } else {
        connectionIndicator.style.color = "#ff4444";
    }
}

// ============================
// Start Conversation
// ============================

async function startConversation() {
    if (isRecording) return;

    try {
        setStatus("Connecting");

        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });

        socket = new WebSocket(BACKEND_URL);

        // ✅ Only start recording AFTER socket opens
        socket.onopen = () => {
            console.log("WebSocket OPEN");
            setStatus("Connected");

            mediaRecorder = new MediaRecorder(audioStream, {
                mimeType: "audio/webm",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (
                    event.data.size > 0 &&
                    socket &&
                    socket.readyState === WebSocket.OPEN
                ) {
                    socket.send(event.data);
                }
            };

            mediaRecorder.start(250);
            isRecording = true;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.channel?.alternatives?.[0]?.transcript) {
                    const transcript =
                        data.channel.alternatives[0].transcript;

                    if (transcript.trim() !== "") {
                        addMessage("You", transcript);
                    }
                }
            } catch (err) {
                console.log("Message parse error:", err);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket CLOSED");
            stopRecording();
            setStatus("Disconnected");
        };

        socket.onerror = (error) => {
            console.error("WebSocket ERROR:", error);
            stopRecording();
            setStatus("Disconnected");
        };
    } catch (err) {
        console.error("Mic error:", err);
        setStatus("Disconnected");
    }
}

// ============================
// Stop Recording Safely
// ============================

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }

    if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }

    mediaRecorder = null;
    audioStream = null;
    socket = null;
    isRecording = false;
}

// ============================
// Chat UI
// ============================

function addMessage(sender, text) {
    if (!chatContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    const label = document.createElement("strong");
    label.textContent = sender + ": ";

    const content = document.createElement("span");
    content.innerHTML = renderMarkdown(text);

    messageDiv.appendChild(label);
    messageDiv.appendChild(content);

    chatContainer.appendChild(messageDiv);

    smoothScroll();
}

// ============================
// Markdown Support (Basic)
// ============================

function renderMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
}

// ============================
// Smooth Auto Scroll
// ============================

function smoothScroll() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
    });
}

// ============================
// Clear Chat
// ============================

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        chatContainer.innerHTML = "";
    });
}

// ============================
// Start Button
// ============================

if (startBtn) {
    startBtn.addEventListener("click", () => {
        if (!isRecording) {
            startConversation();
        } else {
            stopRecording();
            setStatus("Disconnected");
        }
    });
}
