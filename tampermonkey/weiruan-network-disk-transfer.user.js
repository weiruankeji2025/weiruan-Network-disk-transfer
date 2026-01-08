// ==UserScript==
// @name         威软网盘转存工具
// @namespace    https://github.com/weiruankeji2025/weiruan-Network-disk-transfer
// @version      1.2.1
// @description  网盘高速互相转存工具 - 支持登录各网盘后真实转存
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
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=baidu.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_cookie
// @grant        GM_openInTab
// @connect      pan.baidu.com
// @connect      passport.baidu.com
// @connect      api.aliyundrive.com
// @connect      api.alipan.com
// @connect      auth.alipan.com
// @connect      cloud.189.cn
// @connect      open.e.189.cn
// @connect      drive.quark.cn
// @connect      uop.quark.cn
// @connect      pan.xunlei.com
// @connect      xluser-ssl.xunlei.com
// @connect      115.com
// @connect      passportapi.115.com
// @connect      lanzou.com
// @connect      yun.139.com
// @connect      www.123pan.com
// @connect      drive.uc.cn
// @connect      api.qrserver.com
// @connect      passport.alipan.com
// @connect      *
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置信息 ====================
    const CONFIG = {
        appName: '威软网盘转存工具',
        version: '1.2.1',
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
            min-width: 520px;
            max-width: 580px;
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

        .wr-account-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .wr-account-card {
            border: 2px solid #e8e8e8;
            border-radius: 12px;
            padding: 14px;
            cursor: pointer;
            transition: all 0.2s;
            background: #fafafa;
        }

        .wr-account-card:hover {
            border-color: #667eea;
            background: #f0f4ff;
        }

        .wr-account-card.logged-in {
            border-color: #4caf50;
            background: #e8f5e9;
        }

        .wr-account-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .wr-account-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: #fff;
        }

        .wr-account-info {
            flex: 1;
        }

        .wr-account-name {
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }

        .wr-account-status {
            font-size: 12px;
            color: #999;
            margin-top: 2px;
        }

        .wr-account-status.online {
            color: #4caf50;
        }

        .wr-account-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .wr-account-btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .wr-account-btn.login {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }

        .wr-account-btn.logout {
            background: #ff5722;
            color: #fff;
        }

        .wr-account-btn:hover {
            transform: scale(1.02);
        }

        .wr-login-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            z-index: 9999999;
            width: 400px;
            overflow: hidden;
        }

        .wr-login-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .wr-login-title {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
        }

        .wr-login-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        }

        .wr-login-body {
            padding: 24px;
        }

        .wr-login-tabs {
            display: flex;
            border-bottom: 2px solid #e8e8e8;
            margin-bottom: 20px;
        }

        .wr-login-tab {
            flex: 1;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            color: #666;
            font-weight: 500;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
        }

        .wr-login-tab:hover { color: #667eea; }

        .wr-login-tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }

        .wr-login-content {
            display: none;
        }

        .wr-login-content.active {
            display: block;
        }

        .wr-qrcode-container {
            text-align: center;
            padding: 20px;
        }

        .wr-qrcode-img {
            width: 200px;
            height: 200px;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .wr-qrcode-tip {
            font-size: 14px;
            color: #666;
        }

        .wr-qrcode-refresh {
            color: #667eea;
            cursor: pointer;
            text-decoration: underline;
            margin-left: 8px;
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
            z-index: 99999999;
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

        .wr-cookie-input {
            width: 100%;
            height: 80px;
            padding: 12px;
            border: 2px solid #e8e8e8;
            border-radius: 10px;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
        }

        .wr-cookie-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .wr-tip-box {
            background: #e3f2fd;
            border: 1px solid #90caf9;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #1565c0;
        }

        .wr-warning-box {
            background: #fff3e0;
            border: 1px solid #ffcc80;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #e65100;
        }

        .wr-step-list {
            padding-left: 20px;
            margin: 10px 0;
        }

        .wr-step-list li {
            margin-bottom: 8px;
            line-height: 1.6;
        }

        .wr-token-display {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 12px;
            margin-top: 10px;
            font-size: 12px;
            word-break: break-all;
            max-height: 100px;
            overflow-y: auto;
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

    // ==================== 账号凭证管理 ====================
    const CredentialManager = {
        // 保存凭证
        save: (diskType, credentials) => {
            const allCreds = GM_getValue('disk_credentials', {});
            allCreds[diskType] = {
                ...credentials,
                savedAt: Date.now()
            };
            GM_setValue('disk_credentials', allCreds);
        },

        // 获取凭证
        get: (diskType) => {
            const allCreds = GM_getValue('disk_credentials', {});
            return allCreds[diskType] || null;
        },

        // 删除凭证
        remove: (diskType) => {
            const allCreds = GM_getValue('disk_credentials', {});
            delete allCreds[diskType];
            GM_setValue('disk_credentials', allCreds);
        },

        // 获取所有凭证
        getAll: () => {
            return GM_getValue('disk_credentials', {});
        },

        // 检查凭证是否有效（简单检查）
        isValid: (diskType) => {
            const cred = CredentialManager.get(diskType);
            if (!cred) return false;

            // 检查是否过期（默认7天有效期）
            const expireTime = cred.expireTime || (cred.savedAt + 7 * 24 * 60 * 60 * 1000);
            return Date.now() < expireTime;
        }
    };

    // ==================== 网盘登录模块 ====================
    const DiskLogin = {
        // 百度网盘登录
        baidu: {
            // 获取登录二维码
            getQRCode: () => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://passport.baidu.com/v2/api/getqrcode?lp=pc&qrloginfrom=pc&gid=${Utils.generateId()}&callback=callback&apiver=v3&tt=${Date.now()}&tpl=netdisk`,
                        onload: (res) => {
                            try {
                                const jsonStr = res.responseText.replace(/^callback\(/, '').replace(/\)$/, '');
                                const data = JSON.parse(jsonStr);
                                if (data.imgurl) {
                                    resolve({
                                        imgUrl: 'https://' + data.imgurl,
                                        sign: data.sign,
                                        uuid: data.sign // 使用sign作为uuid
                                    });
                                } else {
                                    reject(new Error('获取二维码失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 检查扫码状态
            checkQRStatus: (sign) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://passport.baidu.com/channel/unicast?channel_id=${sign}&callback=callback&tpl=netdisk&apiver=v3&tt=${Date.now()}`,
                        onload: (res) => {
                            try {
                                const jsonStr = res.responseText.replace(/^callback\(/, '').replace(/\)$/, '');
                                const data = JSON.parse(jsonStr);
                                resolve(data);
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 使用Cookie登录
            loginWithCookie: async (cookie) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://pan.baidu.com/api/loginStatus?clienttype=0&web=1',
                        headers: {
                            'Cookie': cookie
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0 && data.login_info) {
                                    CredentialManager.save('baidu', {
                                        cookie: cookie,
                                        username: data.login_info.username,
                                        uk: data.login_info.uk,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.login_info.username
                                    });
                                } else {
                                    reject(new Error('Cookie无效或已过期'));
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

        // 阿里云盘登录
        aliyun: {
            // 获取登录二维码
            getQRCode: () => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://passport.alipan.com/newlogin/qrcode/generate.do?appName=aliyun_drive&fromSite=52&appEntrance=web&isMobile=false&lang=zh_CN&returnUrl=&bizParams=&_bx-v=2.5.6',
                        headers: {
                            'Referer': 'https://www.alipan.com/'
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.content && data.content.data) {
                                    const codeContent = data.content.data.codeContent;
                                    // 使用在线API生成二维码图片
                                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codeContent)}`;
                                    resolve({
                                        imgUrl: qrImgUrl,
                                        codeContent: codeContent,
                                        ck: data.content.data.ck,
                                        t: data.content.data.t
                                    });
                                } else {
                                    reject(new Error('获取二维码失败: ' + (data.content?.msg || '未知错误')));
                                }
                            } catch (e) {
                                reject(new Error('解析响应失败: ' + e.message));
                            }
                        },
                        onerror: (err) => reject(new Error('网络请求失败'))
                    });
                });
            },

            // 检查二维码扫描状态
            checkQRStatus: (ck, t) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://passport.alipan.com/newlogin/qrcode/query.do?appName=aliyun_drive&fromSite=52&_bx-v=2.5.6',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': 'https://www.alipan.com/'
                        },
                        data: `ck=${encodeURIComponent(ck)}&t=${t}&appName=aliyun_drive&appEntrance=web&isMobile=false&lang=zh_CN&returnUrl=&fromSite=52&bizParams=&navPlatform=MacIntel`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                resolve(data);
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 使用RefreshToken登录
            loginWithToken: async (refreshToken) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/token/refresh',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({ refresh_token: refreshToken }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.access_token) {
                                    CredentialManager.save('aliyun', {
                                        accessToken: data.access_token,
                                        refreshToken: data.refresh_token,
                                        driveId: data.default_drive_id,
                                        username: data.nick_name || data.user_name,
                                        userId: data.user_id,
                                        expireTime: Date.now() + (data.expires_in || 7200) * 1000,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.nick_name || data.user_name
                                    });
                                } else {
                                    reject(new Error(data.message || 'Token无效或已过期'));
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

        // 夸克网盘登录
        quark: {
            // 获取登录二维码
            getQRCode: () => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://uop.quark.cn/cas/ajax/getTokenForQrcodeLogin?client_id=532&v=1.2&request_id=' + Date.now(),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve({
                                        imgUrl: `https://uop.quark.cn/cas/qrcode?token=${data.data.members.token}&client_id=532`,
                                        token: data.data.members.token
                                    });
                                } else {
                                    reject(new Error('获取二维码失败'));
                                }
                            } catch (e) {
                                reject(e);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            // 使用Cookie登录
            loginWithCookie: async (cookie) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://drive.quark.cn/1/clouddrive/member/info?pr=ucpro&fr=pc',
                        headers: {
                            'Cookie': cookie
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    CredentialManager.save('quark', {
                                        cookie: cookie,
                                        username: data.data.nickname,
                                        memberId: data.data.member_id,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.data.nickname
                                    });
                                } else {
                                    reject(new Error('Cookie无效或已过期'));
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

        // 天翼云盘登录
        tianyi: {
            // 使用Cookie登录
            loginWithCookie: async (cookie) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://cloud.189.cn/api/portal/getUserBriefInfo.action',
                        headers: {
                            'Cookie': cookie
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.res_code === 0) {
                                    CredentialManager.save('tianyi', {
                                        cookie: cookie,
                                        username: data.nickName,
                                        userId: data.userId,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.nickName
                                    });
                                } else {
                                    reject(new Error('Cookie无效或已过期'));
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

        // 123云盘登录
        pan123: {
            // 使用Token登录
            loginWithToken: async (token) => {
                return new Promise((resolve, reject) => {
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
                                    CredentialManager.save('123pan', {
                                        token: token,
                                        username: data.data.nickname,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.data.nickname
                                    });
                                } else {
                                    reject(new Error('Token无效或已过期'));
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

        // 115网盘登录
        '115': {
            // 使用Cookie登录
            loginWithCookie: async (cookie) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://my.115.com/?ct=ajax&ac=nav',
                        headers: {
                            'Cookie': cookie
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.data && data.data.user_id) {
                                    CredentialManager.save('115', {
                                        cookie: cookie,
                                        username: data.data.user_name,
                                        userId: data.data.user_id,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.data.user_name
                                    });
                                } else {
                                    reject(new Error('Cookie无效或已过期'));
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

        // 迅雷云盘登录
        xunlei: {
            // 使用Cookie登录
            loginWithCookie: async (cookie) => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'https://pan.xunlei.com/api/pan/user/info',
                        headers: {
                            'Cookie': cookie
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0 && data.data) {
                                    CredentialManager.save('xunlei', {
                                        cookie: cookie,
                                        username: data.data.name,
                                        isLoggedIn: true
                                    });
                                    resolve({
                                        success: true,
                                        username: data.data.name
                                    });
                                } else {
                                    reject(new Error('Cookie无效或已过期'));
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

    // ==================== 网盘API封装 ====================
    const DiskAPI = {
        // 阿里云盘API
        aliyun: {
            getShareToken: async (shareId, sharePwd = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/v2/share_link/get_share_token',
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({ share_id: shareId, share_pwd: sharePwd }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.share_token) {
                                    resolve(data.share_token);
                                } else {
                                    reject(new Error(data.message || '获取分享令牌失败'));
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

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
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

            saveShare: async (shareId, shareToken, fileIds, toParentFileId = 'root') => {
                const cred = CredentialManager.get('aliyun');
                if (!cred || !cred.accessToken) {
                    throw new Error('请先登录阿里云盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/adrive/v2/batch',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cred.accessToken}`,
                            'x-share-token': shareToken
                        },
                        data: JSON.stringify({
                            requests: fileIds.map(fileId => ({
                                body: {
                                    file_id: fileId,
                                    share_id: shareId,
                                    auto_rename: true,
                                    to_parent_file_id: toParentFileId,
                                    to_drive_id: cred.driveId
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
                                        message: `成功转存 ${successCount}/${fileIds.length} 个文件`
                                    });
                                } else {
                                    reject(new Error(data.message || '转存失败'));
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            }
        },

        // 夸克网盘API
        quark: {
            getShareToken: async (pwdId, passcode = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc',
                        headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({ pwd_id: pwdId, passcode: passcode }),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve(data.data);
                                } else {
                                    reject(new Error(data.message || '获取分享信息失败'));
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

            getShareFileList: async (pwdId, stoken, pdirFid = '0') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://drive.quark.cn/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc&pwd_id=${pwdId}&stoken=${encodeURIComponent(stoken)}&pdir_fid=${pdirFid}&force=0&_fetch_share=1`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve(data.data.list || []);
                                } else {
                                    reject(new Error(data.message || '获取文件列表失败'));
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

            saveShare: async (pwdId, stoken, fids, toParentFid = '0') => {
                const cred = CredentialManager.get('quark');
                if (!cred || !cred.cookie) {
                    throw new Error('请先登录夸克网盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://drive.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cookie': cred.cookie
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
                                    resolve({ success: true, message: '转存成功' });
                                } else {
                                    resolve({ success: false, message: data.message || '转存失败' });
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            }
        },

        // 123云盘API
        pan123: {
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
                                } else {
                                    reject(new Error(data.message || '获取分享信息失败'));
                                }
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

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
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });
            },

            saveShare: async (shareKey, sharePwd, fileIdList, parentFileId = 0) => {
                const cred = CredentialManager.get('123pan');
                if (!cred || !cred.token) {
                    throw new Error('请先登录123云盘');
                }

                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://www.123pan.com/api/share/save',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${cred.token}`
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
                            } catch (e) { reject(e); }
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
            const currentDisk = Utils.getCurrentDisk();
            const overlay = document.createElement('div');
            overlay.className = 'wr-overlay';
            overlay.onclick = () => UI.closePanel();

            const panel = document.createElement('div');
            panel.className = 'wr-transfer-panel';
            panel.id = 'wr-main-panel';

            const credentials = CredentialManager.getAll();

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
                    <div class="wr-tabs">
                        <div class="wr-tab active" data-tab="transfer">转存文件</div>
                        <div class="wr-tab" data-tab="accounts">账号管理</div>
                        <div class="wr-tab" data-tab="history">历史记录</div>
                    </div>

                    <div class="wr-tab-content active" id="tab-transfer">
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
                            <div class="wr-section-title">文件列表</div>
                            <button class="wr-btn wr-btn-primary" id="wr-fetch-btn" style="margin-bottom: 10px;">
                                获取文件列表
                            </button>
                            <div class="wr-file-list" id="wr-file-list" style="display: none;"></div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-section-title">目标网盘</div>
                            <div class="wr-disk-grid" id="wr-disk-grid">
                                ${CONFIG.supportedDisks.map(disk => {
                                    const cred = credentials[disk.type];
                                    const isLoggedIn = cred && cred.isLoggedIn;
                                    return `
                                        <div class="wr-disk-item ${isLoggedIn ? 'logged-in' : ''}"
                                             data-disk="${disk.type}" data-name="${disk.name}">
                                            <div class="wr-disk-icon" style="background: ${disk.color}">${disk.name[0]}</div>
                                            <div class="wr-disk-name">${disk.name.replace('网盘', '').replace('云盘', '')}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-input-group">
                                <label class="wr-input-label">保存路径</label>
                                <input type="text" class="wr-input" id="wr-target-path" value="/" placeholder="输入保存路径，默认根目录">
                            </div>
                        </div>

                        <button class="wr-btn wr-btn-primary" id="wr-transfer-btn">
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

                    <div class="wr-tab-content" id="tab-accounts">
                        <div class="wr-tip-box">
                            💡 登录后可以进行真实转存。支持Cookie/Token登录方式，登录信息安全存储在本地。
                        </div>
                        <div class="wr-account-grid" id="wr-account-grid">
                            ${UI.renderAccountCards(credentials)}
                        </div>
                    </div>

                    <div class="wr-tab-content" id="tab-history">
                        <div id="wr-history-list">
                            ${UI.renderHistory()}
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
        },

        renderAccountCards: (credentials) => {
            return CONFIG.supportedDisks.map(disk => {
                const cred = credentials[disk.type];
                const isLoggedIn = cred && cred.isLoggedIn;
                return `
                    <div class="wr-account-card ${isLoggedIn ? 'logged-in' : ''}" data-disk="${disk.type}">
                        <div class="wr-account-header">
                            <div class="wr-account-icon" style="background: ${disk.color}">${disk.name[0]}</div>
                            <div class="wr-account-info">
                                <div class="wr-account-name">${disk.name}</div>
                                <div class="wr-account-status ${isLoggedIn ? 'online' : ''}">
                                    ${isLoggedIn ? `已登录: ${cred.username || '用户'}` : '未登录'}
                                </div>
                            </div>
                        </div>
                        <div class="wr-account-actions">
                            ${isLoggedIn ?
                                `<button class="wr-account-btn logout" data-disk="${disk.type}" data-action="logout">退出登录</button>` :
                                `<button class="wr-account-btn login" data-disk="${disk.type}" data-action="login">登录</button>`
                            }
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderHistory: () => {
            const history = Utils.getHistory();
            if (history.length === 0) {
                return '<p style="text-align: center; color: #999; padding: 40px 0;">暂无转存记录</p>';
            }
            return history.slice(0, 20).map(item => `
                <div style="padding: 12px; border: 1px solid #e8e8e8; border-radius: 8px; margin-bottom: 10px;">
                    <div style="font-size: 14px; font-weight: 500; color: #333;">${item.fileName || '文件转存'}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">
                        ${item.sourceDisk} → ${item.targetDisk} | ${item.time} | ${item.duration}
                    </div>
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-top: 6px;
                        background: ${item.success ? '#e8f5e9' : '#ffebee'}; color: ${item.success ? '#2e7d32' : '#c62828'};">
                        ${item.success ? '成功' : '失败'}
                    </span>
                </div>
            `).join('');
        },

        showLoginModal: (diskType) => {
            const disk = CONFIG.supportedDisks.find(d => d.type === diskType);
            if (!disk) return;

            const overlay = document.createElement('div');
            overlay.className = 'wr-overlay';
            overlay.style.zIndex = '9999998';
            overlay.onclick = () => {
                overlay.remove();
                modal.remove();
            };

            const modal = document.createElement('div');
            modal.className = 'wr-login-modal';
            modal.id = 'wr-login-modal';

            // 根据网盘类型显示不同的登录方式
            let loginContent = '';

            if (['baidu', 'aliyun', 'quark'].includes(diskType)) {
                // 支持二维码登录的网盘
                loginContent = `
                    <div class="wr-login-tabs">
                        <div class="wr-login-tab active" data-method="cookie">Cookie登录</div>
                        <div class="wr-login-tab" data-method="qrcode">扫码登录</div>
                    </div>
                    <div class="wr-login-content active" id="login-cookie">
                        ${UI.getCookieLoginContent(diskType, disk.name)}
                    </div>
                    <div class="wr-login-content" id="login-qrcode">
                        <div class="wr-qrcode-container">
                            <div id="wr-qrcode-img" style="width: 200px; height: 200px; background: #f5f5f5; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                                点击获取二维码
                            </div>
                            <button class="wr-btn wr-btn-primary" id="wr-get-qrcode">获取登录二维码</button>
                            <p class="wr-qrcode-tip" style="margin-top: 12px;">使用${disk.name}APP扫码登录</p>
                        </div>
                    </div>
                `;
            } else if (diskType === '123pan') {
                // 123云盘使用Token登录
                loginContent = `
                    <div class="wr-warning-box">
                        请输入123云盘的 Authorization Token
                    </div>
                    <div class="wr-input-group">
                        <label class="wr-input-label">获取方法：</label>
                        <ol class="wr-step-list">
                            <li>登录 <a href="https://www.123pan.com" target="_blank">123云盘官网</a></li>
                            <li>按 F12 打开开发者工具</li>
                            <li>切换到 Network(网络) 标签</li>
                            <li>刷新页面，点击任意请求</li>
                            <li>在请求头中找到 Authorization 的值</li>
                        </ol>
                    </div>
                    <div class="wr-input-group">
                        <label class="wr-input-label">Token</label>
                        <textarea class="wr-cookie-input" id="wr-login-token" placeholder="Bearer eyJhbGc..."></textarea>
                    </div>
                    <button class="wr-btn wr-btn-primary" id="wr-login-submit">登录</button>
                `;
            } else {
                // 其他网盘使用Cookie登录
                loginContent = UI.getCookieLoginContent(diskType, disk.name);
            }

            modal.innerHTML = `
                <div class="wr-login-header">
                    <div class="wr-login-title">登录${disk.name}</div>
                    <button class="wr-login-close" id="wr-login-close">&times;</button>
                </div>
                <div class="wr-login-body">
                    ${loginContent}
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(modal);

            UI.bindLoginModalEvents(diskType);
        },

        getCookieLoginContent: (diskType, diskName) => {
            const cookieGuides = {
                'baidu': 'BDUSS 和 STOKEN',
                'aliyun': 'refresh_token（在localStorage中的token字段）',
                'quark': '__puus 等Cookie',
                'tianyi': 'COOKIE_LOGIN_USER',
                '115': 'UID 和 CID',
                'xunlei': 'xlly_session'
            };

            return `
                <div class="wr-warning-box">
                    请输入${diskName}的Cookie信息
                </div>
                <div class="wr-input-group">
                    <label class="wr-input-label">获取方法：</label>
                    <ol class="wr-step-list">
                        <li>在浏览器中登录 ${diskName}</li>
                        <li>按 F12 打开开发者工具</li>
                        <li>切换到 Application(应用) 标签</li>
                        <li>在左侧找到 Cookies，选择对应域名</li>
                        <li>复制需要的Cookie值：${cookieGuides[diskType] || '全部Cookie'}</li>
                    </ol>
                </div>
                <div class="wr-input-group">
                    <label class="wr-input-label">${diskType === 'aliyun' ? 'Refresh Token' : 'Cookie'}</label>
                    <textarea class="wr-cookie-input" id="wr-login-cookie" placeholder="${diskType === 'aliyun' ? '请输入refresh_token值' : '请输入Cookie值'}"></textarea>
                </div>
                <button class="wr-btn wr-btn-primary" id="wr-login-submit">登录</button>
            `;
        },

        bindLoginModalEvents: (diskType) => {
            document.getElementById('wr-login-close').onclick = () => {
                document.getElementById('wr-login-modal')?.remove();
                document.querySelectorAll('.wr-overlay').forEach(o => {
                    if (o.style.zIndex === '9999998') o.remove();
                });
            };

            // Tab切换
            document.querySelectorAll('.wr-login-tab').forEach(tab => {
                tab.onclick = () => {
                    document.querySelectorAll('.wr-login-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.wr-login-content').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    document.getElementById('login-' + tab.dataset.method)?.classList.add('active');
                };
            });

            // 获取二维码按钮
            const qrcodeBtn = document.getElementById('wr-get-qrcode');
            let qrPollingTimer = null;

            if (qrcodeBtn) {
                qrcodeBtn.onclick = async () => {
                    try {
                        // 清除之前的轮询
                        if (qrPollingTimer) {
                            clearInterval(qrPollingTimer);
                            qrPollingTimer = null;
                        }

                        qrcodeBtn.disabled = true;
                        qrcodeBtn.textContent = '获取中...';

                        let qrData;
                        if (diskType === 'baidu') {
                            qrData = await DiskLogin.baidu.getQRCode();
                        } else if (diskType === 'aliyun') {
                            qrData = await DiskLogin.aliyun.getQRCode();
                        } else if (diskType === 'quark') {
                            qrData = await DiskLogin.quark.getQRCode();
                        }

                        const qrContainer = document.getElementById('wr-qrcode-img');
                        qrContainer.innerHTML = `<img src="${qrData.imgUrl}" style="width: 100%; height: 100%; border-radius: 8px;">`;

                        qrcodeBtn.textContent = '刷新二维码';
                        qrcodeBtn.disabled = false;

                        UI.showToast('请使用APP扫描二维码', 'info');

                        // 阿里云盘二维码状态轮询
                        if (diskType === 'aliyun' && qrData.ck && qrData.t) {
                            const statusTip = document.createElement('p');
                            statusTip.id = 'wr-qr-status';
                            statusTip.style.cssText = 'color: #666; font-size: 13px; margin-top: 10px;';
                            statusTip.textContent = '等待扫码...';
                            qrContainer.parentNode.appendChild(statusTip);

                            qrPollingTimer = setInterval(async () => {
                                try {
                                    const status = await DiskLogin.aliyun.checkQRStatus(qrData.ck, qrData.t);
                                    const statusEl = document.getElementById('wr-qr-status');

                                    if (status.content && status.content.data) {
                                        const qrStatus = status.content.data.qrCodeStatus;

                                        if (qrStatus === 'NEW') {
                                            if (statusEl) statusEl.textContent = '等待扫码...';
                                        } else if (qrStatus === 'SCANED') {
                                            if (statusEl) statusEl.textContent = '已扫码，请在手机上确认...';
                                            if (statusEl) statusEl.style.color = '#ff9800';
                                        } else if (qrStatus === 'CONFIRMED') {
                                            clearInterval(qrPollingTimer);
                                            if (statusEl) statusEl.textContent = '登录成功！';
                                            if (statusEl) statusEl.style.color = '#4caf50';

                                            // 获取token信息
                                            const bizExt = status.content.data.bizExt;
                                            if (bizExt) {
                                                try {
                                                    const tokenData = JSON.parse(atob(bizExt));
                                                    if (tokenData.pds_login_result) {
                                                        const loginResult = tokenData.pds_login_result;
                                                        CredentialManager.save('aliyun', {
                                                            accessToken: loginResult.accessToken,
                                                            refreshToken: loginResult.refreshToken,
                                                            driveId: loginResult.defaultDriveId,
                                                            username: loginResult.nickName || loginResult.userName,
                                                            userId: loginResult.userId,
                                                            expireTime: Date.now() + (loginResult.expiresIn || 7200) * 1000,
                                                            isLoggedIn: true
                                                        });

                                                        UI.showToast(`登录成功: ${loginResult.nickName || loginResult.userName}`, 'success');

                                                        setTimeout(() => {
                                                            document.getElementById('wr-login-modal')?.remove();
                                                            document.querySelectorAll('.wr-overlay').forEach(o => {
                                                                if (o.style.zIndex === '9999998') o.remove();
                                                            });
                                                            UI.refreshAccountCards();
                                                        }, 1000);
                                                    }
                                                } catch (e) {
                                                    console.error('解析登录结果失败:', e);
                                                }
                                            }
                                        } else if (qrStatus === 'EXPIRED') {
                                            clearInterval(qrPollingTimer);
                                            if (statusEl) statusEl.textContent = '二维码已过期，请刷新';
                                            if (statusEl) statusEl.style.color = '#f44336';
                                        } else if (qrStatus === 'CANCELED') {
                                            clearInterval(qrPollingTimer);
                                            if (statusEl) statusEl.textContent = '已取消登录';
                                            if (statusEl) statusEl.style.color = '#f44336';
                                        }
                                    }
                                } catch (e) {
                                    console.error('轮询状态失败:', e);
                                }
                            }, 2000);
                        }

                    } catch (error) {
                        UI.showToast('获取二维码失败: ' + error.message, 'error');
                        qrcodeBtn.textContent = '重新获取';
                        qrcodeBtn.disabled = false;
                    }
                };
            }

            // 登录提交按钮
            const submitBtn = document.getElementById('wr-login-submit');
            if (submitBtn) {
                submitBtn.onclick = async () => {
                    const cookieInput = document.getElementById('wr-login-cookie');
                    const tokenInput = document.getElementById('wr-login-token');
                    const value = (cookieInput?.value || tokenInput?.value || '').trim();

                    if (!value) {
                        UI.showToast('请输入登录凭证', 'warning');
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<div class="wr-spinner" style="border-color: rgba(255,255,255,0.3); border-top-color: #fff;"></div> 登录中...';

                    try {
                        let result;
                        if (diskType === 'baidu') {
                            result = await DiskLogin.baidu.loginWithCookie(value);
                        } else if (diskType === 'aliyun') {
                            result = await DiskLogin.aliyun.loginWithToken(value);
                        } else if (diskType === 'quark') {
                            result = await DiskLogin.quark.loginWithCookie(value);
                        } else if (diskType === 'tianyi') {
                            result = await DiskLogin.tianyi.loginWithCookie(value);
                        } else if (diskType === '123pan') {
                            // 处理123pan的token，可能带有Bearer前缀
                            const token = value.replace(/^Bearer\s+/i, '');
                            result = await DiskLogin.pan123.loginWithToken(token);
                        } else if (diskType === '115') {
                            result = await DiskLogin['115'].loginWithCookie(value);
                        } else if (diskType === 'xunlei') {
                            result = await DiskLogin.xunlei.loginWithCookie(value);
                        } else {
                            throw new Error('暂不支持该网盘登录');
                        }

                        UI.showToast(`登录成功: ${result.username}`, 'success');

                        // 关闭登录弹窗并刷新界面
                        document.getElementById('wr-login-modal')?.remove();
                        document.querySelectorAll('.wr-overlay').forEach(o => {
                            if (o.style.zIndex === '9999998') o.remove();
                        });

                        // 刷新账号卡片
                        UI.refreshAccountCards();

                    } catch (error) {
                        UI.showToast('登录失败: ' + error.message, 'error');
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '登录';
                    }
                };
            }
        },

        refreshAccountCards: () => {
            const container = document.getElementById('wr-account-grid');
            if (container) {
                container.innerHTML = UI.renderAccountCards(CredentialManager.getAll());
                UI.bindAccountEvents();
            }

            // 同时刷新目标网盘选择器
            const diskGrid = document.getElementById('wr-disk-grid');
            if (diskGrid) {
                const credentials = CredentialManager.getAll();
                CONFIG.supportedDisks.forEach(disk => {
                    const item = diskGrid.querySelector(`[data-disk="${disk.type}"]`);
                    if (item) {
                        const cred = credentials[disk.type];
                        if (cred && cred.isLoggedIn) {
                            item.classList.add('logged-in');
                        } else {
                            item.classList.remove('logged-in');
                        }
                    }
                });
            }
        },

        bindAccountEvents: () => {
            document.querySelectorAll('.wr-account-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const diskType = btn.dataset.disk;
                    const action = btn.dataset.action;

                    if (action === 'login') {
                        UI.showLoginModal(diskType);
                    } else if (action === 'logout') {
                        CredentialManager.remove(diskType);
                        UI.showToast('已退出登录', 'success');
                        UI.refreshAccountCards();
                    }
                };
            });
        },

        bindPanelEvents: () => {
            document.getElementById('wr-close-btn').onclick = UI.closePanel;

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

            // 账号管理事件
            UI.bindAccountEvents();
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
            if (!files || files.length === 0) {
                container.style.display = 'none';
                return;
            }

            container.style.display = 'block';
            container.innerHTML = files.map((file, index) => `
                <div class="wr-file-item">
                    <input type="checkbox" class="wr-file-checkbox" data-index="${index}" checked>
                    <span class="wr-file-name">${file.name || file.server_filename || file.fileName || file.FileName}</span>
                    <span class="wr-file-size">${Utils.formatSize(file.size || file.Size || 0)}</span>
                </div>
            `).join('');

            TransferManager.fileList = files;
        },

        getSelectedFiles: (files) => {
            const checkboxes = document.querySelectorAll('.wr-file-checkbox:checked');
            if (checkboxes.length === 0) return files;
            const selectedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
            return files.filter((_, index) => selectedIndexes.includes(index));
        }
    };

    // ==================== 转存管理器 ====================
    const TransferManager = {
        startTime: 0,
        timer: null,
        fileList: [],
        shareInfo: null,
        shareToken: null,
        quarkToken: null,
        sharePwd: '',

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

            // 检查目标网盘是否已登录
            const cred = CredentialManager.get(targetDiskType);
            if (!cred || !cred.isLoggedIn) {
                UI.showToast(`请先在「账号管理」中登录${targetDiskName}`, 'error');
                return;
            }

            // 检查源网盘和目标网盘是否一致
            if (shareInfo.type !== targetDiskType) {
                UI.showToast(`暂不支持跨网盘转存，请选择${shareInfo.name}作为目标`, 'warning');
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

                UI.updateProgress(20, '正在获取分享信息...');

                switch (shareInfo.type) {
                    case 'aliyun':
                        let shareToken = TransferManager.shareToken;
                        if (!shareToken) {
                            shareToken = await DiskAPI.aliyun.getShareToken(shareInfo.shareId, sharePwd);
                        }

                        UI.updateProgress(40, '正在获取文件列表...');
                        let files = TransferManager.fileList;
                        if (!files || files.length === 0) {
                            files = await DiskAPI.aliyun.getShareFileList(shareInfo.shareId, shareToken);
                        }

                        const selectedFiles = UI.getSelectedFiles(files);
                        if (selectedFiles.length === 0) {
                            throw new Error('请选择要转存的文件');
                        }

                        UI.updateProgress(60, '正在执行转存...');
                        const fileIds = selectedFiles.map(f => f.file_id);
                        result = await DiskAPI.aliyun.saveShare(shareInfo.shareId, shareToken, fileIds);
                        break;

                    case 'quark':
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
                        throw new Error(`暂不支持从${shareInfo.name}转存`);
                }

                UI.updateProgress(100, '转存完成！');

                const duration = Utils.formatTime(Date.now() - TransferManager.startTime);
                clearInterval(TransferManager.timer);

                Utils.saveHistory({
                    id: Utils.generateId(),
                    fileName: shareInfo.shareId,
                    sourceDisk: shareInfo.name,
                    targetDisk: targetDiskName,
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
                    time: new Date().toLocaleString(),
                    duration: duration,
                    success: false
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

    // ==================== 初始化 ====================
    const init = async () => {
        GM_addStyle(STYLES);

        const currentDisk = Utils.getCurrentDisk();
        if (currentDisk) {
            console.log(`${CONFIG.appName}: 检测到 ${currentDisk.name}`);
        }

        UI.createFloatButton();

        GM_registerMenuCommand('打开转存面板', UI.createPanel);
        GM_registerMenuCommand('账号管理', () => {
            UI.createPanel();
            setTimeout(() => {
                document.querySelector('[data-tab="accounts"]')?.click();
            }, 100);
        });

        console.log(`${CONFIG.appName} v${CONFIG.version} 已加载`);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
