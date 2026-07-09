import pathlib

root = pathlib.Path('/Users/vic/Documents/AI_CareerFox/.venv/lib/python3.14/site-packages/getstream')
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if (
        ('class Edge' in text or 'EdgeTransport' in text or 'def join(' in text)
        and 'call' in text
    ):
        print(f'--- {path} ---')
        for line in text.splitlines():
            if 'class Edge' in line or 'EdgeTransport' in line or 'def join(' in line:
                print(line)
