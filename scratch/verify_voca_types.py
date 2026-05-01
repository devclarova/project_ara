import os
import json

locales_dir = os.path.join(os.getcwd(), 'src', 'locales')
files = [f for f in os.listdir(locales_dir) if f.endswith('.json')]

def verify_voca(data, file_name):
    issues = []
    study = data.get('study', {})
    if not isinstance(study, dict):
        return [f"study is not a dict"]
    
    voca = study.get('voca', {})
    if not isinstance(voca, dict):
        return [f"study.voca is not a dict (type: {type(voca)})"]
    
    for k, v in voca.items():
        if k == 'delete_confirm':
            if not isinstance(v, dict):
                issues.append(f"study.voca.delete_confirm is not a dict")
            else:
                for subk, subv in v.items():
                    if not isinstance(subv, str):
                        issues.append(f"study.voca.delete_confirm.{subk} is not a string (type: {type(subv)})")
        else:
            if not isinstance(v, str):
                issues.append(f"study.voca.{k} is not a string (type: {type(v)})")
    
    return issues

all_passed = True
for file in files:
    file_path = os.path.join(locales_dir, file)
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        issues = verify_voca(data, file)
        if issues:
            print(f"--- Issues in {file} ---")
            for issue in issues:
                print(f"  - {issue}")
            all_passed = False

if all_passed:
    print("Verification Passed: All study.voca keys are correctly typed.")
else:
    print("Verification Failed: Type errors found.")
