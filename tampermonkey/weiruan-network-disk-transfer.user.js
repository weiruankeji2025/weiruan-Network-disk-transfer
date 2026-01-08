// ==UserScript==
// @name         威软网盘转存工具
// @namespace    https://github.com/weiruankeji2025/weiruan-Network-disk-transfer
// @version      1.1.0
// @description  网盘高速互相转存工具 - 支持百度网盘、阿里云盘、天翼云盘、夸克网盘、迅雷云盘、115网盘、蓝奏云、和彩云、123云盘等主流网盘
// @author       威软网盘转存工具
// @match        *://pan.baidu.com/*
// @match        *://yun.baidu.com/*
// @match        *://www.aliyundrive.com/*
// @match        *://www.alipan.com/*
// @match        *://cloud.189.cn/*
// @match        *://pan.quark.cn/*
// @match        *://pan.xunlei.com/*
// @match        *://115.com/*
// @match        *://*.lanzou.com/*
// @match        *://*.lanzoui.com/*
// @match        *://*.lanzoux.com/*
// @match        *://*.lanzouq.com/*
// @match        *://yun.139.com/*
// @match        *://www.123pan.com/*
// @match        *://www.123865.com/*
// @match        *://drive.uc.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=baidu.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_cookie
// @connect      pan.baidu.com
// @connect      api.aliyundrive.com
// @connect      api.alipan.com
// @connect      cloud.189.cn
// @connect      drive.quark.cn
// @connect      pan.xunlei.com
// @connect      115.com
// @connect      lanzou.com
// @connect      yun.139.com
// @connect      www.123pan.com
// @connect      drive.uc.cn
// @connect      *
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置信息 ====================
    const CONFIG = {
        appName: '威软网盘转存工具',
        version: '1.1.0',
        author: '威软网盘转存工具',
        supportedDisks: [
            { name: '百度网盘', domain: ['pan.baidu.com', 'yun.baidu.com'], color: '#06a7ff', type: 'baidu' },
            { name: '阿里云盘', domain: ['www.aliyundrive.com', 'www.alipan.com'], color: '#ff6a00', type: 'aliyun' },
            { name: '天翼云盘', domain: ['cloud.189.cn'], color: '#21a5de', type: 'tianyi' },
            { name: '夸克网盘', domain: ['pan.quark.cn'], color: '#536dfe', type: 'quark' },
            { name: '迅雷云盘', domain: ['pan.xunlei.com'], color: '#0078d4', type: 'xunlei' },
            { name: '115网盘', domain: ['115.com'], color: '#2196f3', type: '115' },
            { name: '蓝奏云', domain: ['lanzou.com', 'lanzoui.com', 'lanzoux.com', 'lanzouq.com'], color: '#4285f4', type: 'lanzou' },
            { name: '和彩云', domain: ['yun.139.com'], color: '#ff5722', type: 'hecaiyun' },
            { name: '123云盘', domain: ['www.123pan.com', 'www.123865.com'], color: '#409eff', type: '123pan' },
            { name: 'UC网盘', domain: ['drive.uc.cn'], color: '#ff9800', type: 'uc' }
        ]
    };

    // ==================== 样式定义 ====================
    const STYLES = `
        .wr-transfer-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            min-width: 480px;
            max-width: 520px;
            overflow: hidden;
            animation: wr-fadeIn 0.3s ease-out;
        }

        @keyframes wr-fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @keyframes wr-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .wr-panel-header {
            background: rgba(255,255,255,0.15);
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .wr-panel-title {
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .wr-panel-title svg { width: 24px; height: 24px; }

        .wr-panel-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .wr-panel-close:hover {
            background: rgba(255,255,255,0.3);
            transform: rotate(90deg);
        }

        .wr-panel-body {
            padding: 20px;
            background: #fff;
            max-height: 70vh;
            overflow-y: auto;
        }

        .wr-section {
            margin-bottom: 20px;
        }

        .wr-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .wr-section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }

        .wr-login-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 16px;
        }

        .wr-login-status.logged-in {
            background: #e8f5e9;
            border: 1px solid #a5d6a7;
        }

        .wr-login-status.logged-out {
            background: #fff3e0;
            border: 1px solid #ffcc80;
        }

        .wr-login-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .wr-login-dot.online { background: #4caf50; }
        .wr-login-dot.offline { background: #ff9800; }

        .wr-login-text {
            flex: 1;
            font-size: 13px;
            color: #333;
        }

        .wr-login-btn {
            padding: 6px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .wr-login-btn:hover {
            transform: scale(1.05);
        }

        .wr-disk-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
        }

        .wr-disk-item {
            padding: 10px 6px;
            border: 2px solid #e8e8e8;
            border-radius: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
            background: #fafafa;
            position: relative;
        }

        .wr-disk-item:hover {
            border-color: #667eea;
            background: #f0f4ff;
            transform: translateY(-2px);
        }

        .wr-disk-item.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .wr-disk-item.logged-in::after {
            content: '✓';
            position: absolute;
            top: 4px;
            right: 4px;
            width: 16px;
            height: 16px;
            background: #4caf50;
            color: #fff;
            border-radius: 50%;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .wr-disk-item.logged-out::after {
            content: '!';
            position: absolute;
            top: 4px;
            right: 4px;
            width: 16px;
            height: 16px;
            background: #ff9800;
            color: #fff;
            border-radius: 50%;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .wr-disk-name {
            font-size: 11px;
            color: #333;
            font-weight: 500;
            margin-top: 6px;
        }

        .wr-disk-icon {
            width: 28px;
            height: 28px;
            margin: 0 auto;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #fff;
        }

        .wr-input-group { margin-bottom: 16px; }

        .wr-input-label {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
            display: block;
        }

        .wr-input {
            width: 100%;
            padding: 12px 14px;
            border: 2px solid #e8e8e8;
            border-radius: 10px;
            font-size: 14px;
            transition: all 0.2s;
            box-sizing: border-box;
        }

        .wr-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .wr-btn {
            padding: 14px 28px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .wr-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            width: 100%;
        }

        .wr-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .wr-btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .wr-status-bar {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
        }

        .wr-status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .wr-status-row:last-child { margin-bottom: 0; }

        .wr-status-label {
            font-size: 13px;
            color: #666;
        }

        .wr-status-value {
            font-size: 13px;
            font-weight: 600;
            color: #333;
        }

        .wr-progress-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 12px;
        }

        .wr-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .wr-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999999;
            animation: wr-slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        @keyframes wr-slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .wr-toast-success { background: linear-gradient(135deg, #00b894, #00cec9); }
        .wr-toast-error { background: linear-gradient(135deg, #ff6b6b, #ee5a5a); }
        .wr-toast-info { background: linear-gradient(135deg, #667eea, #764ba2); }
        .wr-toast-warning { background: linear-gradient(135deg, #fdcb6e, #f39c12); }

        .wr-float-btn {
            position: fixed;
            right: 20px;
            bottom: 100px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            cursor: pointer;
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            border: none;
        }

        .wr-float-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 28px rgba(102, 126, 234, 0.5);
        }

        .wr-float-btn svg {
            width: 28px;
            height: 28px;
            fill: #fff;
        }

        .wr-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999998;
        }

        .wr-file-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            margin-top: 10px;
        }

        .wr-file-item {
            padding: 10px 14px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        }

        .wr-file-item:last-child { border-bottom: none; }

        .wr-file-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .wr-file-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #333;
        }

        .wr-file-size {
            color: #999;
            font-size: 12px;
        }

        .wr-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: wr-spin 0.8s linear infinite;
        }

        .wr-footer {
            padding: 12px 20px;
            background: #f8f9fa;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e8e8e8;
        }

        .wr-tabs {
            display: flex;
            border-bottom: 2px solid #e8e8e8;
            margin-bottom: 16px;
        }

        .wr-tab {
            flex: 1;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            color: #666;
            font-weight: 500;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
        }

        .wr-tab:hover { color: #667eea; }

        .wr-tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }

        .wr-tab-content { display: none; }
        .wr-tab-content.active { display: block; }

        .wr-history-item {
            padding: 12px;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .wr-history-info { flex: 1; }

        .wr-history-title {
            font-size: 14px;
            color: #333;
            font-weight: 500;
        }

        .wr-history-meta {
            font-size: 12px;
            color: #999;
            margin-top: 4px;
        }

        .wr-history-status {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .wr-history-status.success {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .wr-history-status.failed {
            background: #ffebee;
            color: #c62828;
        }

        .wr-tip-box {
            background: #fff3e0;
            border: 1px solid #ffcc80;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #e65100;
        }

        .wr-tip-box a {
            color: #667eea;
            text-decoration: underline;
        }
    `;

    // ==================== 工具函数 ====================
    const Utils = {
        getCurrentDisk: () => {
            const host = window.location.host;
            for (const disk of CONFIG.supportedDisks) {
                if (disk.domain.some(d => host.includes(d))) {
                    return disk;
                }
            }
            return null;
        },

        formatSize: (bytes) => {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        formatTime: (ms) => {
            if (ms < 1000) return ms + 'ms';
            if (ms < 60000) return (ms / 1000).toFixed(2) + 's';
            return (ms / 60000).toFixed(2) + 'min';
        },

        generateId: () => 'wr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),

        parseShareLink: (url) => {
            const patterns = [
                { name: '百度网盘', regex: /pan\.baidu\.com\/s\/([a-zA-Z0-9_-]+)/, type: 'baidu' },
                { name: '百度网盘', regex: /pan\.baidu\.com\/share\/init\?surl=([a-zA-Z0-9_-]+)/, type: 'baidu', prefix: '1' },
                { name: '阿里云盘', regex: /(?:aliyundrive|alipan)\.com\/s\/([a-zA-Z0-9]+)/, type: 'aliyun' },
                { name: '天翼云盘', regex: /cloud\.189\.cn\/(?:web\/share\?code=|t\/)([a-zA-Z0-9]+)/, type: 'tianyi' },
                { name: '夸克网盘', regex: /pan\.quark\.cn\/s\/([a-zA-Z0-9]+)/, type: 'quark' },
                { name: '迅雷云盘', regex: /pan\.xunlei\.com\/s\/([a-zA-Z0-9_-]+)/, type: 'xunlei' },
                { name: '115网盘', regex: /115\.com\/s\/([a-zA-Z0-9]+)/, type: '115' },
                { name: '蓝奏云', regex: /lanzou[a-z]*\.com\/([a-zA-Z0-9]+)/, type: 'lanzou' },
                { name: '和彩云', regex: /yun\.139\.com\/link\/([a-zA-Z0-9]+)/, type: 'hecaiyun' },
                { name: '123云盘', regex: /(?:123pan|123865)\.com\/s\/([a-zA-Z0-9_-]+)/, type: '123pan' },
                { name: 'UC网盘', regex: /drive\.uc\.cn\/s\/([a-zA-Z0-9]+)/, type: 'uc' }
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern.regex);
                if (match) {
                    return {
                        name: pattern.name,
                        type: pattern.type,
                        shareId: (pattern.prefix || '') + match[1],
                        url: url
                    };
                }
            }
            return null;
        },

        saveHistory: (record) => {
            const history = GM_getValue('transfer_history', []);
            history.unshift(record);
            if (history.length > 50) history.pop();
            GM_setValue('transfer_history', history);
        },

        getHistory: () => GM_getValue('transfer_history', []),

        getCookie: (name) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        }
    };

    // ==================== 登录检测模块 ====================
    const LoginChecker = {
        // 存储登录状态
        loginStatus: {},

        // 检测百度网盘登录状态
        checkBaidu: () => {
            return new Promise((resolve) => {
                // 方法1: 检查页面上的用户信息
                const bdstoken = document.querySelector('input[name="bdstoken"]')?.value ||
                                (typeof window.locals !== 'undefined' ? window.locals.bdstoken : null);

                if (bdstoken) {
                    LoginChecker.loginStatus.baidu = {
                        isLoggedIn: true,
                        bdstoken: bdstoken,
                        username: document.querySelector('.user-name')?.textContent || '已登录'
                    };
                    resolve(true);
                    return;
                }

                // 方法2: 通过API检测
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://pan.baidu.com/api/loginStatus?clienttype=0&web=1',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.errno === 0 && data.login_info) {
                                LoginChecker.loginStatus.baidu = {
                                    isLoggedIn: true,
                                    username: data.login_info.username || '已登录',
                                    uk: data.login_info.uk
                                };
                                resolve(true);
                            } else {
                                LoginChecker.loginStatus.baidu = { isLoggedIn: false };
                                resolve(false);
                            }
                        } catch (e) {
                            LoginChecker.loginStatus.baidu = { isLoggedIn: false };
                            resolve(false);
                        }
                    },
                    onerror: () => {
                        LoginChecker.loginStatus.baidu = { isLoggedIn: false };
                        resolve(false);
                    }
                });
            });
        },

        // 检测阿里云盘登录状态
        checkAliyun: () => {
            return new Promise((resolve) => {
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        const tokenData = JSON.parse(token);
                        if (tokenData.access_token && tokenData.expire_time > Date.now()) {
                            LoginChecker.loginStatus.aliyun = {
                                isLoggedIn: true,
                                accessToken: tokenData.access_token,
                                refreshToken: tokenData.refresh_token,
                                driveId: tokenData.default_drive_id,
                                username: tokenData.nick_name || tokenData.user_name || '已登录'
                            };
                            resolve(true);
                            return;
                        }
                    }
                } catch (e) {}

                LoginChecker.loginStatus.aliyun = { isLoggedIn: false };
                resolve(false);
            });
        },

        // 检测夸克网盘登录状态
        checkQuark: () => {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://drive.quark.cn/1/clouddrive/member/info?pr=ucpro&fr=pc',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.status === 200 && data.data) {
                                LoginChecker.loginStatus.quark = {
                                    isLoggedIn: true,
                                    username: data.data.nickname || '已登录',
                                    memberId: data.data.member_id
                                };
                                resolve(true);
                            } else {
                                LoginChecker.loginStatus.quark = { isLoggedIn: false };
                                resolve(false);
                            }
                        } catch (e) {
                            LoginChecker.loginStatus.quark = { isLoggedIn: false };
                            resolve(false);
                        }
                    },
                    onerror: () => {
                        LoginChecker.loginStatus.quark = { isLoggedIn: false };
                        resolve(false);
                    }
                });
            });
        },

        // 检测天翼云盘登录状态
        checkTianyi: () => {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://cloud.189.cn/api/portal/getUserBriefInfo.action',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.res_code === 0) {
                                LoginChecker.loginStatus.tianyi = {
                                    isLoggedIn: true,
                                    username: data.nickName || '已登录',
                                    userId: data.userId
                                };
                                resolve(true);
                            } else {
                                LoginChecker.loginStatus.tianyi = { isLoggedIn: false };
                                resolve(false);
                            }
                        } catch (e) {
                            LoginChecker.loginStatus.tianyi = { isLoggedIn: false };
                            resolve(false);
                        }
                    },
                    onerror: () => {
                        LoginChecker.loginStatus.tianyi = { isLoggedIn: false };
                        resolve(false);
                    }
                });
            });
        },

        // 检测123云盘登录状态
        check123pan: () => {
            return new Promise((resolve) => {
                const token = localStorage.getItem('authorToken') || Utils.getCookie('authorToken');
                if (token) {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://www.123pan.com/api/user/info',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0 && data.data) {
                                    LoginChecker.loginStatus['123pan'] = {
                                        isLoggedIn: true,
                                        username: data.data.nickname || '已登录',
                                        token: token
                                    };
                                    resolve(true);
                                } else {
                                    LoginChecker.loginStatus['123pan'] = { isLoggedIn: false };
                                    resolve(false);
                                }
                            } catch (e) {
                                LoginChecker.loginStatus['123pan'] = { isLoggedIn: false };
                                resolve(false);
                            }
                        },
                        onerror: () => {
                            LoginChecker.loginStatus['123pan'] = { isLoggedIn: false };
                            resolve(false);
                        }
                    });
                } else {
                    LoginChecker.loginStatus['123pan'] = { isLoggedIn: false };
                    resolve(false);
                }
            });
        },

        // 检测115网盘登录状态
        check115: () => {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://my.115.com/?ct=ajax&ac=nav',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.data && data.data.user_id) {
                                LoginChecker.loginStatus['115'] = {
                                    isLoggedIn: true,
                                    username: data.data.user_name || '已登录',
                                    userId: data.data.user_id
                                };
                                resolve(true);
                            } else {
                                LoginChecker.loginStatus['115'] = { isLoggedIn: false };
                                resolve(false);
                            }
                        } catch (e) {
                            LoginChecker.loginStatus['115'] = { isLoggedIn: false };
                            resolve(false);
                        }
                    },
                    onerror: () => {
                        LoginChecker.loginStatus['115'] = { isLoggedIn: false };
                        resolve(false);
                    }
                });
            });
        },

        // 检测迅雷云盘登录状态
        checkXunlei: () => {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://pan.xunlei.com/api/pan/user/info',
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.code === 0 && data.data) {
                                LoginChecker.loginStatus.xunlei = {
                                    isLoggedIn: true,
                                    username: data.data.name || '已登录'
                                };
                                resolve(true);
                            } else {
                                LoginChecker.loginStatus.xunlei = { isLoggedIn: false };
                                resolve(false);
                            }
                        } catch (e) {
                            LoginChecker.loginStatus.xunlei = { isLoggedIn: false };
                            resolve(false);
                        }
                    },
                    onerror: () => {
                        LoginChecker.loginStatus.xunlei = { isLoggedIn: false };
                        resolve(false);
                    }
                });
            });
        },

        // 检测当前网盘的登录状态
        checkCurrentDisk: async () => {
            const currentDisk = Utils.getCurrentDisk();
            if (!currentDisk) return null;

            const checkers = {
                'baidu': LoginChecker.checkBaidu,
                'aliyun': LoginChecker.checkAliyun,
                'quark': LoginChecker.checkQuark,
                'tianyi': LoginChecker.checkTianyi,
                '123pan': LoginChecker.check123pan,
                '115': LoginChecker.check115,
                'xunlei': LoginChecker.checkXunlei
            };

            if (checkers[currentDisk.type]) {
                await checkers[currentDisk.type]();
            }

            return LoginChecker.loginStatus[currentDisk.type];
        },

        // 检测所有网盘登录状态
        checkAllDisks: async () => {
            await Promise.all([
                LoginChecker.checkBaidu(),
                LoginChecker.checkAliyun(),
                LoginChecker.checkQuark(),
                LoginChecker.checkTianyi(),
                LoginChecker.check123pan(),
                LoginChecker.check115(),
                LoginChecker.checkXunlei()
            ]);
            return LoginChecker.loginStatus;
        },

        // 获取登录页面URL
        getLoginUrl: (diskType) => {
            const urls = {
                'baidu': 'https://pan.baidu.com/',
                'aliyun': 'https://www.alipan.com/',
                'quark': 'https://pan.quark.cn/',
                'tianyi': 'https://cloud.189.cn/',
                '123pan': 'https://www.123pan.com/',
                '115': 'https://115.com/',
                'xunlei': 'https://pan.xunlei.com/',
                'lanzou': 'https://lanzou.com/',
                'hecaiyun': 'https://yun.139.com/',
                'uc': 'https://drive.uc.cn/'
            };
            return urls[diskType] || '#';
        }
    };

    // ==================== 网盘API封装 ====================
    const DiskAPI = {
        // 百度网盘API
        baidu: {
            // 验证分享链接并获取文件列表
            verifyShare: async (surl, pwd = '') => {
                return new Promise((resolve, reject) => {
                    // 先验证提取码
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://pan.baidu.com/share/verify?surl=' + surl + '&t=' + Date.now(),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: 'pwd=' + pwd + '&vcode=&vcode_str=',
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0) {
                                    resolve({ randsk: data.randsk });
                                } else if (data.errno === -9) {
                                    reject(new Error('提取码错误'));
                                } else if (data.errno === -62) {
                                    reject(new Error('分享链接已失效'));
                                } else {
                                    reject(new Error(data.show_msg || '验证失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 获取分享文件列表
            getShareList: async (shareId, shareid, uk, randsk, dir = '/') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://pan.baidu.com/share/list?shareid=${shareid}&uk=${uk}&root=1&dir=${encodeURIComponent(dir)}`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0) {
                                    resolve(data.list || []);
                                } else {
                                    reject(new Error(data.errmsg || '获取文件列表失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 转存文件到自己的网盘
            saveShare: async (shareid, uk, fsidlist, path = '/') => {
                const loginInfo = LoginChecker.loginStatus.baidu;
                if (!loginInfo || !loginInfo.isLoggedIn) {
                    throw new Error('请先登录百度网盘');
                }

                // 获取bdstoken
                let bdstoken = loginInfo.bdstoken;
                if (!bdstoken) {
                    // 从页面获取
                    const match = document.body.innerHTML.match(/"bdstoken"\s*:\s*"([^"]+)"/);
                    bdstoken = match ? match[1] : '';
                }

                if (!bdstoken) {
                    throw new Error('获取bdstoken失败，请刷新页面重试');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://pan.baidu.com/share/transfer?shareid=${shareid}&from=${uk}&bdstoken=${bdstoken}&channel=chunlei&web=1&clienttype=0`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: `fsidlist=${JSON.stringify(fsidlist)}&path=${encodeURIComponent(path)}`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0) {
                                    resolve({ success: true, message: '转存成功', extra: data.extra });
                                } else if (data.errno === 12) {
                                    resolve({ success: false, message: '文件已存在' });
                                } else if (data.errno === -9) {
                                    resolve({ success: false, message: '文件不存在或已被删除' });
                                } else {
                                    resolve({ success: false, message: data.show_msg || data.errmsg || '转存失败' });
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            }
        },

        // 阿里云盘API
        aliyun: {
            // 获取分享信息
            getShareInfo: async (shareId) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({ share_id: shareId }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.share_name) {
                                    resolve(data);
                                } else {
                                    reject(new Error(data.message || '获取分享信息失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 获取share_token
            getShareToken: async (shareId, sharePwd = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/v2/share_link/get_share_token',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({ share_id: shareId, share_pwd: sharePwd }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.share_token) {
                                    resolve(data.share_token);
                                } else if (data.code === 'ShareLinkTokenInvalid') {
                                    reject(new Error('提取码错误'));
                                } else {
                                    reject(new Error(data.message || '获取分享令牌失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 获取分享文件列表
            getShareFileList: async (shareId, shareToken, parentFileId = 'root') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/adrive/v2/file/list_by_share',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-share-token': shareToken
                        },
                        data: JSON.stringify({
                            share_id: shareId,
                            parent_file_id: parentFileId,
                            limit: 100,
                            order_by: 'name',
                            order_direction: 'DESC'
                        }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.items) {
                                    resolve(data.items);
                                } else {
                                    reject(new Error(data.message || '获取文件列表失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 转存文件
            saveShare: async (shareId, shareToken, fileIds, toParentFileId = 'root') => {
                const loginInfo = LoginChecker.loginStatus.aliyun;
                if (!loginInfo || !loginInfo.isLoggedIn) {
                    throw new Error('请先登录阿里云盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/adrive/v2/batch',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${loginInfo.accessToken}`,
                            'x-share-token': shareToken
                        },
                        data: JSON.stringify({
                            requests: fileIds.map(fileId => ({
                                body: {
                                    file_id: fileId,
                                    share_id: shareId,
                                    auto_rename: true,
                                    to_parent_file_id: toParentFileId,
                                    to_drive_id: loginInfo.driveId
                                },
                                headers: { 'Content-Type': 'application/json' },
                                id: fileId,
                                method: 'POST',
                                url: '/file/copy'
                            })),
                            resource: 'file'
                        }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.responses) {
                                    const successCount = data.responses.filter(r => r.status === 201 || r.status === 200).length;
                                    resolve({
                                        success: successCount > 0,
                                        message: `成功转存 ${successCount}/${fileIds.length} 个文件`,
                                        data
                                    });
                                } else {
                                    reject(new Error(data.message || '转存失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            }
        },

        // 夸克网盘API
        quark: {
            // 获取分享token
            getShareToken: async (pwdId, passcode = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc`,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({ pwd_id: pwdId, passcode: passcode }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve(data.data);
                                } else if (data.status === 400) {
                                    reject(new Error('提取码错误'));
                                } else {
                                    reject(new Error(data.message || '获取分享信息失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 获取分享文件列表
            getShareFileList: async (pwdId, stoken, pdir_fid = '0') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://drive.quark.cn/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc&pwd_id=${pwdId}&stoken=${encodeURIComponent(stoken)}&pdir_fid=${pdir_fid}&force=0&_fetch_share=1`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve(data.data.list || []);
                                } else {
                                    reject(new Error(data.message || '获取文件列表失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 转存文件
            saveShare: async (pwdId, stoken, fids, toParentFid = '0') => {
                const loginInfo = LoginChecker.loginStatus.quark;
                if (!loginInfo || !loginInfo.isLoggedIn) {
                    throw new Error('请先登录夸克网盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://drive.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc`,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            fid_list: fids,
                            fid_token_list: fids.map(() => ''),
                            to_pdir_fid: toParentFid,
                            pwd_id: pwdId,
                            stoken: stoken,
                            pdir_fid: '0',
                            scene: 'link'
                        }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200) {
                                    resolve({ success: true, message: '转存成功', data });
                                } else {
                                    resolve({ success: false, message: data.message || '转存失败' });
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            }
        },

        // 123云盘API
        pan123: {
            // 获取分享信息
            getShareInfo: async (shareKey, sharePwd = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://www.123pan.com/api/share/info?shareKey=${shareKey}&sharePwd=${sharePwd}`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0) {
                                    resolve(data.data);
                                } else if (data.code === 4010) {
                                    reject(new Error('提取码错误'));
                                } else {
                                    reject(new Error(data.message || '获取分享信息失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 获取分享文件列表
            getShareFileList: async (shareKey, sharePwd = '', parentFileId = 0) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://www.123pan.com/api/share/get?shareKey=${shareKey}&sharePwd=${sharePwd}&parentFileId=${parentFileId}&limit=100`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0) {
                                    resolve(data.data.InfoList || []);
                                } else {
                                    reject(new Error(data.message || '获取文件列表失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 转存文件
            saveShare: async (shareKey, sharePwd, fileIdList, parentFileId = 0) => {
                const loginInfo = LoginChecker.loginStatus['123pan'];
                if (!loginInfo || !loginInfo.isLoggedIn) {
                    throw new Error('请先登录123云盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://www.123pan.com/api/share/save',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${loginInfo.token}`
                        },
                        data: JSON.stringify({
                            shareKey: shareKey,
                            sharePwd: sharePwd,
                            fileIdList: fileIdList,
                            parentFileId: parentFileId
                        }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0) {
                                    resolve({ success: true, message: '转存成功' });
                                } else {
                                    resolve({ success: false, message: data.message || '转存失败' });
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            }
        }
    };

    // ==================== UI组件 ====================
    const UI = {
        showToast: (message, type = 'info', duration = 3000) => {
            const existing = document.querySelector('.wr-toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = `wr-toast wr-toast-${type}`;
            toast.innerHTML = `<span>${message}</span>`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'wr-slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        createPanel: async () => {
            // 先检测登录状态
            UI.showToast('正在检测登录状态...', 'info', 2000);
            await LoginChecker.checkCurrentDisk();

            const currentDisk = Utils.getCurrentDisk();
            const overlay = document.createElement('div');
            overlay.className = 'wr-overlay';
            overlay.onclick = () => UI.closePanel();

            const panel = document.createElement('div');
            panel.className = 'wr-transfer-panel';
            panel.id = 'wr-main-panel';

            // 当前网盘登录状态
            const currentLoginStatus = currentDisk ? LoginChecker.loginStatus[currentDisk.type] : null;
            const isLoggedIn = currentLoginStatus?.isLoggedIn;

            panel.innerHTML = `
                <div class="wr-panel-header">
                    <div class="wr-panel-title">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        ${CONFIG.appName}
                    </div>
                    <button class="wr-panel-close" id="wr-close-btn">&times;</button>
                </div>
                <div class="wr-panel-body">
                    ${currentDisk ? `
                        <div class="wr-login-status ${isLoggedIn ? 'logged-in' : 'logged-out'}">
                            <span class="wr-login-dot ${isLoggedIn ? 'online' : 'offline'}"></span>
                            <span class="wr-login-text">
                                ${currentDisk.name}: ${isLoggedIn ? `已登录 (${currentLoginStatus.username})` : '未登录'}
                            </span>
                            ${!isLoggedIn ? `<button class="wr-login-btn" id="wr-login-btn">去登录</button>` : ''}
                        </div>
                    ` : ''}

                    <div class="wr-tabs">
                        <div class="wr-tab active" data-tab="transfer">转存文件</div>
                        <div class="wr-tab" data-tab="history">历史记录</div>
                        <div class="wr-tab" data-tab="settings">设置</div>
                    </div>

                    <div class="wr-tab-content active" id="tab-transfer">
                        ${!isLoggedIn && currentDisk ? `
                            <div class="wr-tip-box">
                                ⚠️ 请先登录${currentDisk.name}后再进行转存操作。
                                <a href="${LoginChecker.getLoginUrl(currentDisk.type)}" target="_blank">点击登录</a>
                            </div>
                        ` : ''}

                        <div class="wr-section">
                            <div class="wr-section-title">分享链接</div>
                            <div class="wr-input-group">
                                <input type="text" class="wr-input" id="wr-share-link" placeholder="请粘贴网盘分享链接">
                            </div>
                            <div class="wr-input-group">
                                <input type="text" class="wr-input" id="wr-share-pwd" placeholder="提取码（如有）" maxlength="6">
                            </div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-section-title">文件列表 <span id="wr-file-count" style="font-weight: normal; color: #999;"></span></div>
                            <button class="wr-btn wr-btn-primary" id="wr-fetch-btn" style="margin-bottom: 10px;">
                                获取文件列表
                            </button>
                            <div class="wr-file-list" id="wr-file-list" style="display: none;"></div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-section-title">目标网盘 (当前: ${currentDisk?.name || '未知'})</div>
                            <div class="wr-disk-grid" id="wr-disk-grid">
                                ${CONFIG.supportedDisks.map(disk => {
                                    const diskLogin = LoginChecker.loginStatus[disk.type];
                                    const diskLoggedIn = diskLogin?.isLoggedIn;
                                    const isCurrentDisk = currentDisk && currentDisk.type === disk.type;
                                    return `
                                        <div class="wr-disk-item ${isCurrentDisk ? 'selected' : ''} ${diskLoggedIn ? 'logged-in' : 'logged-out'}"
                                             data-disk="${disk.type}" data-name="${disk.name}" title="${diskLoggedIn ? '已登录: ' + (diskLogin.username || '') : '未登录'}">
                                            <div class="wr-disk-icon" style="background: ${disk.color}">${disk.name[0]}</div>
                                            <div class="wr-disk-name">${disk.name.replace('网盘', '').replace('云盘', '')}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-input-group">
                                <label class="wr-input-label">保存路径 (默认: 根目录)</label>
                                <input type="text" class="wr-input" id="wr-target-path" value="/" placeholder="输入保存路径">
                            </div>
                        </div>

                        <button class="wr-btn wr-btn-primary" id="wr-transfer-btn" ${!isLoggedIn ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            开始转存
                        </button>

                        <div class="wr-status-bar" id="wr-status-bar" style="display: none;">
                            <div class="wr-status-row">
                                <span class="wr-status-label">状态</span>
                                <span class="wr-status-value" id="wr-status-text">准备中...</span>
                            </div>
                            <div class="wr-status-row">
                                <span class="wr-status-label">耗时</span>
                                <span class="wr-status-value" id="wr-time-text">0s</span>
                            </div>
                            <div class="wr-progress-bar">
                                <div class="wr-progress-fill" id="wr-progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="wr-tab-content" id="tab-history">
                        <div id="wr-history-list">
                            ${UI.renderHistory()}
                        </div>
                    </div>

                    <div class="wr-tab-content" id="tab-settings">
                        <div class="wr-section">
                            <div class="wr-section-title">登录状态</div>
                            <div id="wr-all-login-status">正在检测...</div>
                        </div>
                        <div class="wr-section">
                            <div class="wr-section-title">基本设置</div>
                            <div class="wr-input-group">
                                <label class="wr-input-label">默认保存路径</label>
                                <input type="text" class="wr-input" id="wr-default-path" value="${GM_getValue('default_path', '/')}" placeholder="输入默认保存路径">
                            </div>
                            <button class="wr-btn wr-btn-primary" id="wr-save-settings" style="margin-top: 10px;">保存设置</button>
                        </div>
                        <div class="wr-section">
                            <div class="wr-section-title">关于</div>
                            <p style="color: #666; font-size: 13px; line-height: 1.8;">
                                ${CONFIG.appName} v${CONFIG.version}<br>
                                作者：${CONFIG.author}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="wr-footer">
                    ${CONFIG.appName} v${CONFIG.version} | Powered by ${CONFIG.author}
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(panel);

            UI.bindPanelEvents();

            // 异步检测所有网盘登录状态
            LoginChecker.checkAllDisks().then(() => {
                UI.updateAllLoginStatus();
            });
        },

        updateAllLoginStatus: () => {
            const container = document.getElementById('wr-all-login-status');
            if (!container) return;

            const html = CONFIG.supportedDisks.map(disk => {
                const status = LoginChecker.loginStatus[disk.type];
                const isLoggedIn = status?.isLoggedIn;
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isLoggedIn ? '#4caf50' : '#ff9800'};"></span>
                            ${disk.name}
                        </span>
                        <span style="color: ${isLoggedIn ? '#4caf50' : '#ff9800'}; font-size: 12px;">
                            ${isLoggedIn ? `已登录 (${status.username || ''})` : '未登录'}
                        </span>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        },

        renderHistory: () => {
            const history = Utils.getHistory();
            if (history.length === 0) {
                return '<p style="text-align: center; color: #999; padding: 40px 0;">暂无转存记录</p>';
            }
            return history.slice(0, 20).map(item => `
                <div class="wr-history-item">
                    <div class="wr-history-info">
                        <div class="wr-history-title">${item.fileName || '未知文件'}</div>
                        <div class="wr-history-meta">
                            ${item.sourceDisk} → ${item.targetDisk} | ${item.time} | 耗时: ${item.duration}
                        </div>
                    </div>
                    <span class="wr-history-status ${item.success ? 'success' : 'failed'}">
                        ${item.success ? '成功' : '失败'}
                    </span>
                </div>
            `).join('');
        },

        bindPanelEvents: () => {
            document.getElementById('wr-close-btn').onclick = UI.closePanel;

            // 登录按钮
            const loginBtn = document.getElementById('wr-login-btn');
            if (loginBtn) {
                loginBtn.onclick = () => {
                    const currentDisk = Utils.getCurrentDisk();
                    if (currentDisk) {
                        window.location.reload();
                    }
                };
            }

            // Tab切换
            document.querySelectorAll('.wr-tab').forEach(tab => {
                tab.onclick = () => {
                    document.querySelectorAll('.wr-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.wr-tab-content').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
                };
            });

            // 网盘选择
            document.querySelectorAll('.wr-disk-item').forEach(item => {
                item.onclick = () => {
                    document.querySelectorAll('.wr-disk-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                };
            });

            // 获取文件列表按钮
            document.getElementById('wr-fetch-btn').onclick = TransferManager.fetchFileList;

            // 转存按钮
            document.getElementById('wr-transfer-btn').onclick = TransferManager.startTransfer;

            // 保存设置
            document.getElementById('wr-save-settings').onclick = () => {
                const defaultPath = document.getElementById('wr-default-path').value;
                GM_setValue('default_path', defaultPath);
                UI.showToast('设置已保存', 'success');
            };
        },

        closePanel: () => {
            const panel = document.getElementById('wr-main-panel');
            const overlay = document.querySelector('.wr-overlay');
            if (panel) panel.remove();
            if (overlay) overlay.remove();
        },

        createFloatButton: () => {
            const btn = document.createElement('button');
            btn.className = 'wr-float-btn';
            btn.id = 'wr-float-btn';
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
            btn.title = CONFIG.appName;
            btn.onclick = UI.createPanel;
            document.body.appendChild(btn);
        },

        updateProgress: (percent, status) => {
            const statusBar = document.getElementById('wr-status-bar');
            if (statusBar) {
                statusBar.style.display = 'block';
                document.getElementById('wr-status-text').textContent = status;
                document.getElementById('wr-progress-fill').style.width = percent + '%';
            }
        },

        renderFileList: (files) => {
            const container = document.getElementById('wr-file-list');
            const countEl = document.getElementById('wr-file-count');

            if (!files || files.length === 0) {
                container.style.display = 'none';
                countEl.textContent = '';
                return;
            }

            countEl.textContent = `(共 ${files.length} 个文件)`;
            container.style.display = 'block';

            container.innerHTML = files.map((file, index) => `
                <div class="wr-file-item">
                    <input type="checkbox" class="wr-file-checkbox" data-index="${index}" checked>
                    <span class="wr-file-name" title="${file.name || file.server_filename || file.fileName}">${file.name || file.server_filename || file.fileName}</span>
                    <span class="wr-file-size">${Utils.formatSize(file.size || file.Size || 0)}</span>
                </div>
            `).join('');

            // 存储文件列表
            TransferManager.fileList = files;
        }
    };

    // ==================== 转存管理器 ====================
    const TransferManager = {
        startTime: 0,
        timer: null,
        fileList: [],

        fetchFileList: async () => {
            const shareLink = document.getElementById('wr-share-link').value.trim();
            const sharePwd = document.getElementById('wr-share-pwd').value.trim();

            if (!shareLink) {
                UI.showToast('请输入分享链接', 'warning');
                return;
            }

            const shareInfo = Utils.parseShareLink(shareLink);
            if (!shareInfo) {
                UI.showToast('无法识别的分享链接', 'error');
                return;
            }

            const fetchBtn = document.getElementById('wr-fetch-btn');
            fetchBtn.disabled = true;
            fetchBtn.innerHTML = '<div class="wr-spinner"></div> 获取中...';

            try {
                let files = [];

                switch (shareInfo.type) {
                    case 'aliyun':
                        const shareToken = await DiskAPI.aliyun.getShareToken(shareInfo.shareId, sharePwd);
                        files = await DiskAPI.aliyun.getShareFileList(shareInfo.shareId, shareToken);
                        TransferManager.shareToken = shareToken;
                        break;

                    case 'quark':
                        const quarkToken = await DiskAPI.quark.getShareToken(shareInfo.shareId, sharePwd);
                        files = await DiskAPI.quark.getShareFileList(shareInfo.shareId, quarkToken.stoken);
                        TransferManager.quarkToken = quarkToken;
                        break;

                    case '123pan':
                        await DiskAPI.pan123.getShareInfo(shareInfo.shareId, sharePwd);
                        files = await DiskAPI.pan123.getShareFileList(shareInfo.shareId, sharePwd);
                        break;

                    default:
                        UI.showToast(`暂不支持获取${shareInfo.name}的文件列表，请直接转存`, 'info');
                        return;
                }

                UI.renderFileList(files);
                TransferManager.shareInfo = shareInfo;
                TransferManager.sharePwd = sharePwd;
                UI.showToast(`获取到 ${files.length} 个文件`, 'success');

            } catch (error) {
                UI.showToast('获取失败: ' + error.message, 'error');
            } finally {
                fetchBtn.disabled = false;
                fetchBtn.innerHTML = '获取文件列表';
            }
        },

        startTransfer: async () => {
            const shareLink = document.getElementById('wr-share-link').value.trim();
            const sharePwd = document.getElementById('wr-share-pwd').value.trim();
            const targetPath = document.getElementById('wr-target-path').value.trim() || '/';
            const selectedDisk = document.querySelector('.wr-disk-item.selected');

            if (!shareLink) {
                UI.showToast('请输入分享链接', 'warning');
                return;
            }

            if (!selectedDisk) {
                UI.showToast('请选择目标网盘', 'warning');
                return;
            }

            const targetDiskType = selectedDisk.dataset.disk;
            const targetDiskName = selectedDisk.dataset.name;
            const shareInfo = Utils.parseShareLink(shareLink);

            if (!shareInfo) {
                UI.showToast('无法识别的分享链接', 'error');
                return;
            }

            // 检查目标网盘登录状态
            const targetLoginInfo = LoginChecker.loginStatus[targetDiskType];
            if (!targetLoginInfo || !targetLoginInfo.isLoggedIn) {
                UI.showToast(`请先登录${targetDiskName}`, 'error');
                window.open(LoginChecker.getLoginUrl(targetDiskType), '_blank');
                return;
            }

            // 开始计时
            TransferManager.startTime = Date.now();
            TransferManager.timer = setInterval(() => {
                const elapsed = Date.now() - TransferManager.startTime;
                const timeEl = document.getElementById('wr-time-text');
                if (timeEl) timeEl.textContent = Utils.formatTime(elapsed);
            }, 100);

            const transferBtn = document.getElementById('wr-transfer-btn');
            transferBtn.disabled = true;
            transferBtn.innerHTML = '<div class="wr-spinner"></div> 转存中...';

            UI.updateProgress(0, '正在准备转存...');

            try {
                let result;

                // 根据源网盘和目标网盘类型执行转存
                UI.updateProgress(20, '正在获取分享信息...');

                switch (shareInfo.type) {
                    case 'aliyun':
                        // 阿里云盘转存
                        let shareToken = TransferManager.shareToken;
                        if (!shareToken) {
                            shareToken = await DiskAPI.aliyun.getShareToken(shareInfo.shareId, sharePwd);
                        }

                        UI.updateProgress(40, '正在获取文件列表...');
                        let files = TransferManager.fileList;
                        if (!files || files.length === 0) {
                            files = await DiskAPI.aliyun.getShareFileList(shareInfo.shareId, shareToken);
                        }

                        // 获取选中的文件
                        const selectedFiles = UI.getSelectedFiles(files);
                        if (selectedFiles.length === 0) {
                            throw new Error('请选择要转存的文件');
                        }

                        UI.updateProgress(60, '正在执行转存...');
                        const fileIds = selectedFiles.map(f => f.file_id);
                        result = await DiskAPI.aliyun.saveShare(shareInfo.shareId, shareToken, fileIds);
                        break;

                    case 'quark':
                        // 夸克网盘转存
                        let quarkToken = TransferManager.quarkToken;
                        if (!quarkToken) {
                            quarkToken = await DiskAPI.quark.getShareToken(shareInfo.shareId, sharePwd);
                        }

                        UI.updateProgress(40, '正在获取文件列表...');
                        let quarkFiles = TransferManager.fileList;
                        if (!quarkFiles || quarkFiles.length === 0) {
                            quarkFiles = await DiskAPI.quark.getShareFileList(shareInfo.shareId, quarkToken.stoken);
                        }

                        const selectedQuarkFiles = UI.getSelectedFiles(quarkFiles);
                        if (selectedQuarkFiles.length === 0) {
                            throw new Error('请选择要转存的文件');
                        }

                        UI.updateProgress(60, '正在执行转存...');
                        const fids = selectedQuarkFiles.map(f => f.fid);
                        result = await DiskAPI.quark.saveShare(shareInfo.shareId, quarkToken.stoken, fids);
                        break;

                    case '123pan':
                        // 123云盘转存
                        UI.updateProgress(40, '正在获取文件列表...');
                        let pan123Files = TransferManager.fileList;
                        if (!pan123Files || pan123Files.length === 0) {
                            pan123Files = await DiskAPI.pan123.getShareFileList(shareInfo.shareId, sharePwd);
                        }

                        const selected123Files = UI.getSelectedFiles(pan123Files);
                        if (selected123Files.length === 0) {
                            throw new Error('请选择要转存的文件');
                        }

                        UI.updateProgress(60, '正在执行转存...');
                        const fileIdList = selected123Files.map(f => f.FileId);
                        result = await DiskAPI.pan123.saveShare(shareInfo.shareId, sharePwd, fileIdList);
                        break;

                    default:
                        throw new Error(`暂不支持从${shareInfo.name}转存，请等待后续更新`);
                }

                UI.updateProgress(100, '转存完成！');

                const duration = Utils.formatTime(Date.now() - TransferManager.startTime);
                clearInterval(TransferManager.timer);

                Utils.saveHistory({
                    id: Utils.generateId(),
                    fileName: shareInfo.shareId,
                    sourceDisk: shareInfo.name,
                    targetDisk: targetDiskName,
                    targetPath: targetPath,
                    time: new Date().toLocaleString(),
                    duration: duration,
                    success: result.success
                });

                if (result.success) {
                    UI.showToast(`转存成功！${result.message || ''} 耗时: ${duration}`, 'success', 5000);
                    GM_notification({
                        title: CONFIG.appName,
                        text: `文件转存成功！\n来源: ${shareInfo.name}\n目标: ${targetDiskName}\n耗时: ${duration}`,
                        timeout: 5000
                    });
                } else {
                    UI.showToast(`转存失败: ${result.message}`, 'error', 5000);
                }

            } catch (error) {
                clearInterval(TransferManager.timer);
                const duration = Utils.formatTime(Date.now() - TransferManager.startTime);

                Utils.saveHistory({
                    id: Utils.generateId(),
                    fileName: shareInfo?.shareId || '未知',
                    sourceDisk: shareInfo?.name || '未知',
                    targetDisk: targetDiskName,
                    targetPath: targetPath,
                    time: new Date().toLocaleString(),
                    duration: duration,
                    success: false,
                    error: error.message
                });

                UI.updateProgress(0, `转存失败: ${error.message}`);
                UI.showToast(`转存失败: ${error.message}`, 'error', 5000);

            } finally {
                transferBtn.disabled = false;
                transferBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    开始转存
                `;
            }
        }
    };

    // 获取选中的文件
    UI.getSelectedFiles = (files) => {
        const checkboxes = document.querySelectorAll('.wr-file-checkbox:checked');
        if (checkboxes.length === 0) return files; // 如果没有复选框或全选，返回所有文件

        const selectedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        return files.filter((_, index) => selectedIndexes.includes(index));
    };

    // ==================== 初始化 ====================
    const init = async () => {
        GM_addStyle(STYLES);

        const currentDisk = Utils.getCurrentDisk();
        if (currentDisk) {
            console.log(`${CONFIG.appName}: 检测到 ${currentDisk.name}`);
            // 自动检测登录状态
            await LoginChecker.checkCurrentDisk();
        }

        UI.createFloatButton();

        GM_registerMenuCommand('打开转存面板', UI.createPanel);
        GM_registerMenuCommand('检测登录状态', async () => {
            UI.showToast('正在检测登录状态...', 'info');
            await LoginChecker.checkAllDisks();
            const currentStatus = LoginChecker.loginStatus[currentDisk?.type];
            if (currentStatus?.isLoggedIn) {
                UI.showToast(`${currentDisk.name} 已登录: ${currentStatus.username}`, 'success');
            } else {
                UI.showToast(`${currentDisk?.name || '当前网盘'} 未登录`, 'warning');
            }
        });

        console.log(`${CONFIG.appName} v${CONFIG.version} 已加载`);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
