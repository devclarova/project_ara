#!/bin/bash
# Add missing auth translations to ja.json after line 90

# Japanese auth section (after check_verification_email)
cat >> temp_ja_auth.txt << 'EOF'
,
    "session_expired": "セッションが期限切れです",
    "avatar_upload_failed": "プロフィール画像のアップロードに失敗しました",
    "profile_save_failed": "プロフィールの保存に失敗しました",
    "network_error": "ネットワークエラーが発生しました",
    "previous": "前へ",
    "signing_up": "登録中...",
    "signup_complete": "登録完了",
    "signup_complete_message": "会員登録が完了しました！",
    "service_ready": "サービスをご利用いただけます。",
    "start_now": "始める",
    "go_home": "ホームへ",
    "signup_error": "登録中にエラーが発生しました"
EOF

echo "Temporary files created. Please manually add these translations to the respective language files."
echo "For ja.json: Add after line 90 (after check_verification_email)"
