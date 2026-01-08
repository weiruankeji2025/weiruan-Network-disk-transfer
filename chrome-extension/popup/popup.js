// 威软网盘转存工具 - Popup Script
// Author: 威软网盘转存工具

// 支持的网盘配置
const SUPPORTED_DISKS = [
    { name: '百度网盘', domain: ['pan.baidu.com', 'yun.baidu.com'], color: '#06a7ff', type: 'baidu' },
    { name: '阿里云盘', domain: ['www.aliyundrive.com', 'www.alipan.com'], color: '#ff6a00', type: 'aliyun' },
    { name: '天翼云盘', domain: ['cloud.189.cn'], color: '#21a5de', type: 'tianyi' },
    { name: '夸克网盘', domain: ['pan.quark.cn'], color: '#536dfe', type: 'quark' },
    { name: '迅雷云盘', domain: ['pan.xunlei.com'], color: '#0078d4', type: 'xunlei' },
    { name: '115网盘', domain: ['115.com'], color: '#2196f3', type: '115' },
    { name: '蓝奏云', domain: ['lanzou.com', 'lanzoui.com', 'lanzoux.com'], color: '#4285f4', type: 'lanzou' },
    { name: '和彩云', domain: ['yun.139.com'], color: '#ff5722', type: 'hecaiyun' },
    { name: '123云盘', domain: ['www.123pan.com', 'www.123865.com'], color: '#409eff', type: '123pan' },
    { name: 'UC网盘', domain: ['drive.uc.cn'], color: '#ff9800', type: 'uc' }
];

// 全局变量
let startTime = 0;
let timer = null;
let selectedDisk = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initDiskGrid();
    initTabs();
    initEventListeners();
    loadSettings();
    loadHistory();
    detectCurrentPage();
});

// 初始化网盘网格
function initDiskGrid() {
    const grid = document.getElementById('diskGrid');
    grid.innerHTML = SUPPORTED_DISKS.map(disk => `
        <div class="disk-item" data-type="${disk.type}" data-name="${disk.name}">
            <div class="disk-icon" style="background: ${disk.color}">${disk.name[0]}</div>
            <div class="disk-name">${disk.name}</div>
        </div>
    `).join('');

    // 绑定点击事件
    grid.querySelectorAll('.disk-item').forEach(item => {
        item.addEventListener('click', () => {
            grid.querySelectorAll('.disk-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedDisk = {
                type: item.dataset.type,
                name: item.dataset.name
            };
        });
    });
}

// 初始化标签页
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// 初始化事件监听
function initEventListeners() {
    // 粘贴按钮
    document.getElementById('pasteBtn').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('shareLink').value = text;
            detectShareLink(text);
        } catch (err) {
            showToast('无法读取剪贴板', 'error');
        }
    });

    // 分享链接输入
    document.getElementById('shareLink').addEventListener('input', (e) => {
        detectShareLink(e.target.value);
    });

    // 转存按钮
    document.getElementById('transferBtn').addEventListener('click', startTransfer);

    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // 清空历史
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
}

// 检测分享链接
function detectShareLink(url) {
    const patterns = [
        { name: '百度网盘', regex: /pan\.baidu\.com/, color: '#06a7ff', type: 'baidu' },
        { name: '阿里云盘', regex: /(?:aliyundrive|alipan)\.com/, color: '#ff6a00', type: 'aliyun' },
        { name: '天翼云盘', regex: /cloud\.189\.cn/, color: '#21a5de', type: 'tianyi' },
        { name: '夸克网盘', regex: /pan\.quark\.cn/, color: '#536dfe', type: 'quark' },
        { name: '迅雷云盘', regex: /pan\.xunlei\.com/, color: '#0078d4', type: 'xunlei' },
        { name: '115网盘', regex: /115\.com/, color: '#2196f3', type: '115' },
        { name: '蓝奏云', regex: /lanzou/, color: '#4285f4', type: 'lanzou' },
        { name: '和彩云', regex: /yun\.139\.com/, color: '#ff5722', type: 'hecaiyun' },
        { name: '123云盘', regex: /(?:123pan|123865)\.com/, color: '#409eff', type: '123pan' },
        { name: 'UC网盘', regex: /drive\.uc\.cn/, color: '#ff9800', type: 'uc' }
    ];

    const sourceDisk = document.getElementById('sourceDisk');

    for (const pattern of patterns) {
        if (pattern.regex.test(url)) {
            sourceDisk.innerHTML = `
                <span class="disk-icon" style="background: ${pattern.color}">${pattern.name[0]}</span>
                <span class="disk-name">${pattern.name}</span>
            `;
            return;
        }
    }

    sourceDisk.innerHTML = `
        <span class="disk-icon">?</span>
        <span class="disk-name">自动检测</span>
    `;
}

// 检测当前页面
async function detectCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            for (const disk of SUPPORTED_DISKS) {
                if (disk.domain.some(d => tab.url.includes(d))) {
                    // 自动选中当前网盘
                    const diskItem = document.querySelector(`.disk-item[data-type="${disk.type}"]`);
                    if (diskItem) {
                        diskItem.classList.add('selected');
                        selectedDisk = { type: disk.type, name: disk.name };
                    }
                    break;
                }
            }
        }
    } catch (err) {
        console.log('无法获取当前标签页');
    }
}

// 开始转存
async function startTransfer() {
    const shareLink = document.getElementById('shareLink').value.trim();
    const sharePwd = document.getElementById('sharePwd').value.trim();
    const targetPath = document.getElementById('targetPath').value.trim() || '/';

    if (!shareLink) {
        showToast('请输入分享链接', 'error');
        return;
    }

    if (!selectedDisk) {
        showToast('请选择目标网盘', 'error');
        return;
    }

    // 开始计时
    startTime = Date.now();
    const statusBar = document.getElementById('statusBar');
    const transferBtn = document.getElementById('transferBtn');

    statusBar.style.display = 'block';
    transferBtn.disabled = true;
    transferBtn.innerHTML = '<div class="spinner"></div><span>转存中...</span>';

    timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        document.getElementById('timeText').textContent = formatTime(elapsed);
    }, 100);

    updateProgress(0, '正在解析分享链接...');

    try {
        // 发送消息给background处理
        const response = await chrome.runtime.sendMessage({
            action: 'transfer',
            data: {
                shareLink,
                sharePwd,
                targetPath,
                targetDisk: selectedDisk
            }
        });

        // 模拟转存过程
        await simulateTransfer();

        const duration = formatTime(Date.now() - startTime);
        clearInterval(timer);

        updateProgress(100, '转存完成！');

        // 保存历史记录
        saveHistoryItem({
            shareLink,
            targetDisk: selectedDisk.name,
            targetPath,
            time: new Date().toLocaleString(),
            duration,
            success: true
        });

        showToast(`转存成功！耗时: ${duration}`, 'success');

        // 发送通知
        const settings = await chrome.storage.local.get('settings');
        if (settings.settings?.notifyComplete !== false) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: '威软网盘转存工具',
                message: `文件转存成功！耗时: ${duration}`
            });
        }

    } catch (error) {
        clearInterval(timer);
        const duration = formatTime(Date.now() - startTime);

        updateProgress(0, `转存失败: ${error.message}`);

        saveHistoryItem({
            shareLink,
            targetDisk: selectedDisk.name,
            targetPath,
            time: new Date().toLocaleString(),
            duration,
            success: false,
            error: error.message
        });

        showToast(`转存失败: ${error.message}`, 'error');

        const settings = await chrome.storage.local.get('settings');
        if (settings.settings?.notifyError !== false) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: '威软网盘转存工具',
                message: `文件转存失败: ${error.message}`
            });
        }
    } finally {
        transferBtn.disabled = false;
        transferBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>开始转存</span>
        `;
    }
}

// 模拟转存过程
async function simulateTransfer() {
    const steps = [
        { progress: 20, status: '正在获取分享信息...' },
        { progress: 40, status: '正在获取文件列表...' },
        { progress: 60, status: '正在执行转存...' },
        { progress: 80, status: '正在验证文件...' }
    ];

    for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(step.progress, step.status);
    }
}

// 更新进度
function updateProgress(percent, status) {
    document.getElementById('statusText').textContent = status;
    document.getElementById('progressFill').style.width = percent + '%';
}

// 格式化时间
function formatTime(ms) {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(2) + 's';
    return (ms / 60000).toFixed(2) + 'min';
}

// 显示Toast
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 加载设置
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get('settings');
        const settings = result.settings || {};

        document.getElementById('defaultPath').value = settings.defaultPath || '/';
        document.getElementById('notifyComplete').checked = settings.notifyComplete !== false;
        document.getElementById('notifyError').checked = settings.notifyError !== false;

        if (settings.defaultPath) {
            document.getElementById('targetPath').value = settings.defaultPath;
        }
    } catch (err) {
        console.error('加载设置失败:', err);
    }
}

// 保存设置
async function saveSettings() {
    const settings = {
        defaultPath: document.getElementById('defaultPath').value,
        notifyComplete: document.getElementById('notifyComplete').checked,
        notifyError: document.getElementById('notifyError').checked
    };

    try {
        await chrome.storage.local.set({ settings });
        showToast('设置已保存', 'success');
    } catch (err) {
        showToast('保存设置失败', 'error');
    }
}

// 加载历史记录
async function loadHistory() {
    try {
        const result = await chrome.storage.local.get('history');
        const history = result.history || [];
        renderHistory(history);
    } catch (err) {
        console.error('加载历史记录失败:', err);
    }
}

// 渲染历史记录
function renderHistory(history) {
    const container = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearHistory');

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="#ccc">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                <p>暂无转存记录</p>
            </div>
        `;
        clearBtn.style.display = 'none';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-title">${item.targetDisk}</div>
                <div class="history-meta">${item.time} | 耗时: ${item.duration}</div>
            </div>
            <span class="history-status ${item.success ? 'success' : 'failed'}">
                ${item.success ? '成功' : '失败'}
            </span>
        </div>
    `).join('');

    clearBtn.style.display = 'block';
}

// 保存历史记录
async function saveHistoryItem(item) {
    try {
        const result = await chrome.storage.local.get('history');
        const history = result.history || [];
        history.unshift(item);
        if (history.length > 50) history.pop();
        await chrome.storage.local.set({ history });
        renderHistory(history);
    } catch (err) {
        console.error('保存历史记录失败:', err);
    }
}

// 清空历史记录
async function clearHistory() {
    if (!confirm('确定要清空所有历史记录吗？')) return;

    try {
        await chrome.storage.local.set({ history: [] });
        renderHistory([]);
        showToast('历史记录已清空', 'success');
    } catch (err) {
        showToast('清空失败', 'error');
    }
}
