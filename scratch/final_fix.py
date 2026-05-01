import os

path = r'c:\Users\clire\OneDrive\Área de Trabalho\Sites\void-drip-landing-main\src\pages\Checkout.tsx'
with open(path, 'rb') as f:
    content = f.read()

# The pattern I found: 47 52 c3 83 c2 81 54 49 53
pattern = bytes.fromhex('4752c383c281544953')
new_content = content.replace(pattern, 'GRÁTIS'.encode('utf-8'))

with open(path, 'wb') as f:
    f.write(new_content)

print("Final replacement done")
