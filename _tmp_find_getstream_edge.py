import pathlib

root = pathlib.Path('/Users/vic/Documents/AI_CareerFox/.venv/lib/python3.14/site-packages')
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if 'class Edge' in text or 'def Edge(' in text or 'getstream.Edge' in text:
        print(f'--- {path} ---')
        for line in text.splitlines():
            if 'class Edge' in line or 'getstream.Edge' in line or 'Edge(' in line:
                print(line)
