// 威软网盘转存工具 - Content Script
// Author: 威软网盘转存工具

(function() {
    'use strict';

    const CONFIG = {
        appName: '威软网盘转存工具',
        version: '1.0.0'
    };

    // 支持的网盘配置
    const SUPPORTED_DISKS = [
        { name: '百度网盘', domain: ['pan.baidu.com', 'yun.baidu.com'], color: '#06a7ff' },
        { name: '阿里云盘', domain: ['www.aliyundrive.com', 'www.alipan.com'], color: '#ff6a00' },
        { name: '天翼云盘', domain: ['cloud.189.cn'], color: '#21a5de' },
        { name: '夸克网盘', domain: ['pan.quark.cn'], color: '#536dfe' },
        { name: '迅雷云盘', domain: ['pan.xunlei.com'], color: '#0078d4' },
        { name: '115网盘', domain: ['115.com'], color: '#2196f3' },
        { name: '蓝奏云', domain: ['lanzou.com', 'lanzoui.com', 'lanzoux.com'], color: '#4285f4' },
        { name: '和彩云', domain: ['yun.139.com'], color: '#ff5722' },
        { name: '123云盘', domain: ['www.123pan.com', 'www.123865.com'], color: '#409eff' },
        { name: 'UC网盘', domain: ['drive.uc.cn'], color: '#ff9800' }
    ];

    // 获取当前网盘
    function getCurrentDisk() {
        const host = window.location.host;
        for (const disk of SUPPORTED_DISKS) {
            if (disk.domain.some(d => host.includes(d))) {
                return disk;
            }
        }
        return null;
    }

    // 创建悬浮按钮
    function createFloatButton() {
        const btn = document.createElement('div');
        btn.id = 'wr-float-btn';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;
        btn.title = CONFIG.appName;
        btn.onclick = () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        };
        document.body.appendChild(btn);
    }

    // 显示Toast提示
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `wr-toast wr-toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'wr-slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 获取选中的文件
    function getSelectedFiles() {
        const currentDisk = getCurrentDisk();
        if (!currentDisk) return [];

        let files = [];

        // 根据不同网盘获取选中文件
        switch (currentDisk.name) {
            case '百度网盘':
                files = getBaiduSelectedFiles();
                break;
            case '阿里云盘':
                files = getAliyunSelectedFiles();
                break;
            case '夸克网盘':
                files = getQuarkSelectedFiles();
                break;
            default:
                files = getGenericSelectedFiles();
        }

        return files;
    }

    // 百度网盘获取选中文件
    function getBaiduSelectedFiles() {
        const files = [];
        try {
            // 尝试从页面获取选中的文件
            const selectedItems = document.querySelectorAll('.wp-s-list-item--selected, .u-brow-active');
            selectedItems.forEach(item => {
                const nameEl = item.querySelector('.filename, .text');
                const sizeEl = item.querySelector('.size, .brow-size');
                if (nameEl) {
                    files.push({
                        name: nameEl.textContent.trim(),
                        size: sizeEl ? sizeEl.textContent.trim() : '',
                        fsid: item.dataset?.fsid || ''
                    });
                }
            });
        } catch (e) {
            console.log('获取百度网盘文件失败:', e);
        }
        return files;
    }

    // 阿里云盘获取选中文件
    function getAliyunSelectedFiles() {
        const files = [];
        try {
            const selectedItems = document.querySelectorAll('[data-is-checked="true"], .file-item--selected');
            selectedItems.forEach(item => {
                const nameEl = item.querySelector('.file-name, [class*="fileName"]');
                if (nameEl) {
                    files.push({
                        name: nameEl.textContent.trim(),
                        fileId: item.dataset?.fileId || ''
                    });
                }
            });
        } catch (e) {
            console.log('获取阿里云盘文件失败:', e);
        }
        return files;
    }

    // 夸克网盘获取选中文件
    function getQuarkSelectedFiles() {
        const files = [];
        try {
            const selectedItems = document.querySelectorAll('.file-item.selected, [class*="selected"]');
            selectedItems.forEach(item => {
                const nameEl = item.querySelector('.file-name');
                if (nameEl) {
                    files.push({
                        name: nameEl.textContent.trim()
                    });
                }
            });
        } catch (e) {
            console.log('获取夸克网盘文件失败:', e);
        }
        return files;
    }

    // 通用获取选中文件
    function getGenericSelectedFiles() {
        const files = [];
        try {
            const selectedItems = document.querySelectorAll('.selected, [class*="selected"], [class*="checked"]');
            selectedItems.forEach(item => {
                const nameEl = item.querySelector('[class*="name"], [class*="title"]');
                if (nameEl) {
                    files.push({
                        name: nameEl.textContent.trim()
                    });
                }
            });
        } catch (e) {
            console.log('获取文件失败:', e);
        }
        return files;
    }

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getSelectedFiles') {
            const files = getSelectedFiles();
            sendResponse({ files });
        }

        if (request.action === 'getCurrentDisk') {
            const disk = getCurrentDisk();
            sendResponse({ disk });
        }

        if (request.action === 'showToast') {
            showToast(request.message, request.type);
        }

        if (request.action === 'transferComplete') {
            showToast(`转存成功！耗时: ${request.duration}`, 'success');
        }

        if (request.action === 'transferError') {
            showToast(`转存失败: ${request.error}`, 'error');
        }
    });

    // 快捷键支持
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+T 快速打开转存面板
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            chrome.runtime.sendMessage({ action: 'openPopup' });
        }
    });

    // 初始化
    function init() {
        const currentDisk = getCurrentDisk();
        if (currentDisk) {
            console.log(`${CONFIG.appName}: 检测到 ${currentDisk.name}`);
            createFloatButton();
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
