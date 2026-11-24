import re

with open('Frontend/src/app/documents/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<option[^>]*value="([^"]+)"', text):
    print(m.group(0))

for m in re.finditer(r'useState<DocumentType>\("([^"]+)"\)', text):
    print('Initial DocumentType state:', m.group(0))

for m in re.finditer(r'useState<DocumentVisibility>\("([^"]+)"\)', text):
    print('Initial DocumentVisibility state:', m.group(0))
