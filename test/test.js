/**
 * 威软网盘转存工具 - 测试脚本
 * Author: 威软网盘转存工具
 */

// 测试结果存储
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// 测试工具函数
function test(name, fn) {
    testResults.total++;
    try {
        fn();
        testResults.passed++;
        testResults.details.push({ name, status: 'PASSED', error: null });
        console.log(`✅ PASSED: ${name}`);
    } catch (error) {
        testResults.failed++;
        testResults.details.push({ name, status: 'FAILED', error: error.message });
        console.log(`❌ FAILED: ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
    }
}

function assertTrue(value, message = '') {
    if (!value) {
        throw new Error(`${message} Expected true but got: ${value}`);
    }
}

function assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
        throw new Error(`${message} Expected non-null value but got: ${value}`);
    }
}

// ==================== 测试用例 ====================

// 1. 测试分享链接解析
console.log('\n========== 分享链接解析测试 ==========\n');

const parseShareLink = (url) => {
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
            return { name: pattern.name, type: pattern.type, shareId: match[1], url };
        }
    }
    return null;
};

test('解析百度网盘链接', () => {
    const result = parseShareLink('https://pan.baidu.com/s/1abc123def');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '百度网盘', '网盘名称');
    assertEqual(result.type, 'baidu', '网盘类型');
    assertEqual(result.shareId, '1abc123def', '分享ID');
});

test('解析阿里云盘链接', () => {
    const result = parseShareLink('https://www.aliyundrive.com/s/abcdef123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '阿里云盘', '网盘名称');
    assertEqual(result.type, 'aliyun', '网盘类型');
});

test('解析阿里云盘新域名链接', () => {
    const result = parseShareLink('https://www.alipan.com/s/xyz789');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '阿里云盘', '网盘名称');
    assertEqual(result.type, 'aliyun', '网盘类型');
});

test('解析天翼云盘链接', () => {
    const result = parseShareLink('https://cloud.189.cn/t/abc123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '天翼云盘', '网盘名称');
    assertEqual(result.type, 'tianyi', '网盘类型');
});

test('解析夸克网盘链接', () => {
    const result = parseShareLink('https://pan.quark.cn/s/def456');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '夸克网盘', '网盘名称');
    assertEqual(result.type, 'quark', '网盘类型');
});

test('解析迅雷云盘链接', () => {
    const result = parseShareLink('https://pan.xunlei.com/s/test-share');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '迅雷云盘', '网盘名称');
    assertEqual(result.type, 'xunlei', '网盘类型');
});

test('解析115网盘链接', () => {
    const result = parseShareLink('https://115.com/s/sw1abc');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '115网盘', '网盘名称');
    assertEqual(result.type, '115', '网盘类型');
});

test('解析蓝奏云链接', () => {
    const result = parseShareLink('https://lanzou.com/abc123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '蓝奏云', '网盘名称');
    assertEqual(result.type, 'lanzou', '网盘类型');
});

test('解析蓝奏云变体域名链接', () => {
    const result = parseShareLink('https://lanzoui.com/xyz789');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '蓝奏云', '网盘名称');
});

test('解析和彩云链接', () => {
    const result = parseShareLink('https://yun.139.com/link/abc123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '和彩云', '网盘名称');
    assertEqual(result.type, 'hecaiyun', '网盘类型');
});

test('解析123云盘链接', () => {
    const result = parseShareLink('https://www.123pan.com/s/abc-123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, '123云盘', '网盘名称');
    assertEqual(result.type, '123pan', '网盘类型');
});

test('解析UC网盘链接', () => {
    const result = parseShareLink('https://drive.uc.cn/s/abc123');
    assertNotNull(result, '解析结果不应为空');
    assertEqual(result.name, 'UC网盘', '网盘名称');
    assertEqual(result.type, 'uc', '网盘类型');
});

test('无效链接应返回null', () => {
    const result = parseShareLink('https://example.com/invalid');
    assertEqual(result, null, '无效链接应返回null');
});

// 2. 测试工具函数
console.log('\n========== 工具函数测试 ==========\n');

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

test('格式化文件大小 - 0字节', () => {
    assertEqual(formatSize(0), '0 B');
});

test('格式化文件大小 - 字节', () => {
    assertEqual(formatSize(512), '512 B');
});

test('格式化文件大小 - KB', () => {
    assertEqual(formatSize(1024), '1 KB');
});

test('格式化文件大小 - MB', () => {
    assertEqual(formatSize(1024 * 1024), '1 MB');
});

test('格式化文件大小 - GB', () => {
    assertEqual(formatSize(1024 * 1024 * 1024), '1 GB');
});

test('格式化文件大小 - 小数', () => {
    assertEqual(formatSize(1536), '1.5 KB');
});

const formatTime = (ms) => {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(2) + 's';
    return (ms / 60000).toFixed(2) + 'min';
};

test('格式化时间 - 毫秒', () => {
    assertEqual(formatTime(500), '500ms');
});

test('格式化时间 - 秒', () => {
    assertEqual(formatTime(2500), '2.50s');
});

test('格式化时间 - 分钟', () => {
    assertEqual(formatTime(90000), '1.50min');
});

const generateId = () => {
    return 'wr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

test('生成唯一ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    assertTrue(id1.startsWith('wr_'), 'ID应以wr_开头');
    assertTrue(id1 !== id2, 'ID应该唯一');
});

// 3. 测试网盘检测
console.log('\n========== 网盘检测测试 ==========\n');

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

const getCurrentDisk = (host) => {
    for (const disk of SUPPORTED_DISKS) {
        if (disk.domain.some(d => host.includes(d))) {
            return disk;
        }
    }
    return null;
};

test('检测百度网盘', () => {
    const disk = getCurrentDisk('pan.baidu.com');
    assertNotNull(disk);
    assertEqual(disk.name, '百度网盘');
});

test('检测阿里云盘', () => {
    const disk = getCurrentDisk('www.aliyundrive.com');
    assertNotNull(disk);
    assertEqual(disk.name, '阿里云盘');
});

test('检测夸克网盘', () => {
    const disk = getCurrentDisk('pan.quark.cn');
    assertNotNull(disk);
    assertEqual(disk.name, '夸克网盘');
});

test('检测123云盘', () => {
    const disk = getCurrentDisk('www.123pan.com');
    assertNotNull(disk);
    assertEqual(disk.name, '123云盘');
});

test('未知域名返回null', () => {
    const disk = getCurrentDisk('unknown.example.com');
    assertEqual(disk, null);
});

// 4. 测试配置
console.log('\n========== 配置测试 ==========\n');

test('支持的网盘数量', () => {
    assertEqual(SUPPORTED_DISKS.length, 10, '应支持10种网盘');
});

test('所有网盘都有颜色配置', () => {
    for (const disk of SUPPORTED_DISKS) {
        assertNotNull(disk.color, `${disk.name}应有颜色配置`);
        assertTrue(disk.color.startsWith('#'), `${disk.name}颜色应为十六进制格式`);
    }
});

test('所有网盘都有域名配置', () => {
    for (const disk of SUPPORTED_DISKS) {
        assertTrue(disk.domain.length > 0, `${disk.name}应有域名配置`);
    }
});

// 输出测试结果
console.log('\n========================================');
console.log('            测试结果汇总');
console.log('========================================\n');
console.log(`总计: ${testResults.total} 个测试`);
console.log(`通过: ${testResults.passed} 个 ✅`);
console.log(`失败: ${testResults.failed} 个 ❌`);
console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
console.log('\n========================================\n');

if (testResults.failed > 0) {
    console.log('失败的测试:');
    testResults.details
        .filter(t => t.status === 'FAILED')
        .forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
}

// 导出测试结果
if (typeof module !== 'undefined') {
    module.exports = testResults;
}
