import nest_asyncio
from client import Lean4Client
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client
# Make sure to set your OPENAI_API_KEY environment variable
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")  # This will read the API key from environment variables
)

draft_prompt = """
You are an expert in Lean 4. Your task is to perform a direct and literal translation of an informal mathematical text in LaTeX into a formal Lean 4 draft.

Core Instruction: Do NOT advance the proof beyond what is explicitly written in the LaTeX. Your only job is to formalize the user's current work.

Steps:

Formalize the Statement: Write a formal Lean theorem or lemma that precisely matches the user's statement in LaTeX. Declare all necessary variables.

Import Libraries: Mathlib will be imported for you. So please do not import it.

Translate Mathematical Content: Scan the entire document for mathematical arguments, definitions, assumptions, and steps. Translate any content you find into its Lean 4 equivalent.

Stop Exactly: After translating all the user's written steps, add a sorry as a placeholder for the rest of the proof. Do not generate any tactics or reasoning that the user has not yet written.

Use Lean 4 tactics: All proofs must be constructed using modern Lean 4 tactics. Do not use Lean 3 style tactics or syntax. A key difference is that Lean 4 no longer uses begin and end blocks for proofs; instead, tactics are applied directly after the by keyword.

Output:
Produce ONLY the raw Lean 4 code. Do not include explanations, markdown, or conversational text.

LaTeX Document:
"""

fixer_prompt = """
You are an expert in debugging Lean 4 code. Your task is to fix compiler errors in a given Lean 4 code snippet based on the original mathematical text and the error messages provided.

Core Instruction: Your only job is to resolve the compiler errors. Do NOT advance the proof, add new reasoning, or alter the logical structure of the existing proof steps.

Inputs:
You will be given three pieces of information:

LaTeX Document: The original informal mathematics.
Lean Code: The Lean 4 code that failed to compile.
Compiler Errors: The specific error messages produced by the Lean compiler.
Steps:


Analyze: 
Carefully review the LaTeX, the incorrect Lean code, and the compiler errors to understand the source of the issue.
Correct: 
Modify the Lean code only to fix the identified errors. The fix should be the most direct resolution of the compiler message. Do NOT import Mathlib or any of its modules. Assume imports are already present.
Maintain Integrity: Ensure the corrected code remains a direct translation of the provided LaTeX steps. The goal is to make the existing code work, not to write new code.

Output:
Produce ONLY the raw Lean 4 code. Do not include explanations, markdown, or conversational text.

"""
    
def write_lean_proof(proof: str, filename: str = "output.lean"):
    """
    Write the Lean proof to a file.
    """
    with open(filename, 'w') as f:
        f.write("import Mathlib\n" + proof)
    print(f"\nProof successfully written to {filename}")

def verify_proof(proof: str):
    
    # Enable nested asyncio for Jupyter notebooks
    nest_asyncio.apply()

    client = Lean4Client(base_url="http://127.0.0.1:12332")

    response = client.verify([
        {"proof": proof, "custom_id": "1"}
    ], timeout=60)

    return response


def make_openai_request(latex_document: str):
    try:

        response = client.responses.create(
            model="o4-mini",
            reasoning={"effort": "low"},
            input=[
            {
                "role": "user", 
                "content": draft_prompt + latex_document
            }
                ]
            )
        return response.output_text
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")


def fix_proof(latex_document: str, proof: str, error_messages: str):
    try:
        response = client.responses.create(
            model="o4-mini",
            reasoning={"effort": "low"},
            input=[
                {
                    "role": "user",
                    "content": fixer_prompt + f"\nLaTeX Document:\n{latex_document}\n\nLean Code:\n{proof}\n\nCompiler Errors:\n{error_messages}"
                }
            ]
        )
        return response.output_text
    except Exception as e:
        print(f"An error occurred while fixing proof: {str(e)}")
        return None

def get_error_messages(messages):
    """
    Check if any messages have severity 'error'.
    Returns the messages list if errors exist, otherwise returns None.
    """
    if any(msg["severity"] == "error" for msg in messages):
        return messages
    return None 