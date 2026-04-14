import json
import collections
import os

def cleanup_json(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    try:
        data = json.loads(content, object_pairs_hook=collections.OrderedDict)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Successfully cleaned up JSON duplicates.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Use the absolute path provided in the environment/metadata
    target_path = r'd:\study\jh\project_ara\src\locales\ko.json'
    cleanup_json(target_path)
