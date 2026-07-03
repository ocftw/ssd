// 內容素材（多語系）：村莊告示牌 + 散落荒野的遺跡（＝資安主題課程）。
//
// 結構分兩層：
//   STRUCT — 與語言無關（id／emoji／顏色／方位角度＋距村中心距離／連結／旗標）。座標、連結只在這裡改一次。
//   TEXT   — 各語言的文字（title／sub／desc／chips／defense／tip／review／stateText／goText）。翻譯只動這裡，
//            不會碰到座標、連結、旗標，降低翻譯出錯風險。
// assemble() 把兩層合併成 main.js 既有的物件形狀；CONTENT[lang] 即可直接使用。
const SITE = 'https://ssd.ocf.tw';

// ── 結構（語言無關）──────────────────────────────────────────────
const STRUCT = {
  // 村莊中央的告示牌（旅程的起點與說明，不計入遺跡進度）
  board: { id: 'how-to', emoji: '🧭', url: `${SITE}/how-to/` },
  // OCF 紀念碑（荒野中的隱藏地標，非課程）
  ocf: { id: 'ocf', emoji: '💛', color: 0xffd24b, angle: 340, radius: 120, url: 'https://ocf.tw/' },
  // 通關後白天世界（worldOpen）的三個資訊點：座標在 main.js 固定擺放；desc 紀念碑由 UI.shardLesson 組裝
  monument: { id: 'monument', emoji: '🛡️', color: 0x9fe0ff, story: true, url: `${SITE}/blog/` },
  lighthouse: { id: 'lighthouse', emoji: '🗼', color: 0xffd9a0, story: true, noLink: true },
  partnerwall: { id: 'partnerwall', emoji: '🤝', color: 0xffd24b, story: true, url: 'https://cscs.asia/' },
  // 英雄紀念碑（首頁主視覺壁畫 + 傳說；story＝全文不截斷、noLink＝隱藏前往鍵）
  legend: { id: 'legend', emoji: '🏛️', story: true, noLink: true },
  // 英雄遺落的武器寶箱（連到資安實戰教材資源頁）
  chest: { id: 'chest', emoji: '🗡️', color: 0xffd24b, angle: 74, radius: 30, url: 'https://ssd.ocf.tw/resources/cscs-materials.html' },
  // 資安升級工具包（連到 /guide/）
  guidekit: { id: 'guidekit', emoji: '🧰', color: 0xb98bff, angle: 106, radius: 30, url: 'https://ssd.ocf.tw/guide/' },
  // 檔案室裡的 3 份文件（cover：文件台上展示的封面圖）
  docs: [
    { id: 'doc1', emoji: '📄', cover: './cover1.webp?v=51a693a9', url: 'https://drive.google.com/file/d/1sxAFmSiJL6DzdO3ezq_hJSBROuGXNLAA/view' },
    { id: 'doc2', emoji: '📄', cover: './cover2.webp?v=51a693a9', url: 'https://drive.google.com/file/d/1wgYdObezFzlI6OJLozzqQF5Vt11B7gCd/view?usp=drive_link' },
    { id: 'doc3', emoji: '📄', cover: './cover3.webp?v=51a693a9', url: 'https://drive.google.com/file/d/1VwZwVXpOjTBZibVCTbIF1wUdPhQU_wJz/view?usp=drive_link' },
  ],
  // 散落在村莊外的遺跡：每一座 = 一個資安主題（位置用「方位角度 + 距村中心距離」表示）
  ruins: [
    { id: 'personal', emoji: '🏠', color: 0x4fd1a8, style: 'grove', angle: 20, radius: 148, url: `${SITE}/personal/` },
    { id: 'org', emoji: '🏢', color: 0x5b9cff, style: 'fortress', angle: 104, radius: 162, url: `${SITE}/org/` },
    { id: 'common', emoji: '🚨', color: 0xff7a5c, style: 'tower', angle: 188, radius: 155, url: `${SITE}/common/` },
    { id: 'guide', emoji: '📋', color: 0x5bc8bf, style: 'obelisk', angle: 244, radius: 110, url: `${SITE}/assessment/` },
    { id: 'tools', emoji: '🛠️', color: 0xffc24b, style: 'market', angle: 308, radius: 102, url: `${SITE}/tools/` },
  ],
};

// ── 各語言文字 ───────────────────────────────────────────────────
const TEXT = {
  'zh-Hant': {
    board: {
      title: '村長的告示牌', sub: '怎麼升級資安？',
      desc: '歡迎來到新手村！這片土地的枯萎不是天災——是當年守護村子的「防線」一道道倒下，色彩才跟著褪去。走出村莊，找到散落各地的「資安遺跡」，每一座都是一門課程；你修復的每座遺跡，就是替自己的村子重建一道防線。五道防線齊備，村子就會重新亮起。地圖上的金色路標會指引你建議的下一站，但你也可以自由選擇先去哪一座。',
      chips: ['整體路線', '優先順序', '新手友善'],
    },
    ocf: {
      title: '開放文化基金會 OCF', sub: '荒野中的紀念碑',
      desc: '開放文化基金會（OCF）是支持台灣開源、開放資料與數位人權的非營利組織，也是「資安防護新手村」背後的推手。喜歡這個專案嗎？歡迎到官網支持我們，讓開放與資安教育走得更遠。',
      chips: ['開源', '開放資料', '數位人權', '非營利'],
      stateText: '感謝支持', goText: '前往 OCF 官網支持 →',
    },
    monument: {
      title: '守護者紀念碑', sub: '你學到的五件事',
      chips: ['個人帳號', '事件應變', '工具四件套', '組織防護', '進度盤點'],
      stateText: '通關紀念', goText: '📚 延伸閱讀：進階文章 →',
    },
    lighthouse: {
      title: '守護燈塔', sub: '照亮他人的路',
      desc: '當五道防線重新亮起，這座燈塔也隨之點燃。你已經從被守護的人，變成能照亮他人數位安全之路的守護者——把學到的帶回真實生活，也分享給更多旅人。',
      chips: ['通關獎勵', '分享出去'], stateText: '永遠明亮',
    },
    partnerwall: {
      title: 'OCF × CSCS 夥伴牆', sub: '幕後夥伴',
      desc: '這趟旅程由開放文化基金會（OCF）與 CSCS 社群的講師夥伴共同打造。OCF 是支持台灣開源、開放資料與數位人權的非營利組織；CSCS 的講師夥伴把講座裡的實戰心法，變成你能親手走過的世界。想深入這些實戰教材，歡迎造訪 CSCS。',
      chips: ['開源', '開放資料', '數位人權', 'CSCS 講師', '資安教材'],
      stateText: '致謝', goText: '前往 CSCS →',
    },
    legend: {
      title: '英雄紀念碑', sub: '斑駁的古老壁畫',
      desc: '很久很久以前，一群英雄曾守護著這座村莊——御龍的勇者、綠袍的法師，與牠們忠誠的夥伴，一次次擊退降臨的威脅。後來，一場巨變奪走了大地的色彩，英雄們也就此下落不明，沒有人知道他們去了哪裡。如今只剩這面斑駁的壁畫，靜靜記著他們的身影。據說，當村裡的水晶重新點亮，他們會再次出現在這片土地上……\n\n（這面壁畫即本站主視覺，由插畫家 Kaho Mukae 繪製；網站規劃與主題設計：Sandra Lin。）',
      chips: [], stateText: '遠古的傳說',
    },
    chest: {
      title: '英雄遺落的武器寶箱', sub: '荒野中的古老寶箱',
      desc: '傳說中的英雄離開時，把武器封存在這只寶箱。打開一看——裡頭不是刀劍，而是一整套「資安實戰教材」：簡報、講義與練習。帶上它們，你也能像當年的英雄一樣守住自己的村莊。',
      chips: ['資安教材', '簡報講義', '實作練習', '自由取用'],
      stateText: '英雄的武器庫', goText: '取得教材資源 →',
    },
    guidekit: {
      title: '資安升級工具包', sub: '組織推動資安的工具箱',
      desc: '給組織內負責資安的夥伴：一套「如何在組織裡推動資安提升」的方法與工具——威脅建模、風險評估、裝置稽核、成效檢視，陪你一步步把整個組織的防護升級。',
      chips: ['組織推動', '威脅建模', '風險評估', '裝置稽核', '成效檢視'],
      stateText: '組織工具包', goText: '打開工具包 →',
    },
    docs: {
      doc1: { title: '台灣人權與民主倡議團體數位威脅概況', sub: '檔案室・卷宗一', stateText: '文件', goText: '閱讀 PDF →', chips: [], desc: '2024 年研究報告摘要（中文版），整理 35 份問卷與 3 場深度訪談中，在臺人權與民主倡議團體面臨的數位威脅樣態與資安需求。' },
      doc2: { title: '守護倡議之聲', sub: '檔案室・卷宗二', stateText: '文件', goText: '閱讀 PDF →', chips: [], desc: '本專案結案報告，整理「資安陪伴計畫」(SMP) 對公民團體與人權工作者的服務模式、實作經驗與建議。' },
      doc3: { title: '信任的代價', sub: '檔案室・卷宗三', stateText: '文件', goText: '閱讀 PDF →', chips: [], desc: '一份針對臺灣人權工作者實際遭遇資安攻擊事件的個案研究實錄，記錄攻擊樣態、防守過程與經驗教訓。' },
    },
    ruins: {
      personal: {
        title: '個人資安', sub: '森林裡的石屋遺跡', defense: '個人帳號防線',
        desc: '手機電腦設定、帳號安全、安全瀏覽、加密溝通——個人能立刻做的防護。',
        chips: ['手機/電腦', '帳號安全', '網路瀏覽', '加密溝通', '海外出差'],
        tip: '回家小提醒：把常用帳號（Email、社群、密碼管理器）都開啟兩步驗證；換手機前先備份驗證碼，才不會被鎖在門外。',
        review: [
          '帳號：常用帳號（Email、社群）都開兩步驗證(MFA)，並先備份備用碼。',
          '密碼：每個網站用不同的長密碼，交給密碼管理器保管就好。',
          '裝置：手機電腦設螢幕鎖、開自動更新，及時修補漏洞。',
          '連線：公共 Wi-Fi 用 VPN；敏感對話用端對端加密的通訊軟體。',
        ],
      },
      org: {
        title: '組織資安', sub: '山丘上的堡壘遺跡', defense: '組織治理防線',
        desc: '公務機、網路環境、帳號管理、資料權限與備份、政策範本。',
        chips: ['公務電腦', '網路環境', '帳號管理', '資料權限', '資料備份', '政策範本'],
        tip: '給組織的提醒：定期演練「還原」備份、員工離職立刻收回權限、權限只給工作所需的最小範圍。',
        review: [
          '帳號：離職／轉調立刻回收權限，採「最小權限原則」。',
          '裝置基準：公務機開磁碟加密、自動更新、螢幕鎖與防毒。',
          '備份：3-2-1 備份並「定期演練還原」，沒測過等於沒有。',
          '制度：用政策範本把規則寫清楚，讓全員一致遵循。',
        ],
      },
      common: {
        title: '常見資安事件', sub: '裂谷邊的崩塌高塔', defense: '臨場應變防線',
        desc: '釣魚、勒索、密碼外洩、帳號被盜……遇到時的第一步該怎麼做。',
        chips: ['釣魚信', '勒索軟體', '密碼外洩', '帳號被盜', 'NAS 攻擊', '網站攻擊'],
        tip: '遇到可疑訊息別急著點：改用官方 App 或自己的書籤登入確認；真的中招就先改密碼、開 MFA、保留截圖證據。',
        review: [
          '釣魚：可疑訊息別點連結，改用自己的書籤或官方 App 登入確認。',
          '認網址：看「最後的主網域」是否正確，https 鎖頭和 Logo 都能偽造。',
          '中招了：立刻改密碼、開 MFA、保留截圖，並視情況通報。',
          '勒索：靠「離線、異地」的備份救資料，別付贖金。',
        ],
      },
      guide: {
        title: '資安體檢與進度追蹤', sub: '荒野中的方尖碑', defense: '盤點追蹤防線',
        desc: '用檢查清單為組織做「資安體檢」：盤點現況、排出優先順序，並把改善進度與課後任務記錄下來，讓資安升級看得見、追得動。',
        chips: ['現況盤點', '檢查清單', '進度追蹤', '成效檢視'],
        tip: '別只靠記憶追進度：用一份檢查清單記下「做到哪、下一步做什麼」，定期回顧、滾動更新。',
        review: [
          '起點：先盤點現況——裝置、帳號、資料目前的狀態。',
          '排序：依風險（可能性 × 衝擊）由高到低處理。',
          '追蹤：用共用檢查清單記「做到哪、下一步」，別只靠記憶。',
          '循環：導入後定期檢視成效、收回饋，再滾動調整。',
        ],
      },
      tools: {
        title: '工具推薦', sub: '湖畔的市集遺跡', defense: '日常工具防線',
        desc: '精選好上手的資安工具：密碼管理器、驗證器、VPN、備份等。',
        chips: ['密碼管理器', '驗證器', 'VPN', '備份工具'],
        tip: '挑工具的原則：密碼管理器存強密碼、驗證器當第二道關、公共 Wi-Fi 用 VPN、重要資料記得 3-2-1 備份。',
        review: [
          '密碼管理器：替每個網站存不同強密碼，你只要記一組主密碼。',
          '驗證器 App：產生一次性驗證碼，當密碼之外的第二道關卡。',
          'VPN：在公共 Wi-Fi 上加密整台裝置的對外連線。',
          '備份：依 3-2-1 原則（雲端＋離線多份），並定期測試還原。',
        ],
      },
    },
  },
  'zh-Hans': {
    board: {
      title: '村长的告示牌', sub: '怎么提升网络安全？',
      desc: '欢迎来到新手村！这片土地的枯萎不是天灾——是当年守护村子的「防线」一道道倒下，色彩才跟着褪去。走出村庄，找到散落各地的「安全遗迹」，每一座都是一门课程；你修复的每座遗迹，就是替自己的村子重建一道防线。五道防线齐备，村子就会重新亮起。地图上的金色路标会指引你建议的下一站，但你也可以自由选择先去哪一座。',
      chips: ['整体路线', '优先顺序', '新手友好'],
    },
    ocf: {
      title: '开放文化基金会 OCF', sub: '荒野中的纪念碑',
      desc: '开放文化基金会（OCF）是支持台湾开源、开放数据与数字人权的非营利组织，也是「安全防护新手村」背后的推手。喜欢这个项目吗？欢迎到官网支持我们，让开放与安全教育走得更远。',
      chips: ['开源', '开放数据', '数字人权', '非营利'],
      stateText: '感谢支持', goText: '前往 OCF 官网支持 →',
    },
    monument: {
      title: '守护者纪念碑', sub: '你学到的五件事',
      chips: ['个人账号', '事件应变', '工具四件套', '组织防护', '进度盘点'],
      stateText: '通关纪念', goText: '📚 延伸阅读：进阶文章 →',
    },
    lighthouse: {
      title: '守护灯塔', sub: '照亮他人的路',
      desc: '当五道防线重新亮起，这座灯塔也随之点燃。你已经从被守护的人，变成能照亮他人数字安全之路的守护者——把学到的带回真实生活，也分享给更多旅人。',
      chips: ['通关奖励', '分享出去'], stateText: '永远明亮',
    },
    partnerwall: {
      title: 'OCF × CSCS 伙伴墙', sub: '幕后伙伴',
      desc: '这趟旅程由开放文化基金会（OCF）与 CSCS 社群的讲师伙伴共同打造。OCF 是支持台湾开源、开放数据与数字人权的非营利组织；CSCS 的讲师伙伴把讲座里的实战心法，变成你能亲手走过的世界。想深入这些实战教材，欢迎造访 CSCS。',
      chips: ['开源', '开放数据', '数字人权', 'CSCS 讲师', '安全教材'],
      stateText: '致谢', goText: '前往 CSCS →',
    },
    legend: {
      title: '英雄纪念碑', sub: '斑驳的古老壁画',
      desc: '很久很久以前，一群英雄曾守护着这座村庄——御龙的勇者、绿袍的法师，与它们忠诚的伙伴，一次次击退降临的威胁。后来，一场巨变夺走了大地的色彩，英雄们也就此下落不明，没有人知道他们去了哪里。如今只剩这面斑驳的壁画，静静记着他们的身影。据说，当村里的水晶重新点亮，他们会再次出现在这片土地上……\n\n（这面壁画即本站主视觉，由插画家 Kaho Mukae 绘制；网站规划与主题设计：Sandra Lin。）',
      chips: [], stateText: '远古的传说',
    },
    chest: {
      title: '英雄遗落的武器宝箱', sub: '荒野中的古老宝箱',
      desc: '传说中的英雄离开时，把武器封存在这只宝箱。打开一看——里头不是刀剑，而是一整套「安全实战教材」：幻灯片、讲义与练习。带上它们，你也能像当年的英雄一样守住自己的村庄。',
      chips: ['安全教材', '幻灯讲义', '实操练习', '自由取用'],
      stateText: '英雄的武器库', goText: '获取教材资源 →',
    },
    guidekit: {
      title: '安全升级工具包', sub: '组织推动安全的工具箱',
      desc: '给组织内负责安全的伙伴：一套「如何在组织里推动安全提升」的方法与工具——威胁建模、风险评估、设备审计、成效检视，陪你一步步把整个组织的防护升级。',
      chips: ['组织推动', '威胁建模', '风险评估', '设备审计', '成效检视'],
      stateText: '组织工具包', goText: '打开工具包 →',
    },
    docs: {
      doc1: { title: '台湾人权与民主倡议团体数字威胁概况', sub: '档案室・卷宗一', stateText: '文件', goText: '阅读 PDF →', chips: [], desc: '2024 年研究报告摘要（中文版），整理 35 份问卷与 3 场深度访谈中，在台人权与民主倡议团体面临的数字威胁样态与安全需求。' },
      doc2: { title: '守护倡议之声', sub: '档案室・卷宗二', stateText: '文件', goText: '阅读 PDF →', chips: [], desc: '本项目结案报告，整理「安全陪伴计划」(SMP) 对公民团体与人权工作者的服务模式、实践经验与建议。' },
      doc3: { title: '信任的代价', sub: '档案室・卷宗三', stateText: '文件', goText: '阅读 PDF →', chips: [], desc: '一份针对台湾人权工作者实际遭遇安全攻击事件的案例研究实录，记录攻击样态、防守过程与经验教训。' },
    },
    ruins: {
      personal: {
        title: '个人安全', sub: '森林里的石屋遗迹', defense: '个人账号防线',
        desc: '手机电脑设置、账号安全、安全浏览、加密沟通——个人能立刻做的防护。',
        chips: ['手机/电脑', '账号安全', '网络浏览', '加密沟通', '海外出差'],
        tip: '回家小提醒：把常用账号（邮箱、社交、密码管理器）都开启两步验证；换手机前先备份验证码，才不会被锁在门外。',
        review: [
          '账号：常用账号（邮箱、社交）都开两步验证(MFA)，并先备份备用码。',
          '密码：每个网站用不同的长密码，交给密码管理器保管就好。',
          '设备：手机电脑设屏幕锁、开自动更新，及时修补漏洞。',
          '连接：公共 Wi-Fi 用 VPN；敏感对话用端到端加密的通讯软件。',
        ],
      },
      org: {
        title: '组织安全', sub: '山丘上的堡垒遗迹', defense: '组织治理防线',
        desc: '办公电脑、网络环境、账号管理、数据权限与备份、政策模板。',
        chips: ['办公电脑', '网络环境', '账号管理', '数据权限', '数据备份', '政策模板'],
        tip: '给组织的提醒：定期演练「还原」备份、员工离职立刻收回权限、权限只给工作所需的最小范围。',
        review: [
          '账号：离职／转岗立刻回收权限，采用「最小权限原则」。',
          '设备基准：办公电脑开磁盘加密、自动更新、屏幕锁与杀毒。',
          '备份：3-2-1 备份并「定期演练还原」，没测过等于没有。',
          '制度：用政策模板把规则写清楚，让全员一致遵循。',
        ],
      },
      common: {
        title: '常见安全事件', sub: '裂谷边的崩塌高塔', defense: '临场应变防线',
        desc: '钓鱼、勒索、密码外泄、账号被盗……遇到时的第一步该怎么做。',
        chips: ['钓鱼邮件', '勒索软件', '密码外泄', '账号被盗', 'NAS 攻击', '网站攻击'],
        tip: '遇到可疑信息别急着点：改用官方 App 或自己的书签登录确认；真的中招就先改密码、开 MFA、保留截图证据。',
        review: [
          '钓鱼：可疑信息别点链接，改用自己的书签或官方 App 登录确认。',
          '认网址：看「最后的主域名」是否正确，https 锁标志和 Logo 都能伪造。',
          '中招了：立刻改密码、开 MFA、保留截图，并视情况上报。',
          '勒索：靠「离线、异地」的备份救数据，别付赎金。',
        ],
      },
      guide: {
        title: '安全体检与进度追踪', sub: '荒野中的方尖碑', defense: '盘点追踪防线',
        desc: '用检查清单为组织做「安全体检」：盘点现状、排出优先顺序，并把改善进度与课后任务记录下来，让安全升级看得见、追得动。',
        chips: ['现状盘点', '检查清单', '进度追踪', '成效检视'],
        tip: '别只靠记忆追进度：用一份检查清单记下「做到哪、下一步做什么」，定期回顾、滚动更新。',
        review: [
          '起点：先盘点现状——设备、账号、数据目前的状态。',
          '排序：按风险（可能性 × 影响）由高到低处理。',
          '追踪：用共享检查清单记「做到哪、下一步」，别只靠记忆。',
          '循环：导入后定期检视成效、收反馈，再滚动调整。',
        ],
      },
      tools: {
        title: '工具推荐', sub: '湖畔的集市遗迹', defense: '日常工具防线',
        desc: '精选好上手的安全工具：密码管理器、验证器、VPN、备份等。',
        chips: ['密码管理器', '验证器', 'VPN', '备份工具'],
        tip: '挑工具的原则：密码管理器存强密码、验证器当第二道关、公共 Wi-Fi 用 VPN、重要数据记得 3-2-1 备份。',
        review: [
          '密码管理器：替每个网站存不同强密码，你只要记一组主密码。',
          '验证器 App：生成一次性验证码，当密码之外的第二道关卡。',
          'VPN：在公共 Wi-Fi 上加密整台设备的对外连接。',
          '备份：按 3-2-1 原则（云端＋离线多份），并定期测试还原。',
        ],
      },
    },
  },
  'en': {
    board: {
      title: `Village Chief's Notice Board`, sub: `How do I level up my security?`,
      desc: `Welcome to the village! This land didn't wither from a natural disaster — the "defenses" that once protected it fell one by one, and the color drained away with them. Head out of the village and find the "security ruins" scattered across the wilds; each one is a lesson, and every ruin you restore rebuilds one of your village's defenses. Raise all five and the village lights up again. The golden waypoint on the map points to a suggested next stop, but you're free to choose where to go first.`,
      chips: [`Overview`, `Priorities`, `Beginner-friendly`],
    },
    ocf: {
      title: `Open Culture Foundation (OCF)`, sub: `A monument in the wilds`,
      desc: `The Open Culture Foundation (OCF) is a non-profit supporting open source, open data, and digital rights in Taiwan — and the team behind this "Security Village." Enjoying the project? Visit the official site to support us and help open culture and security education reach further.`,
      chips: [`Open source`, `Open data`, `Digital rights`, `Non-profit`],
      stateText: `Thanks for your support`, goText: `Support OCF →`,
    },
    monument: {
      title: `Guardian's Monument`, sub: `The five things you learned`,
      chips: [`Personal accounts`, `Incident response`, `Toolkit of four`, `Org defense`, `Take stock`],
      stateText: `Completion memento`, goText: `📚 Further reading: advanced articles →`,
    },
    lighthouse: {
      title: `Guardian Lighthouse`, sub: `Lighting the way for others`,
      desc: `When all five defenses shine again, this lighthouse lights up too. You've gone from someone who was protected to a guardian who can light the way for others' digital safety — carry what you learned back to real life, and share it with fellow travelers.`,
      chips: [`Completion reward`, `Pass it on`], stateText: `Always bright`,
    },
    partnerwall: {
      title: `OCF × CSCS Partner Wall`, sub: `The people behind it`,
      desc: `This journey was built together by the Open Culture Foundation (OCF) and lecturer friends from the CSCS community. OCF is a non-profit supporting open source, open data, and digital rights in Taiwan; CSCS lecturers turned hands-on security know-how from their talks into a world you can walk through. Want to dig into these hands-on materials? Visit CSCS.`,
      chips: [`Open source`, `Open data`, `Digital rights`, `CSCS lecturers`, `Security materials`],
      stateText: `Credits`, goText: `Visit CSCS →`,
    },
    legend: {
      title: `Heroes' Monument`, sub: `A weathered ancient mural`,
      desc: `Long, long ago, a band of heroes guarded this village — a dragon-riding warrior, a green-robed mage, and their loyal companions — turning back threat after threat. Then a great calamity drained the color from the land, and the heroes vanished without a trace; no one knows where they went. All that remains is this weathered mural, quietly keeping their memory. They say that when the village crystal shines again, they will return to this land…\n\n(This mural is the site's key visual, illustrated by Kaho Mukae; site planning & theme design by Sandra Lin.)`,
      chips: [], stateText: `An ancient legend`,
    },
    chest: {
      title: `Heroes' Lost Weapon Chest`, sub: `An old chest in the wilds`,
      desc: `When the legendary heroes departed, they sealed their weapons in this chest. Open it and you find — not blades, but a full set of "hands-on security training": slides, handouts, and exercises. Take them, and you too can defend your village like the heroes of old.`,
      chips: [`Training`, `Slides & handouts`, `Exercises`, `Free to use`],
      stateText: `Heroes' armory`, goText: `Get the materials →`,
    },
    guidekit: {
      title: `Security Upgrade Toolkit`, sub: `A toolbox for driving security in your org`,
      desc: `For those responsible for security within an organization: a set of methods and tools for "driving security improvements across your org" — threat modeling, risk assessment, device audits, and impact review — to help you level up protection step by step.`,
      chips: [`Org rollout`, `Threat modeling`, `Risk assessment`, `Device audit`, `Impact review`],
      stateText: `Org toolkit`, goText: `Open the toolkit →`,
    },
    // 英文版有官方英文封面與 PDF（cover／url 覆寫結構層的繁中預設；zh-Hant／zh-Hans 仍用繁中版）
    docs: {
      doc1: { title: `Digital Security Mapping for HRDs in Taiwan`, sub: `Archive · File One`, stateText: `Document`, goText: `Read PDF →`, chips: [], desc: `A summary of a 2024 research report, drawing on 35 questionnaires and 3 in-depth interviews to map the digital threats and security needs faced by rights and democracy advocacy groups in Taiwan.`, cover: './cover1_en.webp?v=51a693a9', url: `https://drive.google.com/file/d/1VV12Rp7IKkWexNTKQRuWIA4Zfd8ztN9X/view?usp=sharing` },
      doc2: { title: `Safeguarding Advocacy`, sub: `Archive · File Two`, stateText: `Document`, goText: `Read PDF →`, chips: [], desc: `This project's final report, documenting the service model, hands-on experience, and recommendations of the Security Mentorship Program (SMP) for civil-society groups and human-rights workers.`, cover: './cover2_en.webp?v=51a693a9', url: `https://drive.google.com/file/d/1ln6__KiGZgf9QSkYhwKo8gm4L9d9tExo/view?usp=drive_link` },
      doc3: { title: `The Cost of Trust`, sub: `Archive · File Three`, stateText: `Document`, goText: `Read PDF →`, chips: [], desc: `A case-study record of real security-attack incidents experienced by human-rights workers in Taiwan, documenting attack patterns, the defense process, and lessons learned.`, cover: './cover3_en.webp?v=51a693a9', url: `https://drive.google.com/file/d/1Q3Z2nLJ4dkQpmSqXQcctl4IW3cUhdDkF/view?usp=drive_link` },
    },
    ruins: {
      personal: {
        title: `Personal Security`, sub: `A stone-house ruin in the forest`, defense: `Personal account defense`,
        desc: `Phone and computer settings, account security, safe browsing, encrypted communication — protections you can do right now.`,
        chips: [`Phone/PC`, `Account security`, `Web browsing`, `Encrypted chat`, `Travel abroad`],
        tip: `A reminder for home: turn on two-factor authentication for your key accounts (email, social, password manager); back up your recovery codes before switching phones so you don't get locked out.`,
        review: [
          `Accounts: enable two-factor (MFA) on key accounts (email, social), and back up your recovery codes first.`,
          `Passwords: use a different long password for every site, and let a password manager keep them.`,
          `Devices: set a screen lock and turn on automatic updates to patch holes promptly.`,
          `Connections: use a VPN on public Wi-Fi; use end-to-end encrypted apps for sensitive conversations.`,
        ],
      },
      org: {
        title: `Organization Security`, sub: `A fortress ruin on the hill`, defense: `Org governance defense`,
        desc: `Work computers, network environment, account management, data permissions and backups, policy templates.`,
        chips: [`Work PCs`, `Network`, `Account management`, `Data permissions`, `Data backup`, `Policy templates`],
        tip: `A reminder for organizations: rehearse restoring from backups regularly, revoke access the moment an employee leaves, and grant only the minimum permissions the job requires.`,
        review: [
          `Accounts: revoke access immediately on departure or transfer; follow the principle of least privilege.`,
          `Device baseline: enable disk encryption, auto-updates, screen lock, and anti-malware on work machines.`,
          `Backups: follow 3-2-1 and rehearse restoring regularly — an untested backup is no backup.`,
          `Policy: write the rules clearly with policy templates so everyone follows the same standard.`,
        ],
      },
      common: {
        title: `Common Security Incidents`, sub: `A collapsed tower by the rift`, defense: `Incident-response defense`,
        desc: `Phishing, ransomware, leaked passwords, hijacked accounts — what to do first when they happen.`,
        chips: [`Phishing`, `Ransomware`, `Leaked passwords`, `Account hijack`, `NAS attacks`, `Website attacks`],
        tip: `Don't rush to click suspicious messages: log in via the official app or your own bookmark to verify; if you're actually caught out, change your password, turn on MFA, and keep screenshots as evidence.`,
        review: [
          `Phishing: don't click links in suspicious messages — log in via your own bookmark or the official app to confirm.`,
          `Spotting URLs: check whether the "final main domain" is correct; the https lock and the logo can both be faked.`,
          `If caught: change your password immediately, turn on MFA, keep screenshots, and report it as appropriate.`,
          `Ransomware: recover data from "offline, off-site" backups — don't pay the ransom.`,
        ],
      },
      guide: {
        title: `Security Check-up & Progress Tracking`, sub: `An obelisk in the wilds`, defense: `Assessment & tracking defense`,
        desc: `Use a checklist to give your org a "security check-up": take stock of where things stand, set priorities, and record improvement progress and follow-up tasks so security upgrades are visible and trackable.`,
        chips: [`Take stock`, `Checklist`, `Progress tracking`, `Impact review`],
        tip: `Don't track progress from memory: use a checklist to note what's done and what's next, and review and update it regularly.`,
        review: [
          `Start: take stock first — the current state of your devices, accounts, and data.`,
          `Prioritize: handle items by risk (likelihood × impact), highest first.`,
          `Track: use a shared checklist for what's done and what's next instead of relying on memory.`,
          `Iterate: after rollout, review results and gather feedback regularly, then adjust.`,
        ],
      },
      tools: {
        title: `Recommended Tools`, sub: `A market ruin by the lake`, defense: `Everyday-tools defense`,
        desc: `A curated set of easy-to-use security tools: password manager, authenticator, VPN, backup, and more.`,
        chips: [`Password manager`, `Authenticator`, `VPN`, `Backup tools`],
        tip: `How to pick tools: a password manager for strong passwords, an authenticator as a second gate, a VPN on public Wi-Fi, and 3-2-1 backups for important data.`,
        review: [
          `Password manager: stores a different strong password for every site — you only remember one master password.`,
          `Authenticator app: generates one-time codes as a second gate beyond your password.`,
          `VPN: encrypts all of your device's outbound traffic on public Wi-Fi.`,
          `Backup: follow 3-2-1 (cloud + multiple offline copies) and test restoring regularly.`,
        ],
      },
    },
  },
};

// ── 合併：結構 + 文字 → main.js 既有物件形狀 ─────────────────────
const DEFAULT_TEXT_LANG = 'zh-Hant';
function assemble(lang) {
  const t = TEXT[lang] || TEXT[DEFAULT_TEXT_LANG];
  const merge = (s, x) => ({ ...s, ...(x || {}) });
  return {
    VILLAGE_BOARD: merge(STRUCT.board, t.board),
    OCF_STATUE: merge(STRUCT.ocf, t.ocf),
    MONUMENT: merge(STRUCT.monument, t.monument),
    LIGHTHOUSE: merge(STRUCT.lighthouse, t.lighthouse),
    PARTNER_WALL: merge(STRUCT.partnerwall, t.partnerwall),
    LEGEND: merge(STRUCT.legend, t.legend),
    WEAPON_CHEST: merge(STRUCT.chest, t.chest),
    GUIDE_KIT: merge(STRUCT.guidekit, t.guidekit),
    ARCHIVE_DOCS: STRUCT.docs.map((d) => merge(d, t.docs[d.id])),
    RUINS: STRUCT.ruins.map((r) => merge(r, t.ruins[r.id])),
  };
}

// 已備妥文字的語言（供切換器列出；尚未翻譯的語言不會出現）
export const CONTENT_LANGS = Object.keys(TEXT);
export const CONTENT = Object.fromEntries(CONTENT_LANGS.map((l) => [l, assemble(l)]));
