# Veris: AI-Powered Lean Proof Verification in Overleaf

Veris is an unstable prototype of a Chrome extension that bring Lean proof verification directly into the Overleaf editor. It uses the Kimina Lean Server and large language models, to formalize and verify mathematical statements written in LaTeX. 

*The following setup is barebones and is expected to be overhauled.*

<!-- ## Features

- **Overleaf Integration**: Verify your math without leaving your editor.
- **LaTeX to Lean Formalization**: Automatically converts LaTeX math into formal Lean code using AI.
- **High-Performance Verification**: Utilizes the high-throughput Kimina Lean Server for fast proof verification.
- **Real-time Feedback**: Get instant feedback on the validity of your mathematical statements. -->

## Setup Instructions

Follow these instructions to set up the backend servers and the frontend Chrome extension. The setup involves two backend services: the **Kimina Lean Server** for proof verification and the **Formalizer Server** for LaTeX-to-Lean conversion.

### 1. Backend Setup

These steps will guide you through setting up the necessary backend services. All commands should be run from the `server` directory.

**A. Enter the backend Directory**

```sh
cd backend
```

**B. Create a Virtual Environment**

It's recommended to use a virtual environment to manage Python dependencies.

```sh
python -m venv venv
source venv/bin/activate
# On Windows, use: venv\Scripts\activate
```

**C. Install Dependencies**

```sh
pip install -r requirements.txt
```

**D. Set Up the Lean Environment**

This script installs Lean 4 and builds the required `mathlib4` and `repl` libraries.

```sh
bash setup.sh
```

**E. Configure Environment Variables**

You need to create a `.env` file to configure the servers.

1.  Create a file named `.env` inside the `server` directory.
2.  Copy the following content into it. These are the default settings; you can adjust them if needed.

    ```
    # Server Configuration
    LEANSERVER_HOST=0.0.0.0
    LEANSERVER_PORT=12332
    LEANSERVER_API_KEY=

    # Performance Tuning (Defaults to CPU count)
    LEANSERVER_MAX_REPLS=
    LEANSERVER_MAX_CONCURRENT_REQUESTS=
    ```

**F. Run the Servers**

You will need to run two servers in separate terminal windows.

1.  **Run the Kimina Lean Server**: This server handles Lean proof verification.

    ```sh
     # In your first terminal, from the backend/ directory:
    python -m server
    ```

2.  **Run the Formalizer Server**: This server provides the endpoint that converts LaTeX to Lean code. Before you run the following command, add your OPENAI_API_KEY to your .env file.

    ```sh
     # In your second terminal, from the backend/ directory:
    uvicorn formalizer:app --reload
    ```
    *(Note: You will need to implement and run this service, which should listen on `http://127.0.0.1:8000` as expected by the frontend.)*

### 2. Frontend Setup

To use the extension, you need to load it into a Chromium-based browser like Google Chrome or Brave.

1.  Open your browser and navigate to `chrome://extensions`.
2.  Enable **Developer mode** using the toggle in the top-right corner.
3.  Click the **Load unpacked** button.
4.  Select the `frontend` directory from this project.

The extension should now be installed. When you open an Overleaf project, you can trigger verification by clicking the "Recompile" button or using the `Cmd/Ctrl + Enter` shortcut.
