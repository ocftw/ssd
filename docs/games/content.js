// 內容素材：村莊告示牌 + 散落荒野的遺跡（＝資安主題課程）
// 想新增/調整主題，改這裡就好；位置用「方位角度 + 距村中心距離」表示。
// 連結指向正式站台，閱讀內容仍在 MkDocs 文件，不受本實驗影響。
const SITE = 'https://ssd.ocf.tw';

// 村莊中央的告示牌（旅程的起點與說明，不計入遺跡進度）
export const VILLAGE_BOARD = {
  id: 'how-to', title: '村長的告示牌', sub: '怎麼升級資安？', emoji: '🧭',
  url: `${SITE}/how-to/`,
  desc: '歡迎來到新手村！這片土地的枯萎不是天災——是當年守護村子的「防線」一道道倒下，色彩才跟著褪去。走出村莊，找到散落各地的「資安遺跡」，每一座都是一門課程；你修復的每座遺跡，就是替自己的村子重建一道防線。五道防線齊備，村子就會重新亮起。地圖上的金色路標會指引你建議的下一站，但你也可以自由選擇先去哪一座。',
  chips: ['整體路線', '優先順序', '新手友善'],
};

// OCF 紀念碑（荒野中的隱藏地標，非課程：無戰鬥、不計遺跡進度）
// stateText / goText 會覆寫面板右下的狀態文字與前往鍵文字。
export const OCF_STATUE = {
  id: 'ocf', title: '開放文化基金會 OCF', sub: '荒野中的紀念碑', emoji: '💛',
  color: 0xffd24b, angle: 150, radius: 48, url: 'https://ocf.tw/',
  desc: '開放文化基金會（OCF）是支持台灣開源、開放資料與數位人權的非營利組織，也是「資安防護新手村」背後的推手。喜歡這個專案嗎？歡迎到官網支持我們，讓開放與資安教育走得更遠。',
  chips: ['開源', '開放資料', '數位人權', '非營利'],
  stateText: '感謝支持', goText: '前往 OCF 官網支持 →',
};

// 英雄紀念碑：首頁主視覺當壁畫 + 一段傳說（非課程、不計進度）
// story=true → 面板說明不截斷顯示全文；noLink=true → 隱藏前往鍵。
export const LEGEND = {
  id: 'legend', title: '英雄紀念碑', sub: '斑駁的古老壁畫', emoji: '🏛️',
  desc: '很久很久以前，一群英雄曾守護著這座村莊——御龍的勇者、綠袍的法師，與牠們忠誠的夥伴，一次次擊退降臨的威脅。後來，一場巨變奪走了大地的色彩，英雄們也就此下落不明，沒有人知道他們去了哪裡。如今只剩這面斑駁的壁畫，靜靜記著他們的身影。據說，當村裡的水晶重新點亮，他們會再次出現在這片土地上……',
  chips: [], stateText: '遠古的傳說', story: true, noLink: true,
};

// 英雄遺落的武器寶箱（村外的隱藏地標，非課程：無戰鬥、不計遺跡進度）
// 走近 → 跳出說明 → 按鍵連到資安實戰教材資源頁。
export const WEAPON_CHEST = {
  id: 'chest', title: '英雄遺落的武器寶箱', sub: '荒野中的古老寶箱', emoji: '🗡️',
  color: 0xffd24b, angle: 74, radius: 30, url: 'https://ssd.ocf.tw/resources/cscs-materials.html',
  desc: '傳說中的英雄離開時，把武器封存在這只寶箱。打開一看——裡頭不是刀劍，而是一整套「資安實戰教材」：簡報、講義與練習。帶上它們，你也能像當年的英雄一樣守住自己的村莊。',
  chips: ['資安教材', '簡報講義', '實作練習', '自由取用'],
  stateText: '英雄的武器庫', goText: '取得教材資源 →',
};

// 資安升級工具包（村外的「資源寶箱」，非課程；走近 → 說明 → 連到 /guide/）
// 給組織內負責資安的夥伴：如何在自己的組織裡一步步推動資安提升。
export const GUIDE_KIT = {
  id: 'guidekit', title: '資安升級工具包', sub: '組織推動資安的工具箱', emoji: '🧰',
  color: 0xb98bff, angle: 106, radius: 30, url: 'https://ssd.ocf.tw/guide/',
  desc: '給組織內負責資安的夥伴：一套「如何在組織裡推動資安提升」的方法與工具——威脅建模、風險評估、裝置稽核、成效檢視，陪你一步步把整個組織的防護升級。',
  chips: ['組織推動', '威脅建模', '風險評估', '裝置稽核', '成效檢視'],
  stateText: '組織工具包', goText: '打開工具包 →',
};

// 檔案室裡的 3 份文件（走進檔案室 → 室內 → 靠近文件台開 PDF 新分頁）
// cover：文件台上展示的封面圖（依序對應）。
export const ARCHIVE_DOCS = [
  { id: 'doc1', title: '台灣人權與民主倡議團體數位威脅概況', sub: '檔案室・卷宗一', emoji: '📄', stateText: '文件', goText: '閱讀 PDF →', chips: [], cover: './cover1.webp', url: 'https://drive.google.com/file/d/1sxAFmSiJL6DzdO3ezq_hJSBROuGXNLAA/view', desc: '2024 年研究報告摘要（中文版），整理 35 份問卷與 3 場深度訪談中，在臺人權與民主倡議團體面臨的數位威脅樣態與資安需求。' },
  { id: 'doc2', title: '守護倡議之聲', sub: '檔案室・卷宗二', emoji: '📄', stateText: '文件', goText: '閱讀 PDF →', chips: [], cover: './cover2.webp', url: 'https://drive.google.com/file/d/1wgYdObezFzlI6OJLozzqQF5Vt11B7gCd/view?usp=drive_link', desc: '本專案結案報告，整理「資安陪伴計畫」(SMP) 對公民團體與人權工作者的服務模式、實作經驗與建議。' },
  { id: 'doc3', title: '信任的代價', sub: '檔案室・卷宗三', emoji: '📄', stateText: '文件', goText: '閱讀 PDF →', chips: [], cover: './cover3.webp', url: 'https://drive.google.com/file/d/1VwZwVXpOjTBZibVCTbIF1wUdPhQU_wJz/view?usp=drive_link', desc: '一份針對臺灣人權工作者實際遭遇資安攻擊事件的個案研究實錄，記錄攻擊樣態、防守過程與經驗教訓。' },
];

// 散落在村莊外的遺跡：每一座 = 一個資安主題
export const RUINS = [
  {
    id: 'personal', title: '個人資安', sub: '森林裡的石屋遺跡', emoji: '🏠',
    color: 0x4fd1a8, style: 'grove', angle: 32, radius: 62, url: `${SITE}/personal/`,
    defense: '個人帳號防線',
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
  {
    id: 'org', title: '組織資安', sub: '山丘上的堡壘遺跡', emoji: '🏢',
    color: 0x5b9cff, style: 'fortress', angle: 110, radius: 80, url: `${SITE}/org/`,
    defense: '組織治理防線',
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
  {
    id: 'common', title: '常見資安事件', sub: '裂谷邊的崩塌高塔', emoji: '🚨',
    color: 0xff7a5c, style: 'tower', angle: 188, radius: 70, url: `${SITE}/common/`,
    defense: '臨場應變防線',
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
  {
    id: 'guide', title: '資安體檢與進度追蹤', sub: '荒野中的方尖碑', emoji: '📋',
    color: 0x5bc8bf, style: 'obelisk', angle: 250, radius: 84, url: `${SITE}/assessment/`,
    defense: '盤點追蹤防線',
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
  {
    id: 'tools', title: '工具推薦', sub: '湖畔的市集遺跡', emoji: '🛠️',
    color: 0xffc24b, style: 'market', angle: 308, radius: 60, url: `${SITE}/tools/`,
    defense: '日常工具防線',
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
];
