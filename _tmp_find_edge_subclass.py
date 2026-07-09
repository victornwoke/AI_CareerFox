import pathlib

root = pathlib.Path('/Users/vic/Documents/AI_CareerFox/.venv/lib/python3.14/site-packages')
needle = 'EdgeTransport'
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if 'from vision_agents.core.edge' in text or 'EdgeTransport' in text:
        if 'class ' in text:
            for line in text.splitlines():
                if 'class ' in line and 'EdgeTransport' in line:
                    print(path)
                    print(line)
