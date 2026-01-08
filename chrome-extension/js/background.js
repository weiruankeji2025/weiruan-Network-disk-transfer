// 威软网盘转存工具 - Background Service Worker
// Author: 威软网盘转存工具
// Version: 1.2.0

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
            credentials: {}
        });
    }
});

// 凭证管理器
const CredentialManager = {
    async save(diskType, credentials) {
        const { credentials: allCreds = {} } = await chrome.storage.local.get('credentials');
        allCreds[diskType] = {
            ...credentials,
            savedAt: Date.now()
        };
        await chrome.storage.local.set({ credentials: allCreds });
    },

    async get(diskType) {
        const { credentials: allCreds = {} } = await chrome.storage.local.get('credentials');
        return allCreds[diskType] || null;
    },

    async remove(diskType) {
        const { credentials: allCreds = {} } = await chrome.storage.local.get('credentials');
        delete allCreds[diskType];
        await chrome.storage.local.set({ credentials: allCreds });
    },

    async getAll() {
        const { credentials = {} } = await chrome.storage.local.get('credentials');
        return credentials;
    }
};

// 网盘登录模块
const DiskLogin = {
    // 百度网盘登录
    baidu: {
        async loginWithCookie(cookie) {
            const response = await fetch('https://pan.baidu.com/api/loginStatus?clienttype=0&web=1', {
                headers: { 'Cookie': cookie }
            });
            const data = await response.json();
            if (data.errno === 0 && data.login_info) {
                await CredentialManager.save('baidu', {
                    cookie: cookie,
                    username: data.login_info.username,
                    uk: data.login_info.uk,
                    isLoggedIn: true
                });
                return { success: true, username: data.login_info.username };
            }
            throw new Error('Cookie无效或已过期');
        }
    },

    // 阿里云盘登录
    aliyun: {
        async loginWithToken(refreshToken) {
            const response = await fetch('https://api.aliyundrive.com/token/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            const data = await response.json();
            if (data.access_token) {
                await CredentialManager.save('aliyun', {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    driveId: data.default_drive_id,
                    username: data.nick_name || data.user_name,
                    userId: data.user_id,
                    expireTime: Date.now() + (data.expires_in || 7200) * 1000,
                    isLoggedIn: true
                });
                return { success: true, username: data.nick_name || data.user_name };
            }
            throw new Error(data.message || 'Token无效或已过期');
        }
    },

    // 夸克网盘登录
    quark: {
        async loginWithCookie(cookie) {
            const response = await fetch('https://drive.quark.cn/1/clouddrive/member/info?pr=ucpro&fr=pc', {
                headers: { 'Cookie': cookie }
            });
            const data = await response.json();
            if (data.status === 200 && data.data) {
                await CredentialManager.save('quark', {
                    cookie: cookie,
                    username: data.data.nickname,
                    memberId: data.data.member_id,
                    isLoggedIn: true
                });
                return { success: true, username: data.data.nickname };
            }
            throw new Error('Cookie无效或已过期');
        }
    },

    // 天翼云盘登录
    tianyi: {
        async loginWithCookie(cookie) {
            const response = await fetch('https://cloud.189.cn/api/portal/getUserBriefInfo.action', {
                headers: { 'Cookie': cookie }
            });
            const data = await response.json();
            if (data.res_code === 0) {
                await CredentialManager.save('tianyi', {
                    cookie: cookie,
                    username: data.nickName,
                    userId: data.userId,
                    isLoggedIn: true
                });
                return { success: true, username: data.nickName };
            }
            throw new Error('Cookie无效或已过期');
        }
    },

    // 123云盘登录
    pan123: {
        async loginWithToken(token) {
            const response = await fetch('https://www.123pan.com/api/user/info', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.code === 0 && data.data) {
                await CredentialManager.save('123pan', {
                    token: token,
                    username: data.data.nickname,
                    isLoggedIn: true
                });
                return { success: true, username: data.data.nickname };
            }
            throw new Error('Token无效或已过期');
        }
    },

    // 115网盘登录
    '115': {
        async loginWithCookie(cookie) {
            const response = await fetch('https://my.115.com/?ct=ajax&ac=nav', {
                headers: { 'Cookie': cookie }
            });
            const data = await response.json();
            if (data.data && data.data.user_id) {
                await CredentialManager.save('115', {
                    cookie: cookie,
                    username: data.data.user_name,
                    userId: data.data.user_id,
                    isLoggedIn: true
                });
                return { success: true, username: data.data.user_name };
            }
            throw new Error('Cookie无效或已过期');
        }
    },

    // 迅雷云盘登录
    xunlei: {
        async loginWithCookie(cookie) {
            const response = await fetch('https://pan.xunlei.com/api/pan/user/info', {
                headers: { 'Cookie': cookie }
            });
            const data = await response.json();
            if (data.code === 0 && data.data) {
                await CredentialManager.save('xunlei', {
                    cookie: cookie,
                    username: data.data.name,
                    isLoggedIn: true
                });
                return { success: true, username: data.data.name };
            }
            throw new Error('Cookie无效或已过期');
        }
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
        },

        async saveShare(shareId, shareToken, fileIds) {
            const cred = await CredentialManager.get('aliyun');
            if (!cred || !cred.accessToken) {
                throw new Error('请先登录阿里云盘');
            }

            const response = await fetch('https://api.aliyundrive.com/adrive/v2/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cred.accessToken}`,
                    'x-share-token': shareToken
                },
                body: JSON.stringify({
                    requests: fileIds.map(fileId => ({
                        body: {
                            file_id: fileId,
                            share_id: shareId,
                            auto_rename: true,
                            to_parent_file_id: 'root',
                            to_drive_id: cred.driveId
                        },
                        headers: { 'Content-Type': 'application/json' },
                        id: fileId,
                        method: 'POST',
                        url: '/file/copy'
                    })),
                    resource: 'file'
                })
            });
            const data = await response.json();
            if (data.responses) {
                const successCount = data.responses.filter(r => r.status === 201 || r.status === 200).length;
                return {
                    success: successCount > 0,
                    message: `成功转存 ${successCount}/${fileIds.length} 个文件`
                };
            }
            throw new Error(data.message || '转存失败');
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
            const cred = await CredentialManager.get('quark');
            if (!cred || !cred.cookie) {
                throw new Error('请先登录夸克网盘');
            }

            const response = await fetch('https://drive.quark.cn/1/clouddrive/share/sharepage/save?pr=ucpro&fr=pc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cred.cookie
                },
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
    },

    // 123云盘
    pan123: {
        async getShareInfo(shareKey, sharePwd = '') {
            const response = await fetch(`https://www.123pan.com/api/share/info?shareKey=${shareKey}&sharePwd=${sharePwd}`);
            const data = await response.json();
            if (data.code === 0) {
                return data.data;
            }
            throw new Error(data.message || '获取分享信息失败');
        },

        async getShareFileList(shareKey, sharePwd = '') {
            const response = await fetch(`https://www.123pan.com/api/share/get?shareKey=${shareKey}&sharePwd=${sharePwd}&parentFileId=0&limit=100`);
            const data = await response.json();
            if (data.code === 0) {
                return data.data.InfoList || [];
            }
            throw new Error(data.message || '获取文件列表失败');
        },

        async saveShare(shareKey, sharePwd, fileIdList) {
            const cred = await CredentialManager.get('123pan');
            if (!cred || !cred.token) {
                throw new Error('请先登录123云盘');
            }

            const response = await fetch('https://www.123pan.com/api/share/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cred.token}`
                },
                body: JSON.stringify({
                    shareKey: shareKey,
                    sharePwd: sharePwd,
                    fileIdList: fileIdList,
                    parentFileId: 0
                })
            });
            const data = await response.json();
            if (data.code === 0) {
                return { success: true, message: '转存成功' };
            }
            return { success: false, message: data.message || '转存失败' };
        }
    }
};

// 获取登录页面URL
function getLoginUrl(diskType) {
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

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCredentials') {
        CredentialManager.getAll().then(creds => {
            sendResponse({ success: true, data: creds });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    if (request.action === 'login') {
        const { diskType, credential } = request.data;
        let loginPromise;

        switch (diskType) {
            case 'baidu':
                loginPromise = DiskLogin.baidu.loginWithCookie(credential);
                break;
            case 'aliyun':
                loginPromise = DiskLogin.aliyun.loginWithToken(credential);
                break;
            case 'quark':
                loginPromise = DiskLogin.quark.loginWithCookie(credential);
                break;
            case 'tianyi':
                loginPromise = DiskLogin.tianyi.loginWithCookie(credential);
                break;
            case '123pan':
                const token = credential.replace(/^Bearer\s+/i, '');
                loginPromise = DiskLogin.pan123.loginWithToken(token);
                break;
            case '115':
                loginPromise = DiskLogin['115'].loginWithCookie(credential);
                break;
            case 'xunlei':
                loginPromise = DiskLogin.xunlei.loginWithCookie(credential);
                break;
            default:
                sendResponse({ success: false, error: '暂不支持该网盘登录' });
                return true;
        }

        loginPromise.then(result => {
            sendResponse({ success: true, data: result });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }

    if (request.action === 'logout') {
        CredentialManager.remove(request.diskType).then(() => {
            sendResponse({ success: true });
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
        const url = getLoginUrl(request.diskType);
        sendResponse({ success: true, data: url });
        return true;
    }
});

// 处理转存请求
async function handleTransfer(data) {
    const { shareLink, sharePwd, targetDisk } = data;

    const shareInfo = parseShareLink(shareLink);
    if (!shareInfo) {
        throw new Error('无法识别的分享链接');
    }

    // 检查目标网盘是否已登录
    const cred = await CredentialManager.get(targetDisk.type);
    if (!cred || !cred.isLoggedIn) {
        throw new Error(`请先在账号管理中登录${targetDisk.name}`);
    }

    // 检查源网盘和目标网盘是否一致
    if (shareInfo.type !== targetDisk.type) {
        throw new Error(`暂不支持跨网盘转存，请选择${shareInfo.name}作为目标`);
    }

    // 根据源网盘类型执行转存
    switch (shareInfo.type) {
        case 'aliyun':
            const shareToken = await DiskAPI.aliyun.getShareToken(shareInfo.shareId, sharePwd);
            const files = await DiskAPI.aliyun.getShareFileList(shareInfo.shareId, shareToken);
            const fileIds = files.map(f => f.file_id);
            return await DiskAPI.aliyun.saveShare(shareInfo.shareId, shareToken, fileIds);

        case 'quark':
            const quarkToken = await DiskAPI.quark.getShareToken(shareInfo.shareId, sharePwd);
            const quarkFiles = await DiskAPI.quark.getShareFileList(shareInfo.shareId, quarkToken.stoken);
            const fids = quarkFiles.map(f => f.fid);
            return await DiskAPI.quark.saveShare(shareInfo.shareId, quarkToken.stoken, fids);

        case '123pan':
            await DiskAPI.pan123.getShareInfo(shareInfo.shareId, sharePwd);
            const pan123Files = await DiskAPI.pan123.getShareFileList(shareInfo.shareId, sharePwd);
            const fileIdList = pan123Files.map(f => f.FileId);
            return await DiskAPI.pan123.saveShare(shareInfo.shareId, sharePwd, fileIdList);

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

console.log('威软网盘转存工具 v1.2.0 Background Service Worker 已加载');
