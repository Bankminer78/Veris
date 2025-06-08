import pytest
import httpx

# The URL of the running FastAPI application from formalizer.py
BASE_URL = "http://127.0.0.1:8000"

def test_verify_endpoint_simple_math():
    """
    Tests the /verify endpoint with a simple LaTeX mathematical statement.
    Assumes the server from formalizer.py is running.
    """
    latex_proof = "For any integers $m, n$, if $m$ is even and $n$ is even, then $m+n$ is even."
    
    with httpx.Client() as client:
        response = client.post(
            f"{BASE_URL}/verify",
            json={"latex": latex_proof},
            timeout=300.0  # Allow long timeout for OpenAI request
        )

    assert response.status_code == 200
    
    response_data = response.json()
    assert "status" in response_data
    assert "message" in response_data
    # We can't know for sure if it will be 'success' or 'error' as it depends
    # on the OpenAI call and subsequent verification, so we just check that the keys are present.

def test_verify_endpoint_empty_request():
    """
    Tests the /verify endpoint with an empty latex string.
    """
    with httpx.Client() as client:
        response = client.post(
            f"{BASE_URL}/verify",
            json={"latex": ""}
        )
    
    assert response.status_code == 400
    response_data = response.json()
    assert "detail" in response_data
    assert response_data["detail"] == "No LaTeX code provided."

def test_root_endpoint():
    """
    Tests the root / endpoint.
    """
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/")

    assert response.status_code == 200
    assert response.json() == {"message": "Kimina-Lean-Server is running."} 