const fs = require('fs');
const path = require('path');

const localesDir = 'd:/study/jh/project_ara/src/locales';

// 영어 데이터 (Fallback)
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

const profileExtraData = {
    "profile_optional": "Profile Settings (Optional)",
    "profile_image": "Profile Image",
    "select_image": "Select Image",
    "bio": "Bio",
    "bio_placeholder": "Write a short bio about yourself."
};

const targetLangs = ['en', 'ja', 'zh', 'es', 'fr', 'de', 'ru', 'vi', 'bn', 'ar', 'hi', 'th', 'pt', 'pt-br', 'fi'];

targetLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            let json = JSON.parse(content);
            let updated = false;

            // 1. Merge signup section if missing
            if (!json.signup) {
                json.signup = signupData;
                updated = true;
            }

            // 2. Merge missing keys in profile section
            if (!json.profile) {
                json.profile = {};
            }
            Object.keys(profileExtraData).forEach(key => {
                if (!json.profile[key]) {
                    json.profile[key] = profileExtraData[key];
                    updated = true;
                }
            });

            if (updated) {
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
                console.log(`Updated ${lang}.json`);
            } else {
                console.log(`Skipped ${lang}.json (No changes needed)`);
            }
        } catch (e) {
            console.error(`Error processing ${lang}.json: ${e.message}`);
        }
    } else {
        console.log(`File not found: ${lang}.json`);
    }
});
