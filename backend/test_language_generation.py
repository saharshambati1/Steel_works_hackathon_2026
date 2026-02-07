
import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pdf_generator import generate_pdf
from groq_client import generate_educational_content

class TestLanguageGeneration(unittest.TestCase):

    def test_pdf_generator_spanish(self):
        """Test PDF generation with Spanish localization."""
        content = {
            "title": "Prueba de Matemáticas",
            "explanation": "Esta es una explicación.",
            "worked_examples": [
                {"problem": "1+1", "solution": "2"}
            ],
            "practice_questions": [
                {"question": "¿Cuánto es 2+2?", "difficulty": "easy"}
            ],
            "answer_key": ["4"]
        }
        
        pdf_bytes = generate_pdf(content, "math", "4", language="Spanish")
        self.assertTrue(len(pdf_bytes) > 0)
        
        # Save to check manually if needed
        with open("test_spanish.pdf", "wb") as f:
            f.write(pdf_bytes)
            
    @patch('groq_client.get_groq_client')
    def test_groq_client_spanish_prompt(self, mock_get_client):
        """Test that the Spanish language instruction is added to the prompt."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        mock_completion = MagicMock()
        mock_completion.choices[0].message.content = '{"title": "Test"}'
        mock_client.chat.completions.create.return_value = mock_completion
        
        generate_educational_content("addition", "math", "1", language="Spanish")
        
        # Check if the system prompt contained the language instruction
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]['messages']
        system_prompt = messages[0]['content']
        
        self.assertIn("Generate ALL content in Spanish", system_prompt)

if __name__ == '__main__':
    unittest.main()
