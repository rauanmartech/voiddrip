import sys

path = r'c:\Users\clire\OneDrive\Área de Trabalho\Sites\void-drip-landing-main\src\pages\Checkout.tsx'
with open(path, 'rb') as f:
    content = f.read()

# Replace the byte sequence for 'GRÃ TIS' with 'GRÁTIS' encoded in UTF-8
# Ã in UTF-8 is \xc3\x83, but here it looks like it might be a different encoding or double encoded.
# Let's try common patterns.
old_patterns = [
    b'GR\xc3\x83 TIS', 
    b'GR\xc3 TIS',
    b'GR\xc3\x83\xc2\x83 TIS'
]

new_content = content
for pattern in old_patterns:
    new_content = new_content.replace(pattern, 'GRÁTIS'.encode('utf-8'))

with open(path, 'wb') as f:
    f.write(new_content)

print("Done")
