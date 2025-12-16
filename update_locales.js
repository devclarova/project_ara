const fs = require('fs');
const path = require('path');

const localesDir = 'd:/study/jh/project_ara/src/locales';
const sourceFile = path.join(localesDir, 'ko.json'); // ko.json이 가장 완벽하므로 이를 기준으로 함, 하지만 번역은 영어로 채워야 함. 
// 사용자 요청은 "키값으로 출력되는거 어떻게 할래?" -> 영어라도 채워넣어야 함.
// 앞서 en.json 복구가 우선임. en.json 복구 후 en.json의 signup을 가져다 쓰거나, 
// 하드코딩된 영어 데이터를 사용하는게 나음.

const signupData = {
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

const targetLangs = ['zh', 'es', 'fr', 'de', 'ru', 'vi', 'bn', 'ar', 'hi', 'th', 'pt', 'pt-br', 'fi'];

targetLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(content);
            if (!json.signup) {
                json.signup = signupData;
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
                console.log(`Updated ${lang}.json`);
            } else {
                console.log(`Skipped ${lang}.json (Already has signup)`);
            }
        } catch (e) {
            console.error(`Error processing ${lang}.json: ${e.message}`);
        }
    } else {
        console.log(`File not found: ${lang}.json`);
    }
});
