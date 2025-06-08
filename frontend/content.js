// content.js (Final version using DOM scraping)

console.log("✅ Overleaf Lean Verifier: Content Script Loaded!");

/**
 * Gets the LaTeX code by directly reading the text from the rendered
 * CodeMirror 6 HTML elements. This is a DOM scraping approach.
 * @returns {string|null} The LaTeX code or null if editor lines aren't found.
 */
function getLatexCodeFromDOM() {
  // CodeMirror 6 renders each line of the editor in a div with the class "cm-line".
  // We select all of them.
  const lineElements = document.querySelectorAll(".cm-editor .cm-line");

  if (lineElements.length === 0) {
    // This check is still useful in case the editor hasn't loaded yet.
    return null;
  }

  // We create an array from the line elements, get the text content of each one,
  // and then join them together with a newline character.
  const lines = Array.from(lineElements).map((line) => line.textContent);
  return lines.join("\n");
}

/**
 * Displays a feedback notification at the bottom-right of the page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success', 'suggestion', or 'error').
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

  const colors = {
    success: "#28a745",
    suggestion: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8",
  };
  feedbackBox.style.backgroundColor = colors[type] || colors.info;
  feedbackBox.style.color = type === "suggestion" ? "black" : "white";

  const hideDelay = type === "error" ? 10000 : 7000;
  setTimeout(() => {
    if (feedbackBox) feedbackBox.style.display = "none";
  }, hideDelay);
}

/**
 * The core function that gets the code and sends it to the background script.
 * Includes a retry mechanism to wait for the editor to be rendered.
 */
function triggerVerification() {
  console.log("Verification triggered. Looking for editor lines in the DOM...");

  let attempts = 0;
  const maxAttempts = 10;
  const interval = 500;

  const tryToVerify = setInterval(() => {
    attempts++;
    // We now call our new DOM scraping function.
    const latexCode = getLatexCodeFromDOM();

    if (latexCode) {
      clearInterval(tryToVerify);
      console.log(
        `Editor lines found on attempt ${latexCode}. Sending LaTeX to background script.`
      );
      console.log("latex code: ", latexCode);
      chrome.runtime.sendMessage({
        action: "verifyLatex",
        code: latexCode,
      });
    } else if (attempts >= maxAttempts) {
      clearInterval(tryToVerify);
      console.error(
        "Lean Verifier: Could not find editor lines (.cm-line) after multiple attempts."
      );
      displayFeedback(
        "Error: Could not find the Overleaf editor. Please try reloading the page.",
        "error"
      );
    } else {
      console.log(`Editor lines not found on attempt ${attempts}. Retrying...`);
    }
  }, interval);
}

// --- TRIGGERS ---

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button && button.textContent.trim() === "Recompile") {
    console.log("Recompile button clicked!");
    triggerVerification();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    console.log("Ctrl/Cmd + Enter shortcut detected!");
    event.preventDefault();
    event.stopPropagation();
    triggerVerification();
  }
});

// --- LISTENER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayFeedback") {
    displayFeedback(request.message, request.type);
  }
});
