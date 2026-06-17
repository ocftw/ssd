// 內容素材：村莊告示牌 + 散落荒野的遺跡（＝資安主題課程）
// 想新增/調整主題，改這裡就好；位置用「方位角度 + 距村中心距離」表示。
// 連結指向正式站台，閱讀內容仍在 MkDocs 文件，不受本實驗影響。
const SITE = 'https://ssd.ocf.tw';

// 村莊中央的告示牌（旅程的起點與說明，不計入遺跡進度）
export const VILLAGE_BOARD = {
  id: 'how-to', title: '村長的告示牌', sub: '怎麼升級資安？', emoji: '🧭',
  url: `${SITE}/how-to/`,
  desc: '歡迎來到新手村！走出村莊，找到散落各地的「資安遺跡」，每一座都是一門課程。點亮全部遺跡，村子就安全了。',
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

// 散落在村莊外的遺跡：每一座 = 一個資安主題
export const RUINS = [
  {
    id: 'personal', title: '個人資安', sub: '森林裡的石屋遺跡', emoji: '🏠',
    color: 0x4fd1a8, style: 'grove', angle: 32, radius: 62, url: `${SITE}/personal/`,
    desc: '手機電腦設定、帳號安全、安全瀏覽、加密溝通——個人能立刻做的防護。',
    chips: ['手機/電腦', '帳號安全', '網路瀏覽', '加密溝通', '海外出差'],
    tip: '回家小提醒：把常用帳號（Email、社群、密碼管理器）都開啟兩步驗證；換手機前先備份驗證碼，才不會被鎖在門外。',
  },
  {
    id: 'org', title: '組織資安', sub: '山丘上的堡壘遺跡', emoji: '🏢',
    color: 0x5b9cff, style: 'fortress', angle: 110, radius: 80, url: `${SITE}/org/`,
    desc: '公務機、網路環境、帳號管理、資料權限與備份、政策範本。',
    chips: ['公務電腦', '網路環境', '帳號管理', '資料權限', '資料備份', '政策範本'],
    tip: '給組織的提醒：定期演練「還原」備份、員工離職立刻收回權限、權限只給工作所需的最小範圍。',
  },
  {
    id: 'common', title: '常見資安事件', sub: '裂谷邊的崩塌高塔', emoji: '🚨',
    color: 0xff7a5c, style: 'tower', angle: 188, radius: 70, url: `${SITE}/common/`,
    desc: '釣魚、勒索、密碼外洩、帳號被盜……遇到時的第一步該怎麼做。',
    chips: ['釣魚信', '勒索軟體', '密碼外洩', '帳號被盜', 'NAS 攻擊', '網站攻擊'],
    tip: '遇到可疑訊息別急著點：改用官方 App 或自己的書籤登入確認；真的中招就先改密碼、開 MFA、保留截圖證據。',
  },
  {
    id: 'guide', title: '資安升級工具包', sub: '荒野中的方尖碑', emoji: '🧰',
    color: 0xb98bff, style: 'obelisk', angle: 250, radius: 84, url: `${SITE}/guide/`,
    desc: '威脅建模、風險評估、裝置稽核——陪組織一步步升級的工具與方法。',
    chips: ['威脅建模', '風險評估', '裝置稽核', '成效檢視'],
    tip: '升級資安先盤點：列出要保護的資產與最怕的後果，依風險高低排優先序，別想一次全部做完。',
  },
  {
    id: 'tools', title: '工具推薦', sub: '湖畔的市集遺跡', emoji: '🛠️',
    color: 0xffc24b, style: 'market', angle: 308, radius: 60, url: `${SITE}/tools/`,
    desc: '精選好上手的資安工具：密碼管理器、驗證器、VPN、備份等。',
    chips: ['密碼管理器', '驗證器', 'VPN', '備份工具'],
    tip: '挑工具的原則：密碼管理器存強密碼、驗證器當第二道關、公共 Wi-Fi 用 VPN、重要資料記得 3-2-1 備份。',
  },
];
