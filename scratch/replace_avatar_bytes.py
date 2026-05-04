import os

def replace_bytes(file_path, target_str, replacement_str):
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        target = target_str.encode('ascii')
        replacement = replacement_str.encode('ascii')
        
        new_content = content.replace(target, replacement)
        
        if new_content != content:
            with open(file_path, 'wb') as f:
                f.write(new_content)
            print(f"Successfully replaced bytes in {file_path}")
        else:
            print(f"Target not found in {file_path}")
    except Exception as e:
        print(f"Error in {file_path}: {e}")

file_path = r'd:\study\jh\project_ara\src\pages\community\tweet\TweetDetail.tsx'
replace_bytes(file_path, '/default-avatar.svg', '/images/ara_basic_profile.png')
