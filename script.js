// Sample in-memory messages
let messages = [
    {
      id: 1,
      sender: "assistant",
      text: "Hello! I'm your AI assistant. How can I help you today?",
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
  const USER_AVATAR_URL = chrome.runtime.getURL("userAvatar.png");
  
  // Sound for incoming messages
  const messageSound = new Audio(chrome.runtime.getURL("message-received.mp3"));
  
  /**
   * Render messages in the .chat-messages container
   */
  function renderMessages() {
    chatMessagesEl.innerHTML = "";

    let lastMessageEl = null;
  
    messages.forEach((msg) => {
      // Create a container for each message + avatar
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
      bubble.textContent = msg.text;
  
      if (msg.sender === "user") {
        bubble.classList.add("user-bubble");
        // user row: bubble first, avatar after
        messageRow.appendChild(bubble);
        messageRow.appendChild(avatarImg);
      } else {
        bubble.classList.add("bot-bubble");
        // bot row: avatar first, bubble after
        messageRow.appendChild(avatarImg);
        messageRow.appendChild(bubble);
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
  
  // Add the user's message to the chat messages array
  messages.push({
    id: Date.now(),
    sender: "user",
    text: userText,
  });
  saveMessages();
  renderMessages();
  
  // Clear the input field
  chatInputEl.value = "";
  
  // Optional: Play user message sound
  messageSound.play().catch((e) => console.warn("Sound play error:", e));

  // Add a temporary "Typing..." message from the bot
  const typingMessage = {
    id: Date.now(), // unique id
    sender: "assistant",
    text: "Typing...",
    temporary: true, // flag to indicate it's temporary
  };
  messages.push(typingMessage);
  renderMessages();

  // Send the query to the endpoint and await the response
  const response = await sendQuery(userText);

  messages = messages.filter(msg => !msg.temporary);

  // Create a bot message from the response.
  // We assume the response JSON has a property 'response' for the bot's reply.
  const botReply = {
    id: Date.now(),
    sender: "assistant",
    text: response.response || (response.error ? `Error: ${response.error}` : "No response received."),
  };

  messages.push(botReply);
  saveMessages();
  renderMessages();

  // Optional: Play bot message sound
  messageSound.play().catch((e) => console.warn("Sound play error:", e));
}

// Wire up the send button
sendBtnEl.addEventListener("click", handleSend);

// Also trigger handleSend when the user presses the Enter key in the input
chatInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

  function handleClearChat() {
    // Empty the array
    messages = [
      {
        id: 1,
        sender: "assistant",
        text: "Hello! I'm your AI assistant. How can I help you today?",
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
    window.parent.postMessage({ action: 'closeChatbot' }, '*');
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
  