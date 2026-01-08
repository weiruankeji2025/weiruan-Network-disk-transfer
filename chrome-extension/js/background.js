// 威软网盘转存工具 - Background Service Worker
// Author: 威软网盘转存工具
// Version: 1.1.0

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('威软网盘转存工具 已安装');
        chrome.storage.local.set({
            settings: {
                defaultPath: '/',
                notifyComplete: true,
                notifyError: true
            },
            history: [],
            loginStatus: {}
        });
    }
});

// 登录检测器
const LoginChecker = {
    loginStatus: {},

    // 检测百度网盘登录状态
    async checkBaidu() {
        try {
            const response = await fetch('https://pan.baidu.com/api/loginStatus?clienttype=0&web=1', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.errno === 0 && data.login_info) {
                this.loginStatus.baidu = {
                    isLoggedIn: true,
                    username: data.login_info.username || '已登录',
                    uk: data.login_info.uk
                };
                return true;
            }
        } catch (e) {}
        this.loginStatus.baidu = { isLoggedIn: false };
        return false;
    },

    // 检测夸克网盘登录状态
    async checkQuark() {
        try {
            const response = await fetch('https://drive.quark.cn/1/clouddrive/member/info?pr=ucpro&fr=pc', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.status === 200 && data.data) {
                this.loginStatus.quark = {
                    isLoggedIn: true,
                    username: data.data.nickname || '已登录'
                };
                return true;
            }
        } catch (e) {}
        this.loginStatus.quark = { isLoggedIn: false };
        return false;
    },

    // 检测天翼云盘登录状态
    async checkTianyi() {
        try {
            const response = await fetch('https://cloud.189.cn/api/portal/getUserBriefInfo.action', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.res_code === 0) {
                this.loginStatus.tianyi = {
                    isLoggedIn: true,
                    username: data.nickName || '已登录'
                };
                return true;
            }
        } catch (e) {}
        this.loginStatus.tianyi = { isLoggedIn: false };
        return false;
    },

    // 检测115网盘登录状态
    async check115() {
        try {
            const response = await fetch('https://my.115.com/?ct=ajax&ac=nav', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.data && data.data.user_id) {
                this.loginStatus['115'] = {
                    isLoggedIn: true,
                    username: data.data.user_name || '已登录'
                };
                return true;
            }
        } catch (e) {}
        this.loginStatus['115'] = { isLoggedIn: false };
        return false;
    },

    // 检测所有网盘登录状态
    async checkAll() {
        await Promise.all([
            this.checkBaidu(),
            this.checkQuark(),
            this.checkTianyi(),
            this.check115()
        ]);

        // 保存到storage
        chrome.storage.local.set({ loginStatus: this.loginStatus });
        return this.loginStatus;
    },

    // 获取登录页面URL
    getLoginUrl(diskType) {
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

// 解析分享链接
function parseShareLink(url) {
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
}

// 网盘API
const DiskAPI = {
    // 阿里云盘
    aliyun: {
        async getShareToken(shareId, sharePwd = '') {
            const response = await fetch('https://api.aliyundrive.com/v2/share_link/get_share_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ share_id: shareId, share_pwd: sharePwd })
            });
            const data = await response.json();
            if (data.share_token) {
                return data.share_token;
            }
            throw new Error(data.message || '获取分享令牌失败');
        },

        async getShareFileList(shareId, shareToken, parentFileId = 'root') {
            const response = await fetch('https://api.aliyundrive.com/adrive/v2/file/list_by_share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-share-token': shareToken
                },
                body: JSON.stringify({
                    share_id: shareId,
                    parent_file_id: parentFileId,
                    limit: 100
                })
            });
            const data = await response.json();
            if (data.items) {
                return data.items;
            }
            throw new Error(data.message || '获取文件列表失败');
        }
    },

    // 夸克网盘
    quark: {
        async getShareToken(pwdId, passcode = '') {
            const response = await fetch('https://drive.quark.cn/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ pwd_id: pwdId, passcode: passcode })
            });
            const data = await response.json();
            if (data.status === 200 && data.data) {
                return data.data;
            }
            throw new Error(data.message || '获取分享信息失败');
        },

        async getShareFileList(pwdId, stoken) {
            const response = await fetch(`https://drive.quark.cn/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc&pwd_id=${pwdId}&stoken=${encodeURIComponent(stoken)}&pdir_fid=0&force=0&_fetch_share=1`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.status === 200 && data.data) {
                return data.data.list || [];
            }
            throw new Error(data.message || '获取文件列表失败');
        },

        async saveShare(pwdId, stoken, fids) {
            const response = await fetch('https://drive.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    fid_list: fids,
                    fid_token_list: fids.map(() => ''),
                    to_pdir_fid: '0',
                    pwd_id: pwdId,
                    stoken: stoken,
                    pdir_fid: '0',
                    scene: 'link'
                })
            });
            const data = await response.json();
            if (data.status === 200) {
                return { success: true, message: '转存成功' };
            }
            return { success: false, message: data.message || '转存失败' };
        }
    }
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkLoginStatus') {
        LoginChecker.checkAll().then(status => {
            sendResponse({ success: true, data: status });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    if (request.action === 'parseShareLink') {
        const result = parseShareLink(request.url);
        sendResponse({ success: !!result, data: result });
        return true;
    }

    if (request.action === 'transfer') {
        handleTransfer(request.data).then(result => {
            sendResponse({ success: true, data: result });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    if (request.action === 'getLoginUrl') {
        const url = LoginChecker.getLoginUrl(request.diskType);
        sendResponse({ success: true, data: url });
        return true;
    }
});

// 处理转存请求
async function handleTransfer(data) {
    const { shareLink, sharePwd, targetPath, targetDisk } = data;

    const shareInfo = parseShareLink(shareLink);
    if (!shareInfo) {
        throw new Error('无法识别的分享链接');
    }

    // 检查目标网盘登录状态
    await LoginChecker.checkAll();
    const targetLoginInfo = LoginChecker.loginStatus[targetDisk.type];
    if (!targetLoginInfo || !targetLoginInfo.isLoggedIn) {
        throw new Error(`请先登录${targetDisk.name}`);
    }

    // 根据源网盘类型执行转存
    switch (shareInfo.type) {
        case 'quark':
            const quarkToken = await DiskAPI.quark.getShareToken(shareInfo.shareId, sharePwd);
            const quarkFiles = await DiskAPI.quark.getShareFileList(shareInfo.shareId, quarkToken.stoken);
            const fids = quarkFiles.map(f => f.fid);
            return await DiskAPI.quark.saveShare(shareInfo.shareId, quarkToken.stoken, fids);

        case 'aliyun':
            const shareToken = await DiskAPI.aliyun.getShareToken(shareInfo.shareId, sharePwd);
            const files = await DiskAPI.aliyun.getShareFileList(shareInfo.shareId, shareToken);
            // 阿里云盘转存需要在content script中执行（需要用户token）
            return { success: true, message: '请在阿里云盘页面进行转存操作', files };

        default:
            throw new Error(`暂不支持从${shareInfo.name}转存`);
    }
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
            '*://drive.uc.cn/*'
        ]
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'transfer-link') {
        chrome.storage.local.set({ pendingLink: info.linkUrl });
        chrome.action.openPopup();
    }
});

console.log('威软网盘转存工具 Background Service Worker 已加载');
