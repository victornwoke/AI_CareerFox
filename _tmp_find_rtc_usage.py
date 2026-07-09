import pathlib

root = pathlib.Path('/Users/vic/Documents/AI_CareerFox/.venv/lib/python3.14/site-packages')
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if 'getstream.video.rtc' in text:
        print(path)
