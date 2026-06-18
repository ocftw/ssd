// 戰鬥內容（多語系）：守關怪物 + 課程小測驗。
//
// 結構分兩層（與 content.js 同樣概念）：
//   STRUCT — 與語言無關：怪物視覺（color/accent/style）、題型 type、正解索引 correct、章節連結 link、
//            釣魚信顯示網址 mailLink、真假網址清單 urls（url 與 real）。翻譯不會動到這些。
//   TEXT   — 各語言文字：怪物 name/emoji、intro，以及每題的 q／options／why／釣魚信 from·subject·body。
// 合併時 options 與題目「原順序」對齊，correct 索引才會正確；翻譯請維持選項順序。
//
// 題型 type：'mcq'（預設，四選一）／'phish'（擬真釣魚卡，二選一）／'url'（真假網址）／'password'（密碼強度條）。
// ⚠️ 題目與解說屬資安教育內容，正式採用前請審閱正確性。
const SITE = 'https://ssd.ocf.tw';

// ── 結構（語言無關）──────────────────────────────────────────────
const STRUCT = {
  // 常見資安事件 → 釣魚巨怪
  common: {
    monster: { color: 0x4b6a8a, accent: 0xffe14d, style: 'angler' },
    questions: [
      { type: 'phish', isPhish: true, mailLink: 'http://accournt-verify.com/login?id=8821', link: `${SITE}/common/phishing.html` },
      { type: 'url', urls: [
        { url: 'https://accounts.google.com', real: true },
        { url: 'https://accounts-google.secure-login.com', real: false },
        { url: 'https://accounts.google.com.verify-id.net', real: false },
      ], link: `${SITE}/common/phishing.html` },
      { correct: 1, link: `${SITE}/common/leaked_password.html` },
      { correct: 1, link: `${SITE}/chapter/profile/mfa.html` },
      { correct: 1, link: `${SITE}/common/phishing.html` },
    ],
  },
  // 個人資安 → 弱密碼史萊姆
  personal: {
    monster: { color: 0x57b89c, accent: 0x9affd1, style: 'slime' },
    questions: [
      { type: 'password', link: `${SITE}/chapter/profile/password.html` },
      { correct: 1, link: `${SITE}/chapter/profile/password_manager.html` },
      { correct: 0, link: `${SITE}/chapter/profile/password_manager.html` },
      { correct: 1, link: `${SITE}/user_guide/devices/index.html` },
      { correct: 1, link: `${SITE}/chapter/profile/mfa.html` },
    ],
  },
  // 組織資安 → 勒索魔像
  org: {
    monster: { color: 0x5b8def, accent: 0x9fd0ff, style: 'golem' },
    questions: [
      { correct: 1, link: `${SITE}/org/backup/index.html` },
      { correct: 1, link: `${SITE}/org/account/audit.html` },
      { correct: 1, link: `${SITE}/org/data/role.html` },
      { correct: 1, link: `${SITE}/org/devices/baseline.html` },
      { correct: 1, link: `${SITE}/org/backup/index.html` },
    ],
  },
  // 資安升級工具包 → 迷霧幽靈
  guide: {
    monster: { color: 0x8d7bc4, accent: 0xd7b8ff, style: 'ghost' },
    questions: [
      { correct: 1, link: `${SITE}/assessment/` },
      { correct: 1, link: `${SITE}/assessment/` },
      { correct: 1, link: `${SITE}/assessment/checklist/` },
      { correct: 1, link: `${SITE}/assessment/` },
    ],
  },
  // 工具推薦 → 資料蠹蟲
  tools: {
    monster: { color: 0xc99a3a, accent: 0xffd866, style: 'bug' },
    questions: [
      { correct: 1, link: `${SITE}/tools/` },
      { correct: 1, link: `${SITE}/chapter/profile/mfa.html` },
      { correct: 1, link: `${SITE}/chapter/network/vpn.html` },
      { correct: 1, link: `${SITE}/org/backup/index.html` },
    ],
  },
};

// ── 各語言文字 ───────────────────────────────────────────────────
const TEXT = {
  'zh-Hant': {
    common: {
      monster: { name: '釣魚巨怪', emoji: '🎣' },
      intro: '一隻披著「official」外皮的巨怪擋在遺跡前，靠各種假訊息誘人上鉤。用你的資安知識回擊牠！',
      questions: [
        {
          q: '這封信進了你的收件匣——你的判斷是？',
          mail: {
            from: '"帳號安全中心" <security@accournt-verify.com>',
            subject: '【緊急】偵測到異常登入，24 小時內未驗證將永久停用',
            body: '我們偵測到你的帳號出現異常登入活動。為保障安全，請立即點擊下方連結登入驗證身分，否則帳號將於 24 小時內被永久停用。',
          },
          why: '這是典型釣魚信：寄件網域拼錯（accournt-verify.com 不是官方）、用「24 小時內停用」製造急迫、要你點信中連結登入。正確做法是不點，改用自己平常的書籤或官方 App 登入確認。',
        },
        {
          q: '你要登入 Google 帳號——下列哪一個才是「真正」的官方網址？',
          why: '看網域要找「最後一段主網域」：真正的官方主網域是 google.com。secure-login.com、verify-id.net 才是這兩個假網址真正的網域，google 只是被塞進去混淆。https 鎖頭或看起來有 google 字樣都不能當作可信依據。',
        },
        {
          q: '你不小心在可疑網站輸入了某服務的密碼，第一步該做什麼？',
          options: ['先觀察幾天，沒被盜再說', '透過官方管道登入該服務、立刻改密碼，並檢查／開啟多重驗證', '只把這個網站的密碼改掉就好', '改成另一組你其他帳號也在用的舊密碼'],
          why: '立即用官方管道改密碼並開啟 MFA；若其他帳號用了相同密碼，也要一起換掉，避免被「撞庫」連環攻破。',
        },
        {
          q: '為什麼開啟「多重驗證（MFA）」能在密碼被騙走時保護你？',
          options: ['因為密碼會自動變長', '因為登入還需要第二關（手機驗證碼或實體金鑰），光有密碼進不來', '因為開了之後密碼就不會外洩', '因為這樣就不必再記密碼了'],
          why: 'MFA 多了一道關卡，即使密碼外洩，攻擊者沒有你的第二因素（驗證碼或金鑰）仍無法登入。它不會讓密碼「不外洩」，而是讓外洩的密碼不夠用。',
        },
        {
          q: '收到主管訊息「很急！馬上幫我買點數卡，把序號拍給我」，較安全的做法是？',
          options: ['主管很急，立刻照做', '透過另一個管道（當面或打電話）向本人確認再說', '在同一個對話裡回問「請問是本人嗎」', '先用自己的錢墊，金額不大應該還好'],
          why: '假冒主管／熟人的社交工程很常見，且歹徒就在同一個對話裡，回問「是不是本人」沒有意義。凡涉及金錢、點數、轉帳，務必換一個管道親自向本人確認。',
        },
      ],
    },
    personal: {
      monster: { name: '弱密碼史萊姆', emoji: '🦠' },
      intro: '一坨由弱密碼凝聚而成的史萊姆，最怕你把每個帳號都換上又長又獨特的密碼。',
      questions: [
        {
          q: '弱密碼史萊姆最怕強密碼——在下面打造一組「又長又難猜」的密碼來反擊！',
          why: '密碼的「長度」與「不可預測性」最重要。把幾個不相關的詞組成長密碼短語（或加上大小寫、數字、符號），既好記又難被破解；別用生日、姓名或常見密碼。',
        },
        {
          q: '為什麼不該在多個網站重複使用同一組密碼？',
          options: ['只是比較難記而已', '一個網站外洩，駭客會拿同組帳密去試你其他網站（撞庫攻擊）', '只要密碼夠複雜，重複用也沒關係', '只有不重要的網站才需要不同密碼'],
          why: '這叫「撞庫」。只要一處外洩，重複使用的帳號就會被連環攻破——再複雜的密碼一旦重複使用，也擋不住。最好為每個網站使用不同的強密碼。',
        },
        {
          q: '密碼管理器最主要的好處是？',
          options: ['幫你為每個網站保存不同的強密碼，你只需記住一組主密碼', '把所有密碼都改成同一組好記的', '取代多重驗證，開了就不必再開 MFA', '取代防毒軟體'],
          why: '密碼管理器幫你產生並保存每個網站獨一無二的強密碼，你只要記住一組主密碼即可。它不會取代 MFA，兩者要一起用。',
        },
        {
          q: '手機、電腦怎麼設定才安全？',
          options: ['不設鎖比較方便', '設定螢幕鎖（PIN／生物辨識）並開啟系統自動更新', '更新常出問題，先關掉自動更新比較穩', '設個四位數生日當鎖比較好記'],
          why: '螢幕鎖與自動更新是最基本的兩道防護：前者防止他人直接操作，後者及時修補安全漏洞——關掉更新等於把已知漏洞一直留著。',
        },
        {
          q: '開啟多重驗證（MFA）後，萬一手機遺失，怎樣才不會被鎖在帳號外？',
          options: ['不用事先準備，到時候再說', '事先保存好「備份碼」，並設定第二種驗證方式（如另一裝置或安全金鑰）', '把備份碼截圖存在手機相簿就好', '乾脆別開 MFA，免得換機麻煩'],
          why: '啟用 MFA 時就先保存備份碼、並準備備援驗證方式。備份碼若只截圖存在手機相簿，手機遺失就一起沒了，也可能被偷看，要妥善另存。',
        },
      ],
    },
    org: {
      monster: { name: '勒索魔像', emoji: '🗿' },
      intro: '一尊由疏於管理的系統堆砌而成的魔像，最怕健全的備份、權限控管與裝置基準。',
      questions: [
        {
          q: '遇到勒索軟體把檔案加密了，最能救回資料的是？',
          options: ['趕快付贖金把檔案贖回來', '平時就做好的「異地、離線」備份', '用防毒軟體掃描就能把檔案解回來', '重灌系統，檔案自然會回來'],
          why: '付贖金不保證能還原，還可能成為再次目標；防毒與重灌都救不回已被加密的檔案。可靠的離線／異地備份（3-2-1 原則）才是救命關鍵。',
        },
        {
          q: '員工離職時，組織的帳號管理應該怎麼做？',
          options: ['帳號先留著，之後可能還會用到', '立即停用或回收其帳號與各項權限', '只改密碼、帳號繼續開著', '等系統定期清理就好'],
          why: '離職、轉調都要即時調整權限。未回收的帳號是常見的入侵破口——只改密碼、留著帳號仍有風險。',
        },
        {
          q: '「最小權限原則」是指什麼？',
          options: ['統一都給管理員權限最方便', '只給每個人完成工作所需的最小權限', '主管一律給最高權限', '先全部開放，出事再收回'],
          why: '只給必要權限，可在帳號被盜或內部失誤時，把可能造成的傷害降到最低。',
        },
        {
          q: '公務電腦的基本安全基準，應該包含？',
          options: ['為了相容性關閉系統更新', '開啟磁碟加密、自動更新、螢幕鎖與防毒', '全公司共用一個管理帳號比較好管', '把防毒關掉避免影響效能'],
          why: '為公務裝置訂出一致的安全基準（加密、更新、鎖定、防毒），是組織防護的地基；共用帳號則會讓事件無法追查。',
        },
        {
          q: '關於組織的備份，下列哪個觀念正確？',
          options: ['備份設定好就一勞永逸', '要定期演練「還原」，確認備份真的救得回來', '備份放在同一台機器上就夠了', '有雲端同步就等於有備份'],
          why: '沒有測試過還原的備份，等於沒有備份。雲端「同步」會把刪除或加密一起同步過去，並不等於備份；定期演練還原才能確保關鍵時刻派得上用場。',
        },
      ],
    },
    guide: {
      monster: { name: '迷霧幽靈', emoji: '👻' },
      intro: '一團由「不知道該從哪做起」的迷霧凝成的幽靈，最怕清楚的盤點、排序與紀錄。',
      questions: [
        {
          q: '幫組織做一次「資安體檢」，較好的起點是？',
          options: ['先買一套最貴的資安工具', '先盤點現況——裝置、帳號、資料目前的狀態', '先辦一場全員資安講座', '先把所有系統都換新'],
          why: '先盤點現況，才能找出缺口、排出優先序，避免買了用不到或重複的工具。',
        },
        {
          q: '資安改善的資源有限時，應該如何排定優先順序？',
          options: ['想到什麼就先做什麼', '依「風險」（發生可能性 × 造成衝擊）由高到低處理', '先把預算花在最貴的工具上', '先挑最簡單、最快看到成果的做'],
          why: '以風險為導向，先處理「最可能發生且後果最嚴重」的項目，效益最高；只挑簡單的做容易漏掉真正致命的缺口。',
        },
        {
          q: '要追蹤資安改善的進度，最實用的做法是？',
          options: ['靠負責人記在腦中就好', '用共用的檢查清單／紀錄表記下「做到哪、待辦什麼」', '等出事了再回頭檢討', '每年大盤點一次就夠'],
          why: '檢查清單與紀錄表能讓組織、顧問與個人對齊進度，避免單靠記憶而遺漏。',
        },
        {
          q: '導入新的資安措施之後，應該怎麼做？',
          options: ['導入完成就可以放著不管', '定期檢視成效，並依實際情況調整', '立刻把所有措施再換一輪', '交給工具自動執行，不必再看'],
          why: '資安是持續循環：導入後要檢視成效、收集回饋，再滾動調整。',
        },
      ],
    },
    tools: {
      monster: { name: '資料蠹蟲', emoji: '🐛' },
      intro: '一隻專咬「沒在用好工具」的蠹蟲，最怕密碼管理器、驗證器、VPN 與定期備份。',
      questions: [
        {
          q: '想為每個網站都用不同的強密碼又記得住，最推薦使用？',
          options: ['把密碼寫在便利貼貼在螢幕邊', '密碼管理器', '存在瀏覽器記事本／手機備忘錄裡', '用同一組密碼但每個網站加個編號'],
          why: '密碼管理器能為每個網站保存獨特強密碼，你只需記住一組主密碼；記事本或「加編號」的密碼都很容易被看到或猜到。',
        },
        {
          q: '驗證器 App（如 Authenticator）的用途是？',
          options: ['幫你掃毒', '產生一次性驗證碼，作為登入時的第二道關卡（MFA）', '幫你自動產生並記住密碼', '加密你的網路連線'],
          why: '驗證器每隔數十秒產生一組一次性碼，當作密碼之外的第二因素。產生並記住密碼是密碼管理器、加密連線是 VPN，別搞混了。',
        },
        {
          q: '在公共 Wi-Fi 想保護連線隱私，可以考慮使用？',
          options: ['關掉螢幕亮度', '信譽良好的 VPN', '把手機調成飛航模式再連', '只要網站有 https 就完全不必擔心'],
          why: 'VPN 會把你的連線加密，在不可信的公共網路上多一層保護。https 只保護「該網站」的連線，VPN 則保護整台裝置的對外流量。',
        },
        {
          q: '想避免重要資料遺失，最實在的工具與習慣是？',
          options: ['只存在一台電腦裡', '定期備份，並分散存放（雲端 + 離線多份）', '只用雲端同步一份就夠', '偶爾想到再手動複製到隨身碟'],
          why: '依 3-2-1 原則定期備份、分散存放，才能在故障、遺失或勒索時把資料救回來；單一雲端同步會把刪除或加密一起同步，不算備份。',
        },
      ],
    },
  },
  'zh-Hans': {
    common: {
      monster: { name: '钓鱼巨怪', emoji: '🎣' },
      intro: '一只披着「official」外皮的巨怪挡在遗迹前，靠各种假信息诱人上钩。用你的安全知识回击它！',
      questions: [
        {
          q: '这封信进了你的收件箱——你的判断是？',
          mail: {
            from: '"账号安全中心" <security@accournt-verify.com>',
            subject: '【紧急】检测到异常登录，24 小时内未验证将永久停用',
            body: '我们检测到你的账号出现异常登录活动。为保障安全，请立即点击下方链接登录验证身份，否则账号将于 24 小时内被永久停用。',
          },
          why: '这是典型钓鱼邮件：发件域名拼错（accournt-verify.com 不是官方）、用「24 小时内停用」制造紧迫、要你点邮件里的链接登录。正确做法是不点，改用自己平常的书签或官方 App 登录确认。',
        },
        {
          q: '你要登录 Google 账号——下列哪一个才是「真正」的官方网址？',
          why: '看域名要找「最后一段主域名」：真正的官方主域名是 google.com。secure-login.com、verify-id.net 才是这两个假网址真正的域名，google 只是被塞进去混淆。https 锁标志或看起来有 google 字样都不能当作可信依据。',
        },
        {
          q: '你不小心在可疑网站输入了某服务的密码，第一步该做什么？',
          options: ['先观察几天，没被盗再说', '通过官方渠道登录该服务、立刻改密码，并检查／开启多重验证', '只把这个网站的密码改掉就好', '改成另一组你其他账号也在用的旧密码'],
          why: '立即用官方渠道改密码并开启 MFA；若其他账号用了相同密码，也要一起换掉，避免被「撞库」连环攻破。',
        },
        {
          q: '为什么开启「多重验证（MFA）」能在密码被骗走时保护你？',
          options: ['因为密码会自动变长', '因为登录还需要第二关（手机验证码或实体密钥），光有密码进不来', '因为开了之后密码就不会外泄', '因为这样就不必再记密码了'],
          why: 'MFA 多了一道关卡，即使密码外泄，攻击者没有你的第二因素（验证码或密钥）仍无法登录。它不会让密码「不外泄」，而是让外泄的密码不够用。',
        },
        {
          q: '收到主管信息「很急！马上帮我买点卡，把序列号拍给我」，较安全的做法是？',
          options: ['主管很急，立刻照做', '通过另一个渠道（当面或打电话）向本人确认再说', '在同一个对话里回问「请问是本人吗」', '先用自己的钱垫，金额不大应该还好'],
          why: '冒充主管／熟人的社会工程很常见，且坏人就在同一个对话里，回问「是不是本人」没有意义。凡涉及金钱、点卡、转账，务必换一个渠道亲自向本人确认。',
        },
      ],
    },
    personal: {
      monster: { name: '弱密码史莱姆', emoji: '🦠' },
      intro: '一坨由弱密码凝聚而成的史莱姆，最怕你把每个账号都换上又长又独特的密码。',
      questions: [
        {
          q: '弱密码史莱姆最怕强密码——在下面打造一组「又长又难猜」的密码来反击！',
          why: '密码的「长度」与「不可预测性」最重要。把几个不相关的词组成长密码短语（或加上大小写、数字、符号），既好记又难被破解；别用生日、姓名或常见密码。',
        },
        {
          q: '为什么不该在多个网站重复使用同一组密码？',
          options: ['只是比较难记而已', '一个网站外泄，黑客会拿同组账号密码去试你其他网站（撞库攻击）', '只要密码够复杂，重复用也没关系', '只有不重要的网站才需要不同密码'],
          why: '这叫「撞库」。只要一处外泄，重复使用的账号就会被连环攻破——再复杂的密码一旦重复使用，也挡不住。最好为每个网站使用不同的强密码。',
        },
        {
          q: '密码管理器最主要的好处是？',
          options: ['帮你为每个网站保存不同的强密码，你只需记住一组主密码', '把所有密码都改成同一组好记的', '取代多重验证，开了就不必再开 MFA', '取代杀毒软件'],
          why: '密码管理器帮你生成并保存每个网站独一无二的强密码，你只要记住一组主密码即可。它不会取代 MFA，两者要一起用。',
        },
        {
          q: '手机、电脑怎么设置才安全？',
          options: ['不设锁比较方便', '设置屏幕锁（PIN／生物识别）并开启系统自动更新', '更新常出问题，先关掉自动更新比较稳', '设个四位数生日当锁比较好记'],
          why: '屏幕锁与自动更新是最基本的两道防护：前者防止他人直接操作，后者及时修补安全漏洞——关掉更新等于把已知漏洞一直留着。',
        },
        {
          q: '开启多重验证（MFA）后，万一手机丢失，怎样才不会被锁在账号外？',
          options: ['不用事先准备，到时候再说', '事先保存好「备份码」，并设置第二种验证方式（如另一设备或安全密钥）', '把备份码截图存在手机相册就好', '干脆别开 MFA，免得换机麻烦'],
          why: '启用 MFA 时就先保存备份码、并准备备用验证方式。备份码若只截图存在手机相册，手机丢失就一起没了，也可能被偷看，要妥善另存。',
        },
      ],
    },
    org: {
      monster: { name: '勒索魔像', emoji: '🗿' },
      intro: '一尊由疏于管理的系统堆砌而成的魔像，最怕健全的备份、权限管控与设备基准。',
      questions: [
        {
          q: '遇到勒索软件把文件加密了，最能救回数据的是？',
          options: ['赶快付赎金把文件赎回来', '平时就做好的「异地、离线」备份', '用杀毒软件扫描就能把文件解回来', '重装系统，文件自然会回来'],
          why: '付赎金不保证能还原，还可能成为再次目标；杀毒与重装都救不回已被加密的文件。可靠的离线／异地备份（3-2-1 原则）才是救命关键。',
        },
        {
          q: '员工离职时，组织的账号管理应该怎么做？',
          options: ['账号先留着，之后可能还会用到', '立即停用或回收其账号与各项权限', '只改密码、账号继续开着', '等系统定期清理就好'],
          why: '离职、转岗都要及时调整权限。未回收的账号是常见的入侵突破口——只改密码、留着账号仍有风险。',
        },
        {
          q: '「最小权限原则」是指什么？',
          options: ['统一都给管理员权限最方便', '只给每个人完成工作所需的最小权限', '主管一律给最高权限', '先全部开放，出事再收回'],
          why: '只给必要权限，可在账号被盗或内部失误时，把可能造成的伤害降到最低。',
        },
        {
          q: '办公电脑的基本安全基准，应该包含？',
          options: ['为了兼容性关闭系统更新', '开启磁盘加密、自动更新、屏幕锁与杀毒', '全公司共用一个管理账号比较好管', '把杀毒关掉避免影响性能'],
          why: '为办公设备定出一致的安全基准（加密、更新、锁定、杀毒），是组织防护的地基；共用账号则会让事件无法追查。',
        },
        {
          q: '关于组织的备份，下列哪个观念正确？',
          options: ['备份设置好就一劳永逸', '要定期演练「还原」，确认备份真的救得回来', '备份放在同一台机器上就够了', '有云端同步就等于有备份'],
          why: '没有测试过还原的备份，等于没有备份。云端「同步」会把删除或加密一起同步过去，并不等于备份；定期演练还原才能确保关键时刻派得上用场。',
        },
      ],
    },
    guide: {
      monster: { name: '迷雾幽灵', emoji: '👻' },
      intro: '一团由「不知道该从哪做起」的迷雾凝成的幽灵，最怕清楚的盘点、排序与记录。',
      questions: [
        {
          q: '帮组织做一次「安全体检」，较好的起点是？',
          options: ['先买一套最贵的安全工具', '先盘点现状——设备、账号、数据目前的状态', '先办一场全员安全讲座', '先把所有系统都换新'],
          why: '先盘点现状，才能找出缺口、排出优先级，避免买了用不到或重复的工具。',
        },
        {
          q: '安全改善的资源有限时，应该如何排定优先顺序？',
          options: ['想到什么就先做什么', '按「风险」（发生可能性 × 造成影响）由高到低处理', '先把预算花在最贵的工具上', '先挑最简单、最快看到成果的做'],
          why: '以风险为导向，先处理「最可能发生且后果最严重」的项目，效益最高；只挑简单的做容易漏掉真正致命的缺口。',
        },
        {
          q: '要追踪安全改善的进度，最实用的做法是？',
          options: ['靠负责人记在脑中就好', '用共享的检查清单／记录表记下「做到哪、待办什么」', '等出事了再回头检讨', '每年大盘点一次就够'],
          why: '检查清单与记录表能让组织、顾问与个人对齐进度，避免单靠记忆而遗漏。',
        },
        {
          q: '导入新的安全措施之后，应该怎么做？',
          options: ['导入完成就可以放着不管', '定期检视成效，并按实际情况调整', '立刻把所有措施再换一轮', '交给工具自动执行，不必再看'],
          why: '安全是持续循环：导入后要检视成效、收集反馈，再滚动调整。',
        },
      ],
    },
    tools: {
      monster: { name: '数据蠹虫', emoji: '🐛' },
      intro: '一只专咬「没在用好工具」的蠹虫，最怕密码管理器、验证器、VPN 与定期备份。',
      questions: [
        {
          q: '想为每个网站都用不同的强密码又记得住，最推荐使用？',
          options: ['把密码写在便利贴贴在屏幕边', '密码管理器', '存在浏览器记事本／手机备忘录里', '用同一组密码但每个网站加个编号'],
          why: '密码管理器能为每个网站保存独特强密码，你只需记住一组主密码；记事本或「加编号」的密码都很容易被看到或猜到。',
        },
        {
          q: '验证器 App（如 Authenticator）的用途是？',
          options: ['帮你杀毒', '生成一次性验证码，作为登录时的第二道关卡（MFA）', '帮你自动生成并记住密码', '加密你的网络连接'],
          why: '验证器每隔几十秒生成一组一次性码，当作密码之外的第二因素。生成并记住密码是密码管理器、加密连接是 VPN，别搞混了。',
        },
        {
          q: '在公共 Wi-Fi 想保护连接隐私，可以考虑使用？',
          options: ['关掉屏幕亮度', '信誉良好的 VPN', '把手机调成飞行模式再连', '只要网站有 https 就完全不必担心'],
          why: 'VPN 会把你的连接加密，在不可信的公共网络上多一层保护。https 只保护「该网站」的连接，VPN 则保护整台设备的对外流量。',
        },
        {
          q: '想避免重要数据丢失，最实在的工具与习惯是？',
          options: ['只存在一台电脑里', '定期备份，并分散存放（云端 + 离线多份）', '只用云端同步一份就够', '偶尔想到再手动复制到 U 盘'],
          why: '按 3-2-1 原则定期备份、分散存放，才能在故障、丢失或勒索时把数据救回来；单一云端同步会把删除或加密一起同步，不算备份。',
        },
      ],
    },
  },
  'en': {
    common: {
      monster: { name: `Phishing Behemoth`, emoji: `🎣` },
      intro: `A behemoth cloaked in an "official" hide blocks the ruin, luring people in with all kinds of fake messages. Strike back with your security know-how!`,
      questions: [
        {
          q: `This email just landed in your inbox — what's your call?`,
          mail: {
            from: `"Account Security Center" <security@accournt-verify.com>`,
            subject: `[URGENT] Suspicious login detected — verify within 24 hours or your account will be permanently disabled`,
            body: `We detected unusual login activity on your account. To keep it safe, please click the link below to log in and verify your identity, or your account will be permanently disabled within 24 hours.`,
          },
          why: `This is a classic phishing email: the sender domain is misspelled (accournt-verify.com is not official), it manufactures urgency with "disabled within 24 hours," and it wants you to log in via a link in the email. The right move is not to click — log in via your own bookmark or the official app to confirm.`,
        },
        {
          q: `You want to log in to your Google account — which of these is the real official URL?`,
          why: `To read a domain, find the "last main domain": the real official domain is google.com. secure-login.com and verify-id.net are the actual domains of these two fakes — "google" is just stuffed in to confuse you. An https lock, or seeing the word "google," is not proof of trust.`,
        },
        {
          q: `You accidentally entered a service's password on a suspicious site — what's the first thing to do?`,
          options: [`Wait a few days and see if it gets hacked`, `Log in to the service through official channels, change the password immediately, and check/enable multi-factor authentication`, `Just change the password on this one site`, `Change it to another old password you also use elsewhere`],
          why: `Change the password immediately through official channels and turn on MFA; if other accounts share the same password, change those too, to avoid a chain breach via "credential stuffing."`,
        },
        {
          q: `Why does enabling "multi-factor authentication (MFA)" protect you when your password is stolen?`,
          options: [`Because the password gets longer automatically`, `Because logging in still needs a second step (a phone code or a physical key), so a password alone can't get in`, `Because once it's on, the password can't leak`, `Because you no longer need to remember passwords`],
          why: `MFA adds another gate: even if the password leaks, an attacker without your second factor (a code or a key) still can't log in. It doesn't stop the password from leaking — it makes a leaked password not enough.`,
        },
        {
          q: `You get a message from your manager: "Urgent! Buy gift cards for me right now and send me the serial numbers." What's the safer move?`,
          options: [`The manager is in a hurry, so do it right away`, `Confirm with them in person or by phone through a different channel first`, `Reply in the same chat asking "is this really you?"`, `Front the money yourself — it's a small amount, should be fine`],
          why: `Impersonating a manager or acquaintance is a common social-engineering tactic, and since the crook is in the very same chat, asking "is this really you?" there is pointless. For anything involving money, gift cards, or transfers, always confirm with the person directly through a different channel.`,
        },
      ],
    },
    personal: {
      monster: { name: `Weak-Password Slime`, emoji: `🦠` },
      intro: `A slime congealed from weak passwords — its greatest fear is you giving every account a long, unique password.`,
      questions: [
        {
          q: `The Weak-Password Slime fears strong passwords — build a "long and hard-to-guess" password below to strike back!`,
          why: `A password's "length" and "unpredictability" matter most. String a few unrelated words into a long passphrase (or add upper/lowercase, numbers, and symbols) — easy to remember and hard to crack; avoid birthdays, names, or common passwords.`,
        },
        {
          q: `Why shouldn't you reuse the same password across multiple sites?`,
          options: [`It just makes them harder to remember`, `If one site leaks, hackers will try the same credentials on your other sites (a credential-stuffing attack)`, `As long as the password is complex, reusing it is fine`, `Only unimportant sites need different passwords`],
          why: `This is "credential stuffing." One leak anywhere and every reused account falls in a chain — even a complex password can't hold once it's reused. Use a different strong password for each site.`,
        },
        {
          q: `What's the main benefit of a password manager?`,
          options: [`It saves a different strong password for every site, so you only remember one master password`, `It changes all your passwords to one easy-to-remember password`, `It replaces multi-factor authentication, so you don't need MFA`, `It replaces antivirus software`],
          why: `A password manager generates and stores a unique strong password for every site — you only need to remember one master password. It doesn't replace MFA; use both together.`,
        },
        {
          q: `How should you set up your phone and computer to be secure?`,
          options: [`Not setting a lock is more convenient`, `Set a screen lock (PIN/biometrics) and turn on automatic system updates`, `Updates often cause problems, so turning off auto-update is safer`, `A four-digit birthday makes an easy-to-remember lock`],
          why: `A screen lock and automatic updates are the two most basic protections: the former stops others from operating your device directly, the latter patches security holes promptly — turning off updates leaves known holes open.`,
        },
        {
          q: `After enabling multi-factor authentication (MFA), how do you avoid being locked out if you lose your phone?`,
          options: [`No need to prepare — deal with it when it happens`, `Save your "backup codes" in advance and set up a second verification method (such as another device or a security key)`, `Just screenshot the backup codes into your phone's photo album`, `Better not turn on MFA at all, to avoid hassle when switching phones`],
          why: `When you enable MFA, save the backup codes and set up a fallback method right away. If the backup codes only live as a screenshot in your phone's album, they're gone with the phone — and could be peeked at — so store them safely elsewhere.`,
        },
      ],
    },
    org: {
      monster: { name: `Ransom Golem`, emoji: `🗿` },
      intro: `A golem built from poorly-managed systems — it fears solid backups, access controls, and device baselines.`,
      questions: [
        {
          q: `When ransomware has encrypted your files, what gives you the best chance of recovering your data?`,
          options: [`Quickly pay the ransom to buy the files back`, `The "off-site, offline" backups you made ahead of time`, `An antivirus scan can decrypt the files`, `Reinstall the system and the files will come back on their own`],
          why: `Paying the ransom doesn't guarantee recovery and may make you a repeat target; neither antivirus nor reinstalling can recover already-encrypted files. Reliable offline/off-site backups (the 3-2-1 rule) are the lifeline.`,
        },
        {
          q: `When an employee leaves, how should the organization handle their accounts?`,
          options: [`Keep the account for now — it might be needed later`, `Immediately disable or revoke their account and all permissions`, `Just change the password and leave the account active`, `Wait for the system's periodic cleanup`],
          why: `Permissions must be adjusted promptly on departure or transfer. An un-revoked account is a common entry point for intruders — just changing the password while keeping the account is still risky.`,
        },
        {
          q: `What does the "principle of least privilege" mean?`,
          options: [`Giving everyone admin rights is the most convenient`, `Give each person only the minimum permissions needed to do their job`, `Always give managers the highest privileges`, `Open everything up first and claw it back if something goes wrong`],
          why: `Granting only necessary permissions keeps the potential damage to a minimum if an account is compromised or someone makes an internal mistake.`,
        },
        {
          q: `What should a basic security baseline for work computers include?`,
          options: [`Turning off system updates for compatibility`, `Enabling disk encryption, automatic updates, screen lock, and anti-malware`, `Sharing one admin account company-wide for easier management`, `Turning off anti-malware to avoid hurting performance`],
          why: `Setting a consistent security baseline for work devices (encryption, updates, locking, anti-malware) is the foundation of organizational protection; shared accounts make incidents impossible to trace.`,
        },
        {
          q: `About organizational backups, which idea is correct?`,
          options: [`Once backups are set up, you're done for good`, `Rehearse "restoring" regularly to confirm the backups can actually recover data`, `Keeping the backup on the same machine is enough`, `Cloud sync is the same as having a backup`],
          why: `A backup you've never tested restoring is no backup at all. Cloud "sync" propagates deletions or encryption too, so it isn't a backup; rehearsing restores regularly is what ensures they work when it counts.`,
        },
      ],
    },
    guide: {
      monster: { name: `Fog Wraith`, emoji: `👻` },
      intro: `A wraith condensed from the fog of "not knowing where to start" — it fears clear stock-taking, prioritizing, and record-keeping.`,
      questions: [
        {
          q: `What's a good starting point for giving your organization a "security check-up"?`,
          options: [`Buy the most expensive security tool first`, `Take stock of the current state first — your devices, accounts, and data`, `Hold an all-hands security talk first`, `Replace all your systems with new ones first`],
          why: `Take stock first so you can find the gaps and set priorities, avoiding tools you don't need or that overlap.`,
        },
        {
          q: `When resources for security improvements are limited, how should you set priorities?`,
          options: [`Do whatever comes to mind first`, `Handle items by risk (likelihood × impact), highest to lowest`, `Spend the budget on the most expensive tool first`, `Pick the easiest, quickest wins first`],
          why: `A risk-driven approach tackles the "most likely and most damaging" items first for the greatest payoff; only doing the easy ones tends to miss the truly critical gaps.`,
        },
        {
          q: `What's the most practical way to track progress on security improvements?`,
          options: [`Just keep it in the lead person's head`, `Use a shared checklist/log to note what's done and what's pending`, `Review it only after something goes wrong`, `One big annual stock-take is enough`],
          why: `A checklist and log keep the organization, advisors, and individuals aligned on progress, instead of relying on memory and missing things.`,
        },
        {
          q: `After rolling out a new security measure, what should you do?`,
          options: [`Once it's rolled out you can leave it alone`, `Review its effectiveness regularly and adjust to the real situation`, `Immediately swap out every measure again`, `Hand it to a tool to run automatically and never look again`],
          why: `Security is a continuous loop: after rollout, review results, gather feedback, and keep adjusting.`,
        },
      ],
    },
    tools: {
      monster: { name: `Data Bookworm`, emoji: `🐛` },
      intro: `A bookworm that gnaws at "not using good tools" — it fears password managers, authenticators, VPNs, and regular backups.`,
      questions: [
        {
          q: `To use a different strong password for every site and still remember them, what's most recommended?`,
          options: [`Write passwords on a sticky note by your screen`, `A password manager`, `Keep them in your browser's notepad or your phone's notes`, `Use the same password but add a number for each site`],
          why: `A password manager stores a unique strong password for every site — you only remember one master password; notes or "numbered" passwords are easily seen or guessed.`,
        },
        {
          q: `What is an authenticator app (like Authenticator) for?`,
          options: [`Scanning for viruses`, `Generating one-time codes as a second gate at login (MFA)`, `Automatically generating and remembering your passwords`, `Encrypting your network connection`],
          why: `An authenticator generates a one-time code every few dozen seconds as a second factor beyond your password. Generating and remembering passwords is a password manager's job; encrypting the connection is a VPN's — don't mix them up.`,
        },
        {
          q: `To protect your privacy on public Wi-Fi, what could you use?`,
          options: [`Turn down the screen brightness`, `A reputable VPN`, `Switch the phone to airplane mode before connecting`, `As long as the site has https, there's nothing to worry about`],
          why: `A VPN encrypts your connection for an extra layer of protection on untrusted public networks. https only protects the connection to "that site," while a VPN protects all of your device's outbound traffic.`,
        },
        {
          q: `To avoid losing important data, what's the most solid tool and habit?`,
          options: [`Keep it on just one computer`, `Back up regularly and store copies in multiple places (cloud + several offline copies)`, `One cloud-synced copy is enough`, `Manually copy to a USB drive whenever you happen to think of it`],
          why: `Following the 3-2-1 rule — back up regularly and spread copies out — lets you recover data after failure, loss, or ransomware; a single cloud sync propagates deletion or encryption, so it doesn't count as a backup.`,
        },
      ],
    },
  },
};

// ── 合併：結構 + 文字 → main.js / battle.js 既有題目形狀 ──────────
const DEFAULT_TEXT_LANG = 'zh-Hant';
function assemble(lang) {
  const t = TEXT[lang] || TEXT[DEFAULT_TEXT_LANG];
  const out = {};
  for (const id of Object.keys(STRUCT)) {
    const s = STRUCT[id], ts = t[id];
    out[id] = {
      monster: { ...s.monster, ...ts.monster },
      intro: ts.intro,
      questions: s.questions.map((sq, i) => {
        const tq = ts.questions[i];
        const q = { ...sq, q: tq.q, why: tq.why };
        if (tq.options) q.options = tq.options;
        if (sq.type === 'phish') q.mail = { from: tq.mail.from, subject: tq.mail.subject, body: tq.mail.body, link: sq.mailLink };
        return q;
      }),
    };
  }
  return out;
}

export const BATTLES_LANGS = Object.keys(TEXT);
export const BATTLES_ALL = Object.fromEntries(BATTLES_LANGS.map((l) => [l, assemble(l)]));
