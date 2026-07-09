import pathlib
import vision_agents

root = pathlib.Path(vision_agents.__path__[0]).parent
matches: list[str] = []
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if (
        'google.genai' in text
        or 'GenAI' in text
        or 'google_genai' in text
        or 'Gemini' in text
    ):
        matches.append(str(path))

print('\n'.join(matches))