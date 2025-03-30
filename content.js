// Create an iframe element
const chatbotIframe = document.createElement("iframe");
chatbotIframe.id = "chatbotIframe";
// Set the source to the extension's index.html file
chatbotIframe.src = chrome.runtime.getURL("index.html");

// Style the iframe to be fixed at the bottom right corner
chatbotIframe.style.position = "fixed";
chatbotIframe.style.bottom = "20px";
chatbotIframe.style.right = "20px";
chatbotIframe.style.width = "400px";
chatbotIframe.style.height = "600px";
chatbotIframe.style.border = "none";
chatbotIframe.style.zIndex = "9999";

// Optionally, you can add a toggle button to show/hide the chatbot
// For example, create a button and add an event listener to toggle the iframe's visibility

document.body.appendChild(chatbotIframe);

window.addEventListener("message", function(event) {
    const BOT_AVATAR_URL = chrome.runtime.getURL("botAvatar.png");
    if (event.data && event.data.action === "closeChatbot") {
      console.log("Received closeChatbot message from iframe");
      const iframe = document.getElementById("chatbotIframe");
      if (iframe) {
        iframe.style.display = "none";
      }
      if (!document.getElementById("chatbotBubble")) {
        const bubble = document.createElement("div");
        bubble.id = "chatbotBubble";
        // Clear any text content
        bubble.textContent = "";

        // Create an image element for the bot avatar
        const avatarImg = document.createElement("img");
        avatarImg.src = BOT_AVATAR_URL
        avatarImg.alt = "Chatbot";
        // Style the image so it fits the bubble
        avatarImg.style.width = "60%";
        avatarImg.style.height = "60%";
        avatarImg.style.borderRadius = "50%";
        bubble.appendChild(avatarImg);
  
        // Style the bubble (adjust as needed)
        bubble.style.position = "fixed";
        bubble.style.bottom = "30px";
        bubble.style.right = "30px";
        bubble.style.width = "60px";
        bubble.style.height = "60px";
        bubble.style.borderRadius = "50%";
        bubble.style.backgroundColor = "#E7E3D6";
        bubble.style.color = "#fff";
        bubble.style.display = "flex";
        bubble.style.alignItems = "center";
        bubble.style.justifyContent = "center";
        bubble.style.cursor = "pointer";
        bubble.style.zIndex = "9999";
  
        document.body.appendChild(bubble);
  
        // When the bubble is clicked, remove it and show the chatbot iframe again
        bubble.addEventListener("click", function() {
          bubble.remove();
          if (iframe) {
            iframe.style.display = "block";
          }
        });
      }
    }
  });
  