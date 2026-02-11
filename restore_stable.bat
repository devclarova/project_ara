@echo off
echo [ARA] 안정 버전(순수 상태)으로 복구를 시작합니다...

set BASE_DIR=%~dp0
set SRC_DIR=%BASE_DIR%src
set BAK_DIR=%BASE_DIR%backup\stable

if not exist "%BAK_DIR%" (
    echo [에러] 백업 폴더를 찾을 수 없습니다.
    pause
    exit /b
)

copy /Y "%BAK_DIR%\GlobalNotificationListener.tsx" "%SRC_DIR%\components\common\"
copy /Y "%BAK_DIR%\SnsInlineEditor.tsx" "%SRC_DIR%\components\common\"
copy /Y "%BAK_DIR%\ReplyCard.tsx" "%SRC_DIR%\pages\community\tweet\components\"
copy /Y "%BAK_DIR%\MessageInput.tsx" "%SRC_DIR%\components\chat\common\"
copy /Y "%BAK_DIR%\LandingPage.tsx" "%SRC_DIR%\pages\"

echo.
echo [완료] 모든 파일이 안정 버전으로 복구되었습니다.
pause
