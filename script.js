// Sample in-memory messages
let messages = [
  {
    id: 1,
    sender: "assistant",
    text: "Hello! I'm your Oracle Cloud assistant. How can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// Grab elements
const chatAppEl = document.querySelector(".chat-app");
const chatMessagesEl = document.getElementById("chat-messages");
const chatInputEl = document.getElementById("chat-input");
const sendBtnEl = document.getElementById("send-btn");

const menuBtnEl = document.getElementById("menu-btn");
const menuDropdownEl = document.getElementById("menu-dropdown");
const minimizeBtnEl = document.getElementById("minimize-btn");
const clearBtnEl = document.getElementById("clear-btn");
const closeBtnEl = document.getElementById("close-btn");

// Avatars
const BOT_AVATAR_URL = chrome.runtime.getURL("botAvatar.png");
const USER_AVATAR_URL = chrome.runtime.getURL("userIcon.png");

/**
 * Render messages in the .chat-messages container
 */
function renderMessages() {
  chatMessagesEl.innerHTML = "";

  let lastMessageEl = null;

  messages.forEach((msg) => {
    // Create a container for each message row (for layout: avatar and card)
    const messageRow = document.createElement("div");
    messageRow.classList.add("message-row");
    if (msg.sender === "assistant") {
      messageRow.classList.add("bot-row");
    } else {
      messageRow.classList.add("user-row");
    }

    // Create avatar element
    const avatarImg = document.createElement("img");
    avatarImg.classList.add("avatar");
    if (msg.sender === "assistant") {
      avatarImg.src = BOT_AVATAR_URL;
      avatarImg.alt = "Bot Avatar";
    } else {
      avatarImg.src = USER_AVATAR_URL;
      avatarImg.alt = "User Avatar";
    }

    // Create bubble element
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (msg.typing) {
      bubble.innerHTML = `
        <div class="typing-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      `;
    } else {
      bubble.innerHTML = formatMessageText(msg.text);
    }

    // Wrap the bubble in a card-style container
    const messageCard = document.createElement("div");
    messageCard.classList.add("message-card");
    messageCard.appendChild(bubble);

    // If a timestamp exists, create and append it below the bubble
    if (msg.timestamp) {
      const timestampEl = document.createElement("div");
      timestampEl.classList.add("timestamp");
      timestampEl.textContent = msg.timestamp;
      messageCard.appendChild(timestampEl);
    }

    // Append the card and avatar in the order based on sender
    if (msg.sender === "user") {
      // User row: card first, avatar after
      messageRow.appendChild(messageCard);
      messageRow.appendChild(avatarImg);
    } else {
      // Bot row: avatar first, card after
      messageRow.appendChild(avatarImg);
      messageRow.appendChild(messageCard);
    }

    chatMessagesEl.appendChild(messageRow);
    lastMessageEl = messageRow;
  });

  requestAnimationFrame(() => {
    if (lastMessageEl) {
      lastMessageEl.scrollIntoView({ block: "end", behavior: "instant" });
    }
  });
}

// Global variable to store the conversation ID
let conversation_id = "";

// Function to send query to your endpoint
async function sendQuery(query) {
  try {
    // Build the payload
    const payload = { query: query };
    // If we already have a conversation_id, include it in the payload
    if (conversation_id) {
      payload.conversation_id = conversation_id;
    }

    const response = await fetch("https://150.230.44.54.nip.io/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();

    // Update the conversation_id if present in the response
    if (data.conversation_id) {
      conversation_id = data.conversation_id;
    }

    return data;
  } catch (error) {
    console.error("Error sending query:", error);
    return { error: error.message };
  }
}

// Updated handleSend function
async function handleSend() {
  const userText = chatInputEl.value.trim();
  if (!userText) return;

  // Add the user's message with a timestamp to the chat messages array
  messages.push({
    id: Date.now(),
    sender: "user",
    text: userText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  saveMessages();
  renderMessages();

  // Clear the input field
  chatInputEl.value = "";

  // Add a temporary typing indicator message from the bot
  const typingMessage = {
    id: Date.now(),
    sender: "assistant",
    text: "",
    temporary: true, // flag to indicate it's temporary
    typing: true,
  };
  messages.push(typingMessage);
  renderMessages();

  // Send the query to the endpoint and await the response
  const response = await sendQuery(userText);

  // Remove the temporary typing indicator
  messages = messages.filter((msg) => !msg.temporary);

  // Create a bot message from the response with a timestamp
  const botReply = {
    id: Date.now(),
    sender: "assistant",
    text: response.response || (response.error ? `Error: ${response.error}` : "No response received."),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  messages.push(botReply);
  saveMessages();
  renderMessages();
}

// Wire up the send button and input events
sendBtnEl.addEventListener("click", handleSend);
chatInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

function formatMessageText(text) {
  if (!text) return '';

  // Basic Markdown-like syntax to HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // *italic*
    .replace(/`(.*?)`/g, '<code>$1</code>');           // `code`
}

function handleClearChat() {
  // Empty the array and reset conversation_id
  messages = [
    {
      id: 1,
      sender: "assistant",
      text: "Hello! I'm your Oracle Cloud assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];
  conversation_id = "";
  // Save to localStorage (so it stays empty after refresh)
  saveMessages();
  // Re-render
  renderMessages();
}

/**
 * Close the chat
 */
function handleClose() {
  // Instead of directly hiding the chat app,
  // send a message to the parent window to trigger the "close" behavior.
  window.parent.postMessage({ action: "closeChatbot" }, "*");
}

clearBtnEl.addEventListener("click", handleClearChat);
closeBtnEl.addEventListener("click", handleClose);

sendBtnEl.addEventListener("click", handleSend);
chatInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

/**
 * Load messages from localStorage (if any).
 */
function loadMessages() {
  try {
    const stored = localStorage.getItem("chatMessages");
    if (stored) {
      // Overwrite the default messages array
      messages = JSON.parse(stored);
    }
  } catch (err) {
    console.warn("Error loading messages from localStorage:", err);
  }
}

/**
 * Save messages to localStorage
 */
function saveMessages() {
  try {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  } catch (err) {
    console.warn("Error saving messages to localStorage:", err);
  }
}

// On startup, load any previously saved messages
loadMessages();
renderMessages();

// Voice-to-text functionality
let recognition = null;
try {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    }
} catch (e) {
    console.error('Speech recognition initialization error:', e);
}

const voiceButton = document.getElementById('voice-btn');
let isRecording = false;
let microphonePermissionRequested = false;

// Function to check if microphone permission has been granted
async function checkMicrophonePermission() {
  try {
    // This will trigger the permission prompt if it hasn't been granted yet
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // If we get here, permission was granted
    // Stop all tracks to release the microphone
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error("Microphone permission check failed:", error);
    return false;
  }
}

// Try to request microphone permission when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      // First check if we're in a secure context (HTTPS or localhost)
      if (window.isSecureContext) {
        console.log("Requesting microphone permission on page load");
        const hasPermission = await checkMicrophonePermission();
        microphonePermissionRequested = true;
        console.log("Initial microphone permission:", hasPermission ? "granted" : "denied");
      } else {
        console.warn("Not in a secure context, microphone access may be restricted");
      }
    } catch (e) {
      console.error("Error during initial microphone permission request:", e);
    }
  }
});

if (voiceButton) {
    voiceButton.addEventListener('click', async () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please try Chrome.');
            return;
        }

        if (!isRecording) {
            // Request microphone permission first
            try {
                console.log("Checking microphone permission before recording");
                const hasPermission = await checkMicrophonePermission();
                
                if (!hasPermission) {
                    throw new Error("Microphone permission denied");
                }
                
                console.log("Microphone permission granted, starting recognition");
                // Start recording
                try {
                    recognition.start();
                    isRecording = true;
                    voiceButton.classList.add('recording');
                    chatInputEl.placeholder = "Listening...";
                    
                    // Add a message to show it's working
                    const message = {
                        id: Date.now(),
                        sender: "assistant",
                        text: "I'm listening... Speak now and I'll convert your voice to text.",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    };
                    messages.push(message);
                    saveMessages();
                    renderMessages();
                    
                } catch (e) {
                    console.error('Speech recognition start error:', e);
                    alert('Error starting voice recognition. Please try again.');
                    isRecording = false;
                    voiceButton.classList.remove('recording');
                }
            } catch (permissionError) {
                console.error('Microphone permission error:', permissionError);
                
                // First inform the user via a message in the chat
                const message = {
                    id: Date.now(),
                    sender: "assistant",
                    text: "To use voice input, please allow microphone access when prompted by your browser. You may need to click the camera/microphone icon in your address bar and enable permissions.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                messages.push(message);
                saveMessages();
                renderMessages();
                
                // Then try an alternative method to get permission
                try {
                    // Open a new popup window to request permission
                    const permissionWindow = window.open('about:blank', 'Microphone Permission', 'width=500,height=300');
                    if (permissionWindow) {
                        permissionWindow.document.write(`
                            <html>
                            <head>
                                <title>Microphone Access Required</title>
                                <style>
                                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                                    button { padding: 10px 20px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
                                </style>
                            </head>
                            <body>
                                <h2>Microphone Access Required</h2>
                                <p>Please click the button below to allow microphone access.</p>
                                <button id="permitBtn">Allow Microphone</button>
                                <script>
                                    document.getElementById('permitBtn').addEventListener('click', async () => {
                                        try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            stream.getTracks().forEach(track => track.stop());
                                            window.opener.postMessage({ type: 'microphonePermission', granted: true }, '*');
                                            window.close();
                                        } catch (e) {
                                            window.opener.postMessage({ type: 'microphonePermission', granted: false, error: e.message }, '*');
                                            alert('Could not get microphone permission: ' + e.message);
                                            window.close();
                                        }
                                    });
                                </script>
                            </body>
                            </html>
                        `);
                    } else {
                        alert('Popup blocked. Please allow popups for this site and try again.');
                    }
                } catch (popupError) {
                    console.error('Permission popup error:', popupError);
                    alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
                }
            }
        } else {
            // Stop recording
            try {
                recognition.stop();
                isRecording = false;
                voiceButton.classList.remove('recording');
                chatInputEl.placeholder = "Type here...";
            } catch (e) {
                console.error('Speech recognition stop error:', e);
            }
        }
    });
}

// Listen for messages from the permission popup
window.addEventListener('message', event => {
    if (event.data && event.data.type === 'microphonePermission') {
        if (event.data.granted) {
            console.log('Microphone permission granted via popup');
            // Retry voice input
            if (voiceButton) {
                setTimeout(() => voiceButton.click(), 500);
            }
        } else {
            console.error('Microphone permission denied via popup:', event.data.error);
            alert('Microphone access was denied. Voice input requires microphone access.');
        }
    }
});

if (recognition) {
    recognition.onresult = (event) => {
        console.log("Speech recognition result received:", event.results);
        const transcript = event.results[0][0].transcript;
        chatInputEl.value = transcript;
        isRecording = false;
        voiceButton.classList.remove('recording');
        chatInputEl.placeholder = "Type here...";
        
        // Remove the listening message before sending
        messages = messages.filter(msg => !msg.text.includes("I'm listening..."));
        
        // Automatically send the message after a short delay
        setTimeout(() => {
            handleSend();
        }, 500);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        voiceButton.classList.remove('recording');
        chatInputEl.placeholder = "Type here...";
        
        // Remove the listening message
        messages = messages.filter(msg => !msg.text.includes("I'm listening..."));
        saveMessages();
        renderMessages();
        
        if (event.error === 'no-speech') {
            alert('No speech was detected. Please try again.');
        } else if (event.error === 'network') {
            alert('Network error occurred. Please check your connection.');
        } else if (event.error === 'not-allowed') {
            // This error occurs when the user denies microphone permission
            console.error("Microphone access was denied or timed out");
            
            // Try to provide helpful instructions specific to the user's browser
            const isChrome = navigator.userAgent.includes('Chrome');
            const isFirefox = navigator.userAgent.includes('Firefox');
            
            let browserSpecificInstructions = "";
            
            if (isChrome) {
                browserSpecificInstructions = "In Chrome, click the lock/info icon in the address bar, then select 'Site settings' to manage microphone permissions.";
            } else if (isFirefox) {
                browserSpecificInstructions = "In Firefox, click the lock icon in the address bar, then click 'More Information' and manage microphone permissions under 'Permissions'.";
            }
            
            // Show instructions for enabling microphone access
            const message = {
                id: Date.now(),
                sender: "assistant",
                text: `To use voice input, please allow microphone access when prompted by your browser. ${browserSpecificInstructions}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            messages.push(message);
            saveMessages();
            renderMessages();
        } else {
            alert('Error occurred during voice recognition. Please try again.');
        }
    };

    recognition.onend = () => {
        isRecording = false;
        voiceButton.classList.remove('recording');
        chatInputEl.placeholder = "Type here...";
        console.log("Speech recognition ended");
    };
}
