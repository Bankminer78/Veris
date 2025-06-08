from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
from fastapi.middleware.cors import CORSMiddleware
from utils.formalizer_utils import (
    make_openai_request,
    verify_proof,
    get_error_messages,
    fix_proof,
    write_lean_proof
)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class LatexRequest(BaseModel):
    latex: str

@app.post("/verify")
async def verify_latex(request: LatexRequest):
    """
    This endpoint receives LaTeX code, formalizes it to Lean 4,
    and attempts to verify and fix it.
    """
    latex_document = request.latex
    if not latex_document:
        raise HTTPException(status_code=400, detail="No LaTeX code provided.")

    try:
        # Step 1: Initial formalization from LaTeX to Lean
        lean_proof = make_openai_request(latex_document)
        if not lean_proof:
            return {"status": "error", "message": "Failed to generate initial Lean proof."}

        current_proof = lean_proof
        max_retries = 3
        
        for i in range(max_retries):
            # Step 2: Verify the current proof
            verification_result = verify_proof("import Mathlib\n" + current_proof)
            
            # Step 3: Check for errors
            messages = verification_result.get("results", [{}])[0].get("response", {}).get("messages", [])
            error_messages = get_error_messages(messages)

            if not error_messages:
                # No errors found, success!
                write_lean_proof(current_proof)
                return {
                    "status": "success",
                    "message": "Verification successful! The Lean code is valid.",
                }

            # Errors found, create a suggestion message
            error_details = json.dumps(error_messages, indent=2)
            suggestion_message = f"Encountered errors. Attempting to fix (Attempt {i+1}/{max_retries}):\n{error_details}"
            
            # Step 4: Attempt to fix the proof
            fixed_proof = fix_proof(latex_document, current_proof, error_details)
            if not fixed_proof:
                return {"status": "error", "message": "Failed to generate a fix for the Lean proof."}
            
            current_proof = fixed_proof

        # If loop finishes, max retries were reached
        return {
            "status": "error",
            "message": f"Could not fix the proof after {max_retries} attempts.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Kimina-Lean-Server is running."}

    
