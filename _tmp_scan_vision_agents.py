import pathlib
import vision_agents

root = pathlib.Path(vision_agents.__path__[0]).parent
print('root', root)
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if 'Gemini' in text or 'gemini' in text:
        print(path.relative_to(root))