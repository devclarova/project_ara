const fs = require('fs');
const path = require('path');

const localesDir = 'd:/study/jh/project_ara/src/locales';

const signupData = {
    "title_social": "소셜 회원가입",
    "title_email": "회원가입",
    "later": "다음에 하기",
    "go_home": "홈으로",
    "step1_title": "회원가입 동의",
    "step1_desc": "서비스 이용을 위해 약관에 동의해주세요.",
    "agree_all": "전체 동의",
    "agree_terms": "이용약관 동의",
    "agree_privacy": "개인정보처리방침 동의",
    "agree_age": "만 14세 이상입니다",
    "agree_marketing": "마케팅 정보 수신 동의(선택)",
    "next_step": "다음 단계",
    "step2_title": "회원 정보 입력",
    "label_email": "이메일",
    "label_password": "비밀번호",
    "label_password_confirm": "비밀번호 확인",
    "label_nickname": "닉네임",
    "error_email_taken": "해당 이메일은 이미 사용 중입니다.",
    "error_nickname_taken": "해당 닉네임은 이미 사용 중입니다.",
    "error_email_check_retry": "이메일 중복체크를 다시 시도해주세요.",
    "error_nickname_check_retry": "닉네임 중복체크를 다시 시도해주세요.",
    "nickname_detected_lang": "감지된 언어:",
    "nickname_lang_unknown": "알 수 없음",
    "nickname_hint": "길이 {min}~{max}자, 언더바 최대 2개",
    "image_size_hint": "최대 2MB · JPG/PNG/GIF",
    "step_agreement": "동의",
    "step_info": "정보 입력",
    "step_profile": "프로필",
    "stepper_aria": "회원가입 단계",
    "detail_view": "상세보기",
    "required_mark": "(필수)",
    "checking": "확인 중...",
    "check_duplicate": "중복확인",
    "available": "사용 가능합니다.",
    "already_in_use": "이미 사용 중입니다.",
    "gender_male": "남성",
    "gender_female": "여성",
    "label_gender": "성별",
    "error_gender_required": "성별을 선택해주세요.",
    "label_birth": "생년월일",
    "error_birth_required": "생년월일을 입력해주세요.",
    "calendar_alt": "달력",
    "label_country": "국적",
    "error_country_required": "국적을 선택해주세요.",
    "lang_korean": "한국어",
    "lang_english": "영어",
    "lang_japanese": "일본어",
    "lang_chinese": "중국어",
    "lang_russian": "러시아어",
    "lang_vietnamese": "베트남어",
    "lang_bengali": "벵골어",
    "lang_arabic": "아랍어",
    "lang_hindi": "힌디어",
    "lang_thai": "태국어",
    "lang_spanish": "스페인어",
    "lang_french": "프랑스어",
    "lang_portuguese": "포르투갈어",
    "lang_portuguese_brazil": "브라질 포르투갈어",
    "lang_german": "독일어",
    "lang_finnish": "핀란드어",
    "btn_previous": "이전",
    "btn_next_step": "다음 단계"
};

// 영어 fallback (다른 언어용)
const signupDataEn = {
    ...signupData,
    "title_social": "Social Sign Up",
    "title_email": "Sign Up",
    "later": "Do it later",
    "go_home": "Go Home",
    "step1_title": "Sign Up Agreement",
    "step1_desc": "Please agree to the terms to use the service.",
    "agree_all": "Agree to All",
    "agree_terms": "Agree to Terms of Service",
    "agree_privacy": "Agree to Privacy Policy",
    "agree_age": "I am 14 years or older",
    "agree_marketing": "Agree to receive marketing information (Optional)",
    "next_step": "Next Step",
    "step2_title": "Enter Your Information",
    "label_email": "Email",
    "label_password": "Password",
    "label_password_confirm": "Confirm Password",
    "label_nickname": "Nickname",
    "error_email_taken": "This email is already in use.",
    "error_nickname_taken": "This nickname is already in use.",
    "error_email_check_retry": "Please try the email duplicate check again.",
    "error_nickname_check_retry": "Please try the nickname duplicate check again.",
    "nickname_detected_lang": "Detected language:",
    "nickname_lang_unknown": "Unknown",
    "nickname_hint": "Length {min}~{max} characters, max 2 underscores",
    "image_size_hint": "Max 2MB · JPG/PNG/GIF",
    "step_agreement": "Agreement",
    "step_info": "Information",
    "step_profile": "Profile",
    "stepper_aria": "Sign Up Steps",
    "detail_view": "View Details",
    "required_mark": "(Required)",
    "checking": "Checking...",
    "check_duplicate": "Check",
    "available": "Available.",
    "already_in_use": "Already in use.",
    "gender_male": "Male",
    "gender_female": "Female",
    "label_gender": "Gender",
    "error_gender_required": "Please select gender.",
    "label_birth": "Date of Birth",
    "error_birth_required": "Please enter date of birth.",
    "calendar_alt": "Calendar",
    "label_country": "Country",
    "error_country_required": "Please select country.",
    "lang_korean": "Korean",
    "lang_english": "English",
    "lang_japanese": "Japanese",
    "lang_chinese": "Chinese",
    "lang_russian": "Russian",
    "lang_vietnamese": "Vietnamese",
    "lang_bengali": "Bengali",
    "lang_arabic": "Arabic",
    "lang_hindi": "Hindi",
    "lang_thai": "Thai",
    "lang_spanish": "Spanish",
    "lang_french": "French",
    "lang_portuguese": "Portuguese",
    "lang_portuguese_brazil": "Brazilian Portuguese",
    "lang_german": "German",
    "lang_finnish": "Finnish",
    "btn_previous": "Previous",
    "btn_next_step": "Next Step"
};

const profileExtraDataKo = {
    "profile_optional": "프로필 설정 (선택)",
    "profile_image": "프로필 사진",
    "select_image": "이미지 선택",
    "bio": "자기소개",
    "bio_placeholder": "나를 표현하는 한 마디를 적어보세요.",
    "edit_profile": "프로필 편집"
};

const profileExtraDataEn = {
    "profile_optional": "Profile Settings (Optional)",
    "profile_image": "Profile Image",
    "select_image": "Select Image",
    "bio": "Bio",
    "bio_placeholder": "Write a short bio about yourself.",
    "edit_profile": "Edit Profile"
};

const targetLangs = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'ru', 'vi', 'bn', 'ar', 'hi', 'th', 'pt', 'pt-br', 'fi'];

targetLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(content);
            let updated = false;

            // Data selection
            const sData = (lang === 'ko') ? signupData : signupDataEn;
            const pData = (lang === 'ko') ? profileExtraDataKo : profileExtraDataEn;

            // 1. Merge signup
            if (!json.signup) {
                json.signup = sData;
                updated = true;
            } else {
                // Merge missing keys in signup
                Object.keys(sData).forEach(key => {
                     if (!json.signup[key]) {
                        json.signup[key] = sData[key];
                        updated = true;
                     }
                });
            }

            // 2. Merge profile
            if (!json.profile) {
                json.profile = {};
            }
            Object.keys(pData).forEach(key => {
                if (!json.profile[key]) {
                    json.profile[key] = pData[key];
                    updated = true;
                }
            });

            if (updated) {
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
                console.log(`Updated ${lang}.json`);
            } else {
                console.log(`Checked ${lang}.json`);
            }
        } catch (e) {
            console.error(`Error processing ${lang}.json: ${e.message}`);
        }
    } else {
        console.log(`File not found: ${lang}.json`);
    }
});
