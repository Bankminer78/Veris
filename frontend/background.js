// // background.js

// const YOUR_BACKEND_URL = "https://your-backend-endpoint.com/verify";

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "verifyLatex") {
//     fetch(YOUR_BACKEND_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ latex: request.code }),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         // Send the feedback back to the content script
//         chrome.tabs.sendMessage(sender.tab.id, {
//           action: "displayFeedback",
//           message: data.message,
//           type: data.status, // 'success', 'suggestion', or 'error'
//         });
//       })
//       .catch((error) => {
//         console.error("Error contacting the backend:", error);
//         chrome.tabs.sendMessage(sender.tab.id, {
//           action: "displayFeedback",
//           message: "An error occurred while contacting the verifier.",
//           type: "error",
//         });
//       });
//   }
// });

// background.js (with mocked backend)

/**
 * Mocks the backend response.
 * In a real scenario, this function would not exist, and the fetch call would be used.
 * @param {string} latexCode - The LaTeX code received from the content script.
 * @returns {object} A mock response object with status and message.
 */
function getMockResponse(latexCode) {
  // --- MOCK LOGIC ---
  // You can change the logic here to test different scenarios.

  // Scenario 1: Test for a "success" response
  if (latexCode.includes("\\sqrt{4}")) {
    return {
      status: "success",
      message: "Verification successful! The math is correct.",
    };
  }

  // Scenario 2: Test for a "suggestion" response
  if (latexCode.includes("\\frac")) {
    return {
      status: "suggestion",
      message:
        "Suggestion: Consider adding domain constraints for the variables in the fraction.",
    };
  }

  // Scenario 3: Test for an "error" response
  if (latexCode.includes("error")) {
    return {
      status: "error",
      message: "Error: The syntax is invalid or could not be proven.",
    };
  }

  // Default response if no specific keyword is found
  return {
    status: "success",
    message: "Mock verification complete.",
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("received a message to verify latex");
  if (request.action === "verifyLatex") {
    console.log("Received LaTeX code in background script:", request.code);

    // Get the mock response based on the code's content
    const mockData = getMockResponse(request.code);

    console.log("Sending mock response to content script:", mockData);

    // Use a small delay to simulate network latency
    setTimeout(() => {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "displayFeedback",
        message: mockData.message,
        type: mockData.status, // 'success', 'suggestion', or 'error'
      });
    }, 500); // 500ms delay

    // Note: The real 'fetch' call is commented out.
    /*
    fetch(YOUR_BACKEND_URL, { ... })
      .then(response => response.json())
      .then(data => { ... })
      .catch(error => { ... });
    */
  }
  // To allow for asynchronous response with sendMessage
  return true;
});
