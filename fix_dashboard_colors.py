import os
import glob

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rule 3: Badges
    content = content.replace('bg-[#22C55E]/10 text-[#005321] border-[#4ae176]', 'bg-[#dcfce7] text-[#166534] border-[#dcfce7]')
    content = content.replace('bg-[#22C55E]/10 text-[#005321]', 'bg-[#dcfce7] text-[#166534]')
    
    # Status badges overrides based on Rule 8 mapping
    content = content.replace('bg-orange-100 text-orange-800', 'bg-[#fff7ed] text-[#9a3412]')
    content = content.replace('bg-red-100 text-red-800', 'bg-[#fee2e2] text-[#991b1b]')
    
    # Rule 3: Buttons and general elements
    content = content.replace('bg-[#22C55E]', 'bg-[#006e2f]')
    content = content.replace('hover:bg-[#22C55E]', 'hover:bg-[#005321]')
    
    # Text colors
    content = content.replace('text-[#22C55E]', 'text-[#006e2f]')
    content = content.replace('text-[#22c55e]', 'text-[#006e2f]')
    
    # Borders and rings
    content = content.replace('border-[#22C55E]', 'border-[#006e2f]')
    content = content.replace('ring-[#22C55E]', 'ring-[#006e2f]')

    # Stroke/Fill for SVGs and charts
    content = content.replace('stroke="#22C55E"', 'stroke="#006e2f"')
    content = content.replace("stroke: '#22C55E'", "stroke: '#006e2f'")
    content = content.replace('fill="#22C55E"', 'fill="#006e2f"')
    content = content.replace("fill: '#22C55E'", "fill: '#006e2f'")
    content = content.replace('stopColor="#22C55E"', 'stopColor="#006e2f"')

    # Replace error colors to match Rule 1 (Red -> #ba1a1a) where hardcoded
    # We will leave `text-error` alone as we can fix it in tailwind config later if needed, but for specific text-red-700:
    content = content.replace('text-red-700', 'text-[#ba1a1a]')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Target admin and dashboard folders ONLY
target_dirs = [
    r"c:\Users\Lenny\OneDrive\Desktop\SmartChama\src\app\admin",
    r"c:\Users\Lenny\OneDrive\Desktop\SmartChama\src\app\dashboard"
]

for base_dir in target_dirs:
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                # Skip profile page as we did it manually and it has a dark section
                if file == 'page.tsx' and 'profile' in root:
                    continue
                filepath = os.path.join(root, file)
                fix_file(filepath)

print("Replacement complete for admin and dashboard files.")
