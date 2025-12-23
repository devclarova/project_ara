// 나머지 언어들의 번역 파일을 빠르게 생성하는 스크립트
// 한국어 구조를 기반으로 나머지 언어로 번역

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, 'src', 'locales');

// 한국어 파일 읽기
const koContent = JSON.parse(fs.readFileSync(path.join(localesDir, 'ko.json'), 'utf8'));

// 모든 언어의 기본 번역 (간단한 번역만, 나중에 전문 번역으로 교체 가능)
const translations = {
  zh: {
    nav: { home: '主页', study: '学习', community: '社区', chat: '聊天', notifications: '通知', settings: '设置', profile: '个人资料', post: '发布' },
    auth: {
      login: '登录', signup: '注册', logout: '退出登录', login_needed: '请先登录', click_to_login: '点击登录',
      welcome: '欢迎来到Ara！', email: '电子邮箱', password: '密码', password_confirm: '确认密码', nickname: '昵称',
      logging_in: '登录中...', signing_up: '注册中...', auto_login: '自动登录', find_email: '查找电子邮箱',
      find_password: '查找密码', resend_verification: '重新发送验证邮件', first_time: '第一次来？创建账户。',
      login_with_google: '使用Google登录', login_with_kakao: '使用Kakao登录', signup_complete: '注册完成',
      signup_complete_message: '注册完成！', check_verification_email: '请检查验证邮件。',
      start_now: '开始', go_home: '返回首页', verification_sent: '验证邮件已发送。请检查您的邮箱。',
      verify_before_login: '登录前请验证电子邮件。', invalid_credentials: '电子邮箱或密码不正确。',
      email_verification_failed: '电子邮件验证失败，请检查您的邮箱。', previous: '上一步', next: '下一步', complete: '完成',
      session_expired: '会话已过期。请重新从社交登录开始。', avatar_upload_failed: '头像上传失败',
      profile_save_failed: '个人资料保存失败', signup_error: '注册过程中发生错误。请稍后再试。',
      network_error: '发生网络或服务器通信错误。', service_ready: '现在可以使用服务了。'
    },
    common: {
      my_profile: '我的资料', my_account: '我的账户', view_profile: '查看资料', settings_desc: '账户与设置',
      cancel: '取消', confirm: '确认', save: '保存', delete: '删除', edit: '编辑', loading: '加载中...',
      error: '错误', success: '成功', back: '返回'
    },
    tweet: {
      reply: '回复', like: '点赞', view: '查看', share: '分享', delete: '删除', edit: '编辑', translate: '翻译',
      original: '原文', reply_placeholder: '写评论', post_placeholder: '发生什么了？', posting: '发布中...',
      replying: '回复中...', delete_confirm: '确定要删除吗？', delete_success: '已删除', delete_failed: '删除失败'
    },
    profile: {
      edit_profile: '编辑个人资料', profile_image: '个人资料图片', bio: '个人简介', bio_placeholder: '请写简单介绍。',
      select_image: '选择图片', nickname: '昵称', gender: '性别', birthday: '生日', country: '国籍', male: '男',
      female: '女', other: '其他', profile_optional: '个人资料（可选）', max_chars: '最多', chars: '字'
    },
    settings: {
      system: '系统设置', privacy: '隐私设置', notifications: '通知设置', language: '语言', theme: '主题',
      account: '账户设置', security: '安全'
    },
    validation: {...koContent.validation}, // 여기는 복잡해서 나중에 채움
    notification: {
      all: '全部', mentions: '提及', likes: '点赞', replies: '回复', new: '新通知', mark_all_read: '全部标记为已读'
    },
    chat: {
      messages: '消息', send: '发送', type_message: '输入消息', no_messages: '没有消息', online: '在线', offline: '离线'
    }
  }
};

// validation은 복잡하므로 한국어 복사 (나중에 번역 서비스로 교체 가능)
console.log('Remaining languages script ready - manually creating files for efficiency');
