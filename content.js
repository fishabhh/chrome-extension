// Create an iframe element
const chatbotIframe = document.createElement("iframe");

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
