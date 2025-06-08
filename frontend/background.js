// background.js

const YOUR_BACKEND_URL = "http://127.0.0.1:8000/verify";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "verifyLatex") {
    console.log("Received LaTeX code for verification:", request.code);

    // Immediately send a "Verifying..." message to the content script.
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "displayFeedback",
      message: "Verifying...",
      type: "verifying",
    });

    fetch(YOUR_BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ latex: request.code }),
    })
      .then(response => {
        if (!response.ok) {
          // Handle HTTP errors like 404 or 500
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Received response from backend:", data);
        // Send the feedback back to the content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "displayFeedback",
          message: data.message,
          type: data.status, // 'success', 'suggestion', or 'error'
        });
      })
      .catch((error) => {
        console.error("Error contacting the backend:", error);
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "displayFeedback",
          message: `An error occurred while contacting the verifier: ${error.message}`,
          type: "error",
        });
      });
    
    // Return true to indicate that we will send a response asynchronously.
    return true; 
  }
});
