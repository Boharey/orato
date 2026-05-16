# backend/app/services/llm_service.py

import os
import json
import hashlib
import re
import httpx
from cachetools import TTLCache

# ---------- Caching ----------
cache = TTLCache(maxsize=100, ttl=3600)

def _get_cache_key(description: str) -> str:
    return hashlib.md5(description.strip().lower().encode()).hexdigest()

# ---------- Provider configurations ----------
PROVIDERS = [
    {
        "name": "Gemini",
        "api_key_env": "GEMINI_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",   # CHANGED
        "headers": lambda key: {"Content-Type": "application/json"},
        "build_payload": lambda prompt: {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
        },
        "extract_response": lambda resp_json: resp_json["candidates"][0]["content"]["parts"][0]["text"],
        "auth_type": "query"
    },
    {
        "name": "Groq",
        "api_key_env": "GROQ_API_KEY",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "headers": lambda key: {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        },
        "build_payload": lambda prompt: {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2048,
            "response_format": {"type": "json_object"}
        },
        "extract_response": lambda resp_json: resp_json["choices"][0]["message"]["content"],
        "auth_type": "header"
    },
    {
        "name": "DeepSeek (OpenRouter)",
        "api_key_env": "OPENROUTER_API_KEY",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "headers": lambda key: {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Orato"
        },
        "build_payload": lambda prompt: {
            "model": "deepseek/deepseek-r1:free",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2048
        },
        "extract_response": lambda resp_json: resp_json["choices"][0]["message"]["content"],
        "auth_type": "header"
    }
]

def _extract_json(text: str) -> dict:
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip markdown fences
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    # Find any JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not extract valid JSON from LLM response")


async def generate_scenario_script(scenario_description: str) -> dict:
    cache_key = _get_cache_key(scenario_description)
    if cache_key in cache:
        return cache[cache_key]

    prompt = f"""
You are an expert communication coach. A user wants to practise speaking for the following scenario:

"{scenario_description}"

Please generate a structured practice guide with these parts:
1. A short, specific title for this scenario.
2. A one-sentence description.
3. 3-5 sections, each with:
   - A heading
   - 3-5 bullet points with concrete advice, phrases to use, or tips.
4. (Optional) A "full_script" example that the user could read aloud.

Return only valid JSON, with keys: "title", "description", "sections" (array of objects with "heading" and "points"), and optionally "full_script".
"""

    last_error = None
    for provider in PROVIDERS:
        api_key = os.getenv(provider["api_key_env"])
        if not api_key:
            print(f"Skipping {provider['name']}: API key not set")
            continue

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = provider["headers"](api_key)
                payload = provider["build_payload"](prompt)
                url = provider["url"]

                if provider.get("auth_type") == "query":
                    url += f"?key={api_key}"

                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 429:
                    print(f"{provider['name']} rate limited (429)")
                    continue

                response.raise_for_status()
                data = response.json()
                raw_text = provider["extract_response"](data)

            result = _extract_json(raw_text)
            cache[cache_key] = result
            return result

        except httpx.HTTPStatusError as e:
            if e.response.status_code in (429, 403, 401, 500, 503):
                print(f"{provider['name']} failed with {e.response.status_code}")
                continue
            last_error = e
        except Exception as e:
            print(f"{provider['name']} error: {e}")
            last_error = e


    if last_error is None:
        raise RuntimeError(
            "No LLM provider attempted. Make sure you set at least one API key "
            "(e.g., GEMINI_API_KEY, GROQ_API_KEY) and loaded your .env file."
        )
    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")
    

    