import os
import json
import re

def has_korean(text):
    if not isinstance(text, str):
        return False
    return bool(re.search('[가-힣]', text))

locales_dir = os.path.join(os.getcwd(), 'src', 'locales')
files = [f for f in os.listdir(locales_dir) if f.endswith('.json') and f != 'ko.json']

def check_obj(obj, path, lang):
    results = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            results.extend(check_obj(v, f"{path}.{k}", lang))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            results.extend(check_obj(v, f"{path}[{i}]", lang))
    elif isinstance(obj, str):
        if has_korean(obj):
            results.append(f"[{lang}] {path}: {obj}")
    return results

all_issues = []
for file in files:
    file_path = os.path.join(locales_dir, file)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        issues = check_obj(data, '', file)
        all_issues.extend(issues)

if all_issues:
    print(f"Found {len(all_issues)} Korean entries in non-Korean files:")
    for issue in all_issues:
        print(issue)
else:
    print("Clean! No Korean found in non-Korean locale files.")
