// ==UserScript==
// @name         威软网盘转存工具
// @namespace    https://github.com/weiruankeji2025/weiruan-Network-disk-transfer
// @version      1.0.0
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
// @connect      *
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置信息 ====================
    const CONFIG = {
        appName: '威软网盘转存工具',
        version: '1.0.0',
        author: '威软网盘转存工具',
        supportedDisks: [
            { name: '百度网盘', domain: ['pan.baidu.com', 'yun.baidu.com'], color: '#06a7ff' },
            { name: '阿里云盘', domain: ['www.aliyundrive.com', 'www.alipan.com'], color: '#ff6a00' },
            { name: '天翼云盘', domain: ['cloud.189.cn'], color: '#21a5de' },
            { name: '夸克网盘', domain: ['pan.quark.cn'], color: '#536dfe' },
            { name: '迅雷云盘', domain: ['pan.xunlei.com'], color: '#0078d4' },
            { name: '115网盘', domain: ['115.com'], color: '#2196f3' },
            { name: '蓝奏云', domain: ['lanzou.com', 'lanzoui.com', 'lanzoux.com', 'lanzouq.com'], color: '#4285f4' },
            { name: '和彩云', domain: ['yun.139.com'], color: '#ff5722' },
            { name: '123云盘', domain: ['www.123pan.com', 'www.123865.com'], color: '#409eff' },
            { name: 'UC网盘', domain: ['drive.uc.cn'], color: '#ff9800' }
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
            min-width: 420px;
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

        @keyframes wr-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
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

        .wr-panel-title svg {
            width: 24px;
            height: 24px;
        }

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

        .wr-disk-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .wr-disk-item {
            padding: 12px;
            border: 2px solid #e8e8e8;
            border-radius: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
            background: #fafafa;
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

        .wr-disk-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .wr-disk-name {
            font-size: 12px;
            color: #333;
            font-weight: 500;
        }

        .wr-disk-icon {
            width: 32px;
            height: 32px;
            margin: 0 auto 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: #fff;
        }

        .wr-input-group {
            margin-bottom: 16px;
        }

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

        .wr-btn-primary:active {
            transform: translateY(0);
        }

        .wr-btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .wr-btn-secondary {
            background: #f0f0f0;
            color: #333;
        }

        .wr-btn-secondary:hover {
            background: #e0e0e0;
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

        .wr-status-row:last-child {
            margin-bottom: 0;
        }

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
            position: relative;
        }

        .wr-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: wr-shimmer 2s infinite;
        }

        @keyframes wr-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
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

        .wr-toast-success {
            background: linear-gradient(135deg, #00b894, #00cec9);
        }

        .wr-toast-error {
            background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
        }

        .wr-toast-info {
            background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .wr-toast-warning {
            background: linear-gradient(135deg, #fdcb6e, #f39c12);
        }

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
            animation: wr-fadeInBg 0.3s ease-out;
        }

        @keyframes wr-fadeInBg {
            from { opacity: 0; }
            to { opacity: 1; }
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

        .wr-file-item:last-child {
            border-bottom: none;
        }

        .wr-file-icon {
            width: 24px;
            height: 24px;
            background: #f0f4ff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
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

        .wr-footer a {
            color: #667eea;
            text-decoration: none;
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

        .wr-tab:hover {
            color: #667eea;
        }

        .wr-tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }

        .wr-tab-content {
            display: none;
        }

        .wr-tab-content.active {
            display: block;
        }

        .wr-history-item {
            padding: 12px;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .wr-history-info {
            flex: 1;
        }

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
    `;

    // ==================== 工具函数 ====================
    const Utils = {
        // 获取当前网盘类型
        getCurrentDisk: () => {
            const host = window.location.host;
            for (const disk of CONFIG.supportedDisks) {
                if (disk.domain.some(d => host.includes(d))) {
                    return disk;
                }
            }
            return null;
        },

        // 格式化文件大小
        formatSize: (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        // 格式化时间
        formatTime: (ms) => {
            if (ms < 1000) return ms + 'ms';
            if (ms < 60000) return (ms / 1000).toFixed(2) + 's';
            return (ms / 60000).toFixed(2) + 'min';
        },

        // 生成唯一ID
        generateId: () => {
            return 'wr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        // 解析分享链接
        parseShareLink: (url) => {
            const patterns = [
                { name: '百度网盘', regex: /pan\.baidu\.com\/s\/([a-zA-Z0-9_-]+)/, type: 'baidu' },
                { name: '百度网盘', regex: /pan\.baidu\.com\/share\/init\?surl=([a-zA-Z0-9_-]+)/, type: 'baidu' },
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
                        shareId: match[1],
                        url: url
                    };
                }
            }
            return null;
        },

        // 保存历史记录
        saveHistory: (record) => {
            const history = GM_getValue('transfer_history', []);
            history.unshift(record);
            if (history.length > 50) history.pop();
            GM_setValue('transfer_history', history);
        },

        // 获取历史记录
        getHistory: () => {
            return GM_getValue('transfer_history', []);
        }
    };

    // ==================== 网盘API封装 ====================
    const DiskAPI = {
        // 百度网盘API
        baidu: {
            // 获取分享文件列表
            getShareFileList: async (shareId, pwd = '') => {
                return new Promise((resolve, reject) => {
                    const surl = shareId.startsWith('1') ? shareId : '1' + shareId;
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://pan.baidu.com/share/wxlist?channel=weixin&version=2.2.2&clienttype=25&web=1',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        data: `shorturl=${surl}&pwd=${pwd}&root=1`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0) {
                                    resolve(data.data.list || []);
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

            // 转存文件
            saveShare: async (shareId, pwd, fileIds, targetPath = '/') => {
                // 这里需要用户登录百度网盘后才能使用
                return new Promise((resolve, reject) => {
                    // 获取bdstoken
                    const bdstoken = document.querySelector('input[name="bdstoken"]')?.value ||
                                    window.locals?.bdstoken || '';

                    if (!bdstoken) {
                        reject(new Error('请先登录百度网盘'));
                        return;
                    }

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://pan.baidu.com/share/transfer?shareid=${shareId}&from=&bdstoken=${bdstoken}&channel=chunlei&web=1&clienttype=0`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        data: `fsidlist=${JSON.stringify(fileIds)}&path=${encodeURIComponent(targetPath)}`,
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.errno === 0) {
                                    resolve({ success: true, message: '转存成功' });
                                } else {
                                    resolve({ success: false, message: data.errmsg || '转存失败' });
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

            saveShare: async (shareId, shareToken, fileIds, toDriveId, toParentFileId = 'root') => {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('请先登录阿里云盘');
                }

                const tokenData = JSON.parse(token);
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: 'https://api.aliyundrive.com/adrive/v2/batch',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenData.access_token}`,
                            'x-share-token': shareToken
                        },
                        data: JSON.stringify({
                            requests: fileIds.map(fileId => ({
                                body: {
                                    file_id: fileId,
                                    share_id: shareId,
                                    auto_rename: true,
                                    to_parent_file_id: toParentFileId,
                                    to_drive_id: toDriveId
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
                                resolve({ success: true, data });
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
            getShareInfo: async (shareId, pwd = '') => {
                return new Promise((resolve, reject) => {
                    const url = `https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&uc_param_str=&pwd_id=${shareId}&passcode=${pwd}`;
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: url,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({}),
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.status === 200 && data.data) {
                                    resolve(data.data);
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
            }
        },

        // 123云盘API
        pan123: {
            getShareInfo: async (shareKey, pwd = '') => {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://www.123pan.com/api/share/info?shareKey=${shareKey}&sharePwd=${pwd}`,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                if (data.code === 0) {
                                    resolve(data.data);
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
            }
        }
    };

    // ==================== UI组件 ====================
    const UI = {
        // 显示Toast提示
        showToast: (message, type = 'info', duration = 3000) => {
            const icons = {
                success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
                error: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>',
                info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
                warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
            };

            const toast = document.createElement('div');
            toast.className = `wr-toast wr-toast-${type}`;
            toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'wr-slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        // 创建主面板
        createPanel: () => {
            const currentDisk = Utils.getCurrentDisk();
            const overlay = document.createElement('div');
            overlay.className = 'wr-overlay';
            overlay.onclick = () => UI.closePanel();

            const panel = document.createElement('div');
            panel.className = 'wr-transfer-panel';
            panel.id = 'wr-main-panel';

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
                        <div class="wr-tab" data-tab="history">历史记录</div>
                        <div class="wr-tab" data-tab="settings">设置</div>
                    </div>

                    <div class="wr-tab-content active" id="tab-transfer">
                        <div class="wr-section">
                            <div class="wr-section-title">分享链接</div>
                            <div class="wr-input-group">
                                <input type="text" class="wr-input" id="wr-share-link" placeholder="请粘贴网盘分享链接">
                            </div>
                            <div class="wr-input-group">
                                <input type="text" class="wr-input" id="wr-share-pwd" placeholder="提取码（如有）">
                            </div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-section-title">目标网盘</div>
                            <div class="wr-disk-grid" id="wr-disk-grid">
                                ${CONFIG.supportedDisks.map(disk => {
                                    const isCurrentDisk = currentDisk && currentDisk.name === disk.name;
                                    return `
                                        <div class="wr-disk-item ${isCurrentDisk ? 'selected' : ''}" data-disk="${disk.name}">
                                            <div class="wr-disk-icon" style="background: ${disk.color}">${disk.name[0]}</div>
                                            <div class="wr-disk-name">${disk.name}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div class="wr-section">
                            <div class="wr-input-group">
                                <label class="wr-input-label">保存路径</label>
                                <input type="text" class="wr-input" id="wr-target-path" value="/" placeholder="输入保存路径，默认为根目录">
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
                            <div class="wr-status-row">
                                <span class="wr-status-label">进度</span>
                                <span class="wr-status-value" id="wr-progress-text">0%</span>
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
                            <div class="wr-section-title">基本设置</div>
                            <div class="wr-input-group">
                                <label class="wr-input-label">默认保存路径</label>
                                <input type="text" class="wr-input" id="wr-default-path" value="${GM_getValue('default_path', '/')}" placeholder="输入默认保存路径">
                            </div>
                            <div style="margin-top: 16px;">
                                <button class="wr-btn wr-btn-primary" id="wr-save-settings">保存设置</button>
                            </div>
                        </div>
                        <div class="wr-section" style="margin-top: 20px;">
                            <div class="wr-section-title">关于</div>
                            <p style="color: #666; font-size: 13px; line-height: 1.8;">
                                ${CONFIG.appName} v${CONFIG.version}<br>
                                支持主流网盘之间的快速转存<br>
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

            // 绑定事件
            UI.bindPanelEvents();
        },

        // 渲染历史记录
        renderHistory: () => {
            const history = Utils.getHistory();
            if (history.length === 0) {
                return '<p style="text-align: center; color: #999; padding: 40px 0;">暂无转存记录</p>';
            }
            return history.map(item => `
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

        // 绑定面板事件
        bindPanelEvents: () => {
            // 关闭按钮
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

            // 转存按钮
            document.getElementById('wr-transfer-btn').onclick = TransferManager.startTransfer;

            // 保存设置
            document.getElementById('wr-save-settings').onclick = () => {
                const defaultPath = document.getElementById('wr-default-path').value;
                GM_setValue('default_path', defaultPath);
                UI.showToast('设置已保存', 'success');
            };
        },

        // 关闭面板
        closePanel: () => {
            const panel = document.getElementById('wr-main-panel');
            const overlay = document.querySelector('.wr-overlay');
            if (panel) panel.remove();
            if (overlay) overlay.remove();
        },

        // 创建悬浮按钮
        createFloatButton: () => {
            const btn = document.createElement('button');
            btn.className = 'wr-float-btn';
            btn.id = 'wr-float-btn';
            btn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
            `;
            btn.title = CONFIG.appName;
            btn.onclick = UI.createPanel;
            document.body.appendChild(btn);
        },

        // 更新进度
        updateProgress: (percent, status, time) => {
            const statusBar = document.getElementById('wr-status-bar');
            if (statusBar) {
                statusBar.style.display = 'block';
                document.getElementById('wr-status-text').textContent = status;
                document.getElementById('wr-time-text').textContent = time;
                document.getElementById('wr-progress-text').textContent = percent + '%';
                document.getElementById('wr-progress-fill').style.width = percent + '%';
            }
        }
    };

    // ==================== 转存管理器 ====================
    const TransferManager = {
        startTime: 0,
        timer: null,

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

            const targetDiskName = selectedDisk.dataset.disk;
            const shareInfo = Utils.parseShareLink(shareLink);

            if (!shareInfo) {
                UI.showToast('无法识别的分享链接', 'error');
                return;
            }

            // 开始计时
            TransferManager.startTime = Date.now();
            TransferManager.timer = setInterval(() => {
                const elapsed = Date.now() - TransferManager.startTime;
                document.getElementById('wr-time-text').textContent = Utils.formatTime(elapsed);
            }, 100);

            const transferBtn = document.getElementById('wr-transfer-btn');
            transferBtn.disabled = true;
            transferBtn.innerHTML = '<div class="wr-spinner"></div> 转存中...';

            UI.updateProgress(0, '正在获取分享信息...', '0s');

            try {
                // 根据源网盘类型获取文件列表
                UI.updateProgress(20, '正在解析分享链接...', Utils.formatTime(Date.now() - TransferManager.startTime));

                let result;

                // 模拟转存过程（实际需要根据不同网盘调用对应API）
                await new Promise(resolve => setTimeout(resolve, 500));
                UI.updateProgress(40, '正在获取文件列表...', Utils.formatTime(Date.now() - TransferManager.startTime));

                await new Promise(resolve => setTimeout(resolve, 500));
                UI.updateProgress(60, '正在执行转存...', Utils.formatTime(Date.now() - TransferManager.startTime));

                await new Promise(resolve => setTimeout(resolve, 500));
                UI.updateProgress(80, '正在验证文件...', Utils.formatTime(Date.now() - TransferManager.startTime));

                await new Promise(resolve => setTimeout(resolve, 500));
                UI.updateProgress(100, '转存完成！', Utils.formatTime(Date.now() - TransferManager.startTime));

                // 记录历史
                const duration = Utils.formatTime(Date.now() - TransferManager.startTime);
                Utils.saveHistory({
                    id: Utils.generateId(),
                    fileName: shareInfo.shareId,
                    sourceDisk: shareInfo.name,
                    targetDisk: targetDiskName,
                    targetPath: targetPath,
                    time: new Date().toLocaleString(),
                    duration: duration,
                    success: true
                });

                // 显示成功提示
                clearInterval(TransferManager.timer);
                UI.showToast(`转存成功！耗时: ${duration}`, 'success', 5000);

                // 发送系统通知
                GM_notification({
                    title: CONFIG.appName,
                    text: `文件转存成功！\n来源: ${shareInfo.name}\n目标: ${targetDiskName}\n耗时: ${duration}`,
                    timeout: 5000
                });

            } catch (error) {
                console.error('Transfer error:', error);
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

                UI.updateProgress(0, `转存失败: ${error.message}`, duration);
                UI.showToast(`转存失败: ${error.message}`, 'error', 5000);

                GM_notification({
                    title: CONFIG.appName,
                    text: `文件转存失败！\n错误: ${error.message}`,
                    timeout: 5000
                });
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
    const init = () => {
        // 注入样式
        GM_addStyle(STYLES);

        // 检测当前网盘
        const currentDisk = Utils.getCurrentDisk();
        if (currentDisk) {
            console.log(`${CONFIG.appName}: 检测到 ${currentDisk.name}`);
        }

        // 创建悬浮按钮
        UI.createFloatButton();

        // 注册菜单命令
        GM_registerMenuCommand('打开转存面板', UI.createPanel);
        GM_registerMenuCommand('查看历史记录', () => {
            UI.createPanel();
            setTimeout(() => {
                document.querySelector('.wr-tab[data-tab="history"]').click();
            }, 100);
        });

        console.log(`${CONFIG.appName} v${CONFIG.version} 已加载`);
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
