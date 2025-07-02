import requests
import json
import re

GEMINI_API_KEY = "AIzaSyBAyekD62L6Nh6TI4xrL3Bt2P51UtZtDcc"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY

HEADERS = {"Content-Type": "application/json"}

def call_gemini(prompt: str) -> str:
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    resp = requests.post(GEMINI_API_URL, headers=HEADERS, json=data)
    if resp.ok:
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return "[AI Error: Unable to get response]"

def get_hint(problem_description: str) -> str:
    prompt = f"You are a coding assistant. Give a helpful hint for the following problem, but do not give away the solution.\nProblem: {problem_description}"
    return call_gemini(prompt)

def explain_error(code: str, error: str) -> str:
    prompt = f"Given the following code and error message, explain the error in simple terms and suggest a fix.\nCode:\n{code}\nError:\n{error}"
    return call_gemini(prompt)

def analyze_code(code: str, problem_description: str) -> dict:
    prompt = f"Analyze the following code for the given problem.\nProblem: {problem_description}\nCode:\n{code}\n1. What is the time complexity?\n2. What is the space complexity?\n3. Is there a more optimized approach? If yes, give a hint for it (do not give code)."
    text = call_gemini(prompt)
    return {"analysis": text}

def get_optimal_code(problem_description: str) -> dict:
    prompt = f"""
You are a coding assistant. For the following problem:
{problem_description}

1. Provide the most optimal code solution in all of the following languages: C++, Java, Python, and JavaScript. Each language's code should be a separate field in the JSON, and must include all necessary brackets and formatting for clarity. Do not use markdown or triple backticks. Each code field should be a plain string.
2. Provide a brief explanation of the optimal solution, and state its time and space complexity.
3. Provide a brute-force code solution in all of the following languages: C++, Java, Python, and JavaScript. Each language's code should be a separate field in the JSON, and must include all necessary brackets and formatting for clarity. Do not use markdown or triple backticks. Each code field should be a plain string.
4. Provide a brief explanation of the brute-force solution, and state its time and space complexity.
5. Compare the optimal and brute-force solutions in terms of efficiency and approach.

Return your response as a single valid JSON object with the following keys:
- optimal_code_cpp
- optimal_code_java
- optimal_code_python
- optimal_code_javascript
- optimal_explanation
- optimal_time_complexity
- optimal_space_complexity
- brute_code_cpp
- brute_code_java
- brute_code_python
- brute_code_javascript
- brute_explanation
- brute_time_complexity
- brute_space_complexity
- comparison

Do NOT use markdown formatting or triple backticks anywhere. Only output valid JSON.
"""
    text = call_gemini(prompt)
    try:
        return json.loads(text)
    except Exception:
        # Try to clean up the response if possible
        cleaned = re.sub(r"```[a-zA-Z]*|```", "", text)
        try:
            return json.loads(cleaned)
        except Exception:
            return {"error": "AI response could not be parsed as JSON", "raw": text}

def get_similar_problems(problem_title: str) -> list:
    prompt = f"""
Given the following LeetCode problem title, return a list of 4-5 similar LeetCode problem titles. Only return a JSON array of strings (the titles). Do not include any markdown, explanation, or extra text.

Problem title: {problem_title}
"""
    text = call_gemini(prompt)
    try:
        return json.loads(text)
    except Exception:
        # Try to clean up the response if possible
        cleaned = re.sub(r"```[a-zA-Z]*|```", "", text)
        try:
            return json.loads(cleaned)
        except Exception:
            return ["[AI error: Could not parse similar problems]", text]

def get_companies_asked(problem_title: str) -> list:
    prompt = f"""
Given the following LeetCode problem title, return a JSON array of objects, each with 'name' (company name) and 'year' (the year the company asked this problem in interviews). Only include real companies and plausible years. Return only the JSON array, no markdown or extra text.

Problem title: {problem_title}
"""
    text = call_gemini(prompt)
    try:
        return json.loads(text)
    except Exception:
        cleaned = re.sub(r"```[a-zA-Z]*|```", "", text)
        try:
            return json.loads(cleaned)
        except Exception:
            return [] 