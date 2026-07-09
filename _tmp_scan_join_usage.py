import pathlib
import vision_agents

root = pathlib.Path(vision_agents.__path__[0]).parent / 'vision_agents'
for path in root.rglob('*.py'):
    text = path.read_text(errors='ignore')
    if 'create_call(' in text or '.join(' in text or 'EdgeTransport(' in text:
        print(f'--- {path} ---')
        for line in text.splitlines():
            if 'create_call(' in line or '.join(' in line or 'EdgeTransport(' in line or 'Realtime(' in line:
                print(line)
