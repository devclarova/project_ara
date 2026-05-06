import os

def replace_bytes(file_path, target_str, replacement_str):
    try:
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return
        
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

files = [
    r'src/pages/community/feature/NotificationCard.tsx',
    r'src/pages/community/feature/Sidebar.tsx',
    r'src/pages/community/feature/TrendsPanel.tsx',
    r'src/pages/community/feature/TweetCard.tsx',
    r'src/pages/community/feature/ComposeBox.tsx',
    r'src/pages/community/feature/TweetModal.tsx',
    r'src/pages/community/tweet/components/InlineReplyEditor.tsx',
    r'src/pages/community/tweet/components/ReplyCard.tsx',
    r'src/pages/community/tweet/components/TweetDetailCard.tsx',
    r'src/pages/community/tweet/components/ReplyInput.tsx',
    r'src/pages/community/tweet/components/ReplyComposer.tsx',
    r'src/pages/admin/UserManagement.tsx',
    r'src/pages/admin/components/UserProfileModal.tsx',
    r'src/pages/admin/components/AdminUserActivityModal.tsx',
    r'src/components/common/Header.tsx',
    r'src/components/common/NotificationToast.tsx',
    r'src/components/common/SnsInlineEditor.tsx'
]

base_path = r'd:\study\jh\project_ara'
target = '/default-avatar.svg'
replacement = '/images/ara_basic_profile.png'

for f in files:
    full_path = os.path.join(base_path, f.replace('/', '\\'))
    replace_bytes(full_path, target, replacement)
