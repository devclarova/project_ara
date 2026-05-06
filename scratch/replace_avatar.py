import os

def replace_in_file(file_path, target, replacement):
    encodings = ['utf-8-sig', 'utf-8', 'cp949', 'euc-kr', 'cp1252']
    content_bytes = None
    with open(file_path, 'rb') as f:
        content_bytes = f.read()
    
    for enc in encodings:
        try:
            text = content_bytes.decode(enc)
            print(f"Detected encoding: {enc} for {file_path}")
            new_text = text.replace(target, replacement)
            new_content = new_text.encode(enc)
            with open(file_path, 'wb') as f:
                f.write(new_content)
            print(f"Successfully replaced in {file_path}")
            return
        except Exception:
            continue
    print(f"Failed to decode {file_path} with known encodings")

file_path = r'd:\study\jh\project_ara\src\pages\community\tweet\TweetDetail.tsx'
replace_in_file(file_path, '/default-avatar.svg', '/images/ara_basic_profile.png')
