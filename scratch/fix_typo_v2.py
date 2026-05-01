import os

path = r'c:\Users\clire\OneDrive\Área de Trabalho\Sites\void-drip-landing-main\src\pages\Checkout.tsx'
try:
    # Try reading as UTF-8
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    print("Read as UTF-8")
except UnicodeDecodeError:
    # Try reading as Latin-1
    with open(path, 'r', encoding='latin-1') as f:
        content = f.read()
    print("Read as Latin-1")

# Replace the specific malformed string
new_content = content.replace('GRÃ TIS', 'GRÁTIS')
new_content = new_content.replace('GRÂ TIS', 'GRÁTIS') # Just in case

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement done")
