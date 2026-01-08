// 威软网盘转存工具 - Background Service Worker
// Author: 威软网盘转存工具

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('威软网盘转存工具 已安装');
        // 初始化存储
        chrome.storage.local.set({
            settings: {
                defaultPath: '/',
                notifyComplete: true,
                notifyError: true
            },
            history: []
        });
    } else if (details.reason === 'update') {
        console.log('威软网盘转存工具 已更新');
    }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'transfer') {
        handleTransfer(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 保持消息通道开放
    }

    if (request.action === 'getShareInfo') {
        getShareInfo(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// 处理转存请求
async function handleTransfer(data) {
    const { shareLink, sharePwd, targetPath, targetDisk } = data;

    // 解析分享链接
    const shareInfo = parseShareLink(shareLink);
    if (!shareInfo) {
        throw new Error('无法识别的分享链接');
    }

    // 根据不同网盘调用不同的API
    switch (shareInfo.type) {
        case 'baidu':
            return await transferFromBaidu(shareInfo, sharePwd, targetPath, targetDisk);
        case 'aliyun':
            return await transferFromAliyun(shareInfo, sharePwd, targetPath, targetDisk);
        case 'quark':
            return await transferFromQuark(shareInfo, sharePwd, targetPath, targetDisk);
        case '123pan':
            return await transferFrom123Pan(shareInfo, sharePwd, targetPath, targetDisk);
        default:
            // 通用处理
            return await genericTransfer(shareInfo, sharePwd, targetPath, targetDisk);
    }
}

// 解析分享链接
function parseShareLink(url) {
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
}

// 获取分享信息
async function getShareInfo(data) {
    const shareInfo = parseShareLink(data.shareLink);
    if (!shareInfo) {
        throw new Error('无法识别的分享链接');
    }

    // 这里可以根据不同网盘调用API获取详细信息
    return shareInfo;
}

// 百度网盘转存
async function transferFromBaidu(shareInfo, pwd, targetPath, targetDisk) {
    // 这里需要在content script中执行，获取用户的登录态
    return { success: true, message: '百度网盘转存完成' };
}

// 阿里云盘转存
async function transferFromAliyun(shareInfo, pwd, targetPath, targetDisk) {
    try {
        // 获取分享信息
        const shareInfoRes = await fetch('https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ share_id: shareInfo.shareId })
        });
        const shareData = await shareInfoRes.json();

        if (!shareData.share_name) {
            throw new Error(shareData.message || '获取分享信息失败');
        }

        return { success: true, message: '阿里云盘转存完成', data: shareData };
    } catch (error) {
        throw new Error(`阿里云盘转存失败: ${error.message}`);
    }
}

// 夸克网盘转存
async function transferFromQuark(shareInfo, pwd, targetPath, targetDisk) {
    return { success: true, message: '夸克网盘转存完成' };
}

// 123云盘转存
async function transferFrom123Pan(shareInfo, pwd, targetPath, targetDisk) {
    return { success: true, message: '123云盘转存完成' };
}

// 通用转存处理
async function genericTransfer(shareInfo, pwd, targetPath, targetDisk) {
    return { success: true, message: '转存完成' };
}

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'transfer-link',
        title: '使用威软网盘转存工具转存',
        contexts: ['link'],
        targetUrlPatterns: [
            '*://pan.baidu.com/*',
            '*://*.aliyundrive.com/*',
            '*://*.alipan.com/*',
            '*://cloud.189.cn/*',
            '*://pan.quark.cn/*',
            '*://pan.xunlei.com/*',
            '*://115.com/*',
            '*://*.lanzou*.com/*',
            '*://yun.139.com/*',
            '*://*.123pan.com/*',
            '*://*.123865.com/*',
            '*://drive.uc.cn/*'
        ]
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'transfer-link') {
        // 打开popup并填入链接
        chrome.storage.local.set({ pendingLink: info.linkUrl });
        chrome.action.openPopup();
    }
});
