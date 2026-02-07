"""
Groq API Client for Educational Content Generation
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Lazy initialization - client created on first use
_client = None

def get_groq_client():
    """Get or create Groq client instance."""
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

def generate_educational_content(
    prompt: str,
    subject: str,
    grade: str,
    language: str = "English",
    curriculum_context: str = ""
) -> dict:
    """
    Generate educational content using Groq LLM.
    
    Args:
        prompt: User's natural language request
        subject: "math" or "science"
        grade: Grade level (e.g., "4", "K", "Algebra 1")
        language: Output language ("English" or "Spanish")
        curriculum_context: RAG-retrieved curriculum standards
    
    Returns:
        dict with 'explanation', 'examples', 'practice_questions', 'answer_key'
    """
    
    system_prompt = f"""You are an expert {subject} educator creating content for grade {grade} students.
    
LANGUAGE INSTRUCTION: Generate ALL content in {language}.

CURRICULUM CONTEXT:
{curriculum_context if curriculum_context else "Use age-appropriate content for the specified grade level."}

OUTPUT FORMAT (respond in this exact JSON structure):
{{
    "title": "Clear, descriptive title for the worksheet",
    "explanation": "Clear, age-appropriate explanation of the concept (2-3 paragraphs)",
    "worked_examples": [
        {{
            "problem": "Example problem",
            "solution": "Step-by-step solution"
        }}
    ],
    "practice_questions": [
        {{
            "question": "Practice question",
            "difficulty": "easy|medium|hard"
        }}
    ],
    "answer_key": [
        "Answer 1",
        "Answer 2"
    ]
}}

GUIDELINES:
- Use vocabulary appropriate for grade {grade}
- Include 2-3 worked examples with detailed steps
- Provide 5-8 practice questions at varying difficulty levels
- Keep explanations engaging and clear
- For math: show all work in solutions
- For science: include real-world connections"""

    user_message = f"Create educational content for: {prompt}"
    
    try:
        client = get_groq_client()
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        response_text = chat_completion.choices[0].message.content
        return json.loads(response_text)
        
    except Exception as e:
        # Return error structure for graceful handling
        return {
            "error": str(e),
            "title": "Generation Error",
            "explanation": f"Failed to generate content: {str(e)}",
            "worked_examples": [],
            "practice_questions": [],
            "answer_key": []
        }


def generate_content_stream(prompt: str, subject: str, grade: str, language: str = "English", curriculum_context: str = ""):
    """
    Stream educational content generation (for future use with real-time updates).
    """
    # Placeholder for streaming implementation
    return generate_educational_content(prompt, subject, grade, language, curriculum_context)
