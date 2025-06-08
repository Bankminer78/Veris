// content.js (Updated with a resilient retry mechanism)

console.log("✅ Overleaf Lean Verifier: Content Script Loaded!");

/**
 * Gets the LaTeX code from the active CodeMirror editor instance.
 * @returns {string|null} The LaTeX code or null if the editor isn't found.
 */
function getLatexCode() {
  const editor = document.querySelector(".cm-editor");
  if (editor && editor.cmView) {
    return editor.cmView.view.state.doc.toString();
  }
  return null;
}

/**
 * Displays a feedback notification at the bottom-right of the page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success', 'suggestion', 'error', or 'info').
 */
function displayFeedback(message, type) {
  let feedbackBox = document.getElementById("lean-verifier-feedback");
  if (!feedbackBox) {
    feedbackBox = document.createElement("div");
    feedbackBox.id = "lean-verifier-feedback";
    document.body.appendChild(feedbackBox);
  }

  feedbackBox.textContent = message;
  feedbackBox.className = type;
  feedbackBox.style.display = "block";

  // --- Styling ---
  feedbackBox.style.position = "fixed";
  feedbackBox.style.bottom = "20px";
  feedbackBox.style.right = "20px";
  feedbackBox.style.padding = "15px";
  feedbackBox.style.borderRadius = "8px";
  feedbackBox.style.color = "white";
  feedbackBox.style.zIndex = "9999";
  feedbackBox.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  feedbackBox.style.maxWidth = "300px";

  // Set colors based on type
  const colors = {
    success: "#28a745",
    suggestion: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8", // A blue for informational messages
  };
  feedbackBox.style.backgroundColor = colors[type] || colors.info;
  feedbackBox.style.color = type === "suggestion" ? "black" : "white";

  // Automatically hide after 7 seconds, unless it's an error
  const hideDelay = type === "error" ? 10000 : 7000;
  setTimeout(() => {
    if (feedbackBox) feedbackBox.style.display = "none";
  }, hideDelay);
}

/**
 * The core function that gets the code and sends it to the background script.
 * This now includes a retry mechanism.
 */
function triggerVerification() {
  console.log("Verification triggered. Looking for editor...");

  let attempts = 0;
  const maxAttempts = 10; // Try 10 times over 5 seconds
  const interval = 500; // Try every 500ms

  const tryToVerify = setInterval(() => {
    attempts++;
    const latexCode = getLatexCode();

    if (latexCode) {
      // SUCCESS: Editor found!
      clearInterval(tryToVerify); // Stop trying
      console.log(
        `Editor found on attempt ${attempts}. Sending LaTeX to background script.`
      );
      chrome.runtime.sendMessage({
        action: "verifyLatex",
        code: latexCode,
      });
    } else if (attempts >= maxAttempts) {
      // FAILURE: Waited too long, editor never appeared.
      clearInterval(tryToVerify); // Stop trying
      console.error(
        "Lean Verifier: Could not find Overleaf's CodeMirror editor after multiple attempts."
      );
      displayFeedback(
        "Error: Could not find the Overleaf editor. Please try reloading the page.",
        "error"
      );
    } else {
      // RETRYING: Editor not found yet, will try again.
      console.log(`Editor not found on attempt ${attempts}. Retrying...`);
    }
  }, interval);
}

// --- TRIGGERS ---

// TRIGGER 1: Listening for the Recompile Button Click
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button && button.textContent.trim() === "Recompile") {
    console.log("Recompile button clicked!");
    triggerVerification();
  }
});

// TRIGGER 2: Listening for the Keyboard Shortcut (Ctrl+Enter or Cmd+Enter)
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    console.log("Ctrl/Cmd + Enter shortcut detected!");
    event.preventDefault();
    event.stopPropagation();
    triggerVerification();
  }
});

// --- LISTENER: For receiving feedback from the background script ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayFeedback") {
    displayFeedback(request.message, request.type);
  }
});
