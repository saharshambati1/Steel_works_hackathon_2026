"""
RAG Engine for Educational Content
Lightweight retrieval-augmented generation using local curriculum JSON files.
"""
import json
import os
from typing import Optional

# Base directory for curriculum files
CURRICULUM_DIR = os.path.join(os.path.dirname(__file__), "curriculum")


def load_curriculum(subject: str) -> dict:
    """Load curriculum JSON file for a given subject."""
    filename = f"{subject.lower()}_curriculum.json"
    filepath = os.path.join(CURRICULUM_DIR, filename)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def normalize_grade(grade: str) -> str:
    """Normalize grade input to standard format."""
    grade = str(grade).strip().lower()
    
    # Handle special cases
    if grade in ['k', 'kindergarten']:
        return 'K'
    if grade in ['algebra 1', 'algebra1', 'algebra']:
        return 'Algebra 1'
    
    # Handle numeric grades
    try:
        num = int(grade.replace('grade', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').strip())
        return str(num)
    except ValueError:
        return grade.title()


def get_curriculum_context(subject: str, grade: str, topic_keywords: Optional[list] = None) -> str:
    """
    Retrieve relevant curriculum context for RAG augmentation.
    
    Args:
        subject: "math" or "science"
        grade: Grade level
        topic_keywords: Optional list of keywords to filter topics
    
    Returns:
        Formatted string with curriculum standards and guidelines
    """
    curriculum = load_curriculum(subject)
    if not curriculum:
        return ""
    
    normalized_grade = normalize_grade(grade)
    grade_data = curriculum.get("grades", {}).get(normalized_grade, {})
    
    if not grade_data:
        # Try to find closest grade
        return f"Use age-appropriate {subject} content for grade {grade}."
    
    # Build context string
    context_parts = []
    
    # Grade overview
    if "overview" in grade_data:
        context_parts.append(f"GRADE {normalized_grade} OVERVIEW:\n{grade_data['overview']}")
    
    # Topics and standards
    if "topics" in grade_data:
        topics_text = "KEY TOPICS:\n"
        for topic in grade_data["topics"]:
            topic_name = topic.get("name", "")
            # Filter by keywords if provided
            if topic_keywords:
                if not any(kw.lower() in topic_name.lower() for kw in topic_keywords):
                    continue
            
            topics_text += f"- {topic_name}\n"
            if "standards" in topic:
                for standard in topic["standards"][:3]:  # Limit to 3 standards per topic
                    topics_text += f"  • {standard}\n"
        context_parts.append(topics_text)
    
    # Vocabulary guidelines
    if "vocabulary_level" in grade_data:
        context_parts.append(f"VOCABULARY LEVEL: {grade_data['vocabulary_level']}")
    
    # Difficulty guidelines
    if "difficulty_guidelines" in grade_data:
        context_parts.append(f"DIFFICULTY GUIDELINES:\n{grade_data['difficulty_guidelines']}")
    
    return "\n\n".join(context_parts)


def extract_keywords(prompt: str) -> list:
    """Extract topic keywords from user prompt."""
    # Simple keyword extraction - could be enhanced with NLP
    common_words = {'for', 'the', 'and', 'with', 'to', 'a', 'an', 'in', 'on', 'of', 
                    'grade', 'practice', 'worksheet', 'problems', 'questions', 'help',
                    'learn', 'study', 'basic', 'advanced', 'simple', 'hard', 'easy'}
    
    words = prompt.lower().replace(',', ' ').replace('.', ' ').split()
    keywords = [w for w in words if w not in common_words and len(w) > 2]
    
    return keywords


def get_augmented_context(prompt: str, subject: str, grade: str) -> str:
    """
    Main RAG function - retrieve and format curriculum context for prompt augmentation.
    
    Args:
        prompt: User's natural language request
        subject: "math" or "science"
        grade: Grade level
    
    Returns:
        Formatted curriculum context string
    """
    keywords = extract_keywords(prompt)
    context = get_curriculum_context(subject, grade, keywords if keywords else None)
    
    return context
