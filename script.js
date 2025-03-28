// Sample in-memory messages
let messages = [
    {
      id: 1,
      sender: "bot",
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
  
  // Avatars (place these images in your extension folder, or use any URL)
  const BOT_AVATAR_URL = chrome.runtime.getURL("botAvatar.png");
  const USER_AVATAR_URL = chrome.runtime.getURL("userAvatar.png");
  
  // Sound for incoming messages
  const messageSound = new Audio(chrome.runtime.getURL("message-received.mp3"));
  
  // Global variable to track minimized state
  let isMinimized = false;
  
  /**
   * 1) Load minimized state from chrome.storage.local on startup
   */
  chrome.storage.local.get("chatMinimized", (result) => {
    if (result.chatMinimized !== undefined) {
      isMinimized = result.chatMinimized;
      if (isMinimized) {
        chatAppEl.classList.add("minimized");
      }
    }
  });
  
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
      if (msg.sender === "bot") {
        messageRow.classList.add("bot-row");
      } else {
        messageRow.classList.add("user-row");
      }
  
      // Create avatar element
      const avatarImg = document.createElement("img");
      avatarImg.classList.add("avatar");
      if (msg.sender === "bot") {
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
  
    // Use requestAnimationFrame to wait for layout
   // Use requestAnimationFrame to wait for layout
  requestAnimationFrame(() => {
    if (lastMessageEl) {
      lastMessageEl.scrollIntoView({ block: "end", behavior: "instant" });
    }
  });
  }
  
  /**
   * Handle sending a user message + simulate a bot reply
   */
  function handleSend() {
    const userText = chatInputEl.value.trim();
    if (!userText) return;
  
    // Add user message
    messages.push({
      id: Date.now(),
      sender: "user",
      text: userText,
    });
    saveMessages(); // Save to localStorage
  
    chatInputEl.value = "";
    renderMessages();
  
    // Play sound for user message
    messageSound.play().catch((e) => console.warn("Sound play error:", e));
  
    // Simulate a bot response
    setTimeout(() => {
      const botReply = {
        id: Date.now(),
        sender: "bot",
        text: `You said: "${userText}". This is a simulated AI response.`,
      };
      messages.push(botReply);
      saveMessages(); // Save again
  
      renderMessages();
      messageSound.play().catch((e) => console.warn("Sound play error:", e));
    }, 800);
  }

  function handleClearChat() {
    // Empty the array
    messages = [];
    // Save to localStorage (so it stays empty after refresh)
    saveMessages();
    // Re-render
    renderMessages();
  }
  
  /**
   * Minimize the chat
   */
  function handleMinimize() {
    isMinimized = true;
    chatAppEl.classList.add("minimized");
    chrome.storage.local.set({ chatMinimized: true });
  }
  
  /**
   * Expand the chat
   */
  function handleExpand() {
    isMinimized = false;
    chatAppEl.classList.remove("minimized");
    chrome.storage.local.set({ chatMinimized: false });
  }
  
  /**
   * Close the chat
   */
  function handleClose() {
    chatAppEl.style.display = "none";
  }

// Dropdown actions
minimizeBtnEl.addEventListener("click", handleMinimize);
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
  