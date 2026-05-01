import os

path = r'c:\Users\clire\OneDrive\Área de Trabalho\Sites\void-drip-landing-main\src\pages\Checkout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_957 = lines[956]
print(f"Line 957: {line_957!r}")
print(f"Hex: {line_957.encode('utf-8').hex()}")

# Try replacing by regex
import re
new_lines = []
for line in lines:
    new_lines.append(re.sub(r'GR. TIS', 'GRÁTIS', line))

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Done")
