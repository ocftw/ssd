// 介面字串（多語系）：原本散落在 main.js／battle.js／index.html 的文字集中於此。
// 需要內插數字／資料的存成小函式（可處理各語言語序差異）。
// emoji 與符號（🛡️🤍🔗✕ 等）多為語言中性，沿用即可。
// 翻譯時：陣列（waterLines／idleLines）長度可不同；函式請維持參數順序。
export const UI_ALL = {
  'zh-Hant': {
    // 文件標題 / meta（首屏由 index.html pre-script 先設，載入後再以此校正）
    docTitle: '資安防護新手村 · 探險',
    metaDesc: '以 Three.js 打造的『資安防護新手村』探險實驗：走出村莊，尋找散落荒野的資安遺跡。素材來自 ssd.ocf.tw，不影響原始文件。',

    // 標題卡
    titleH1: '資安防護新手村 · 探險',
    titleP: '走出村莊，尋找散落荒野的「資安遺跡」。靠近就會發現它、打開課程，讀完即點亮。',

    // 右上 / 任務清單 / 操作提示
    soundToggle: '音效開關',
    logBtn: '📜 任務',
    questHd: '遺跡課程',
    resetBtn: '🔄 重置進度',
    hintMove: 'WASD / 方向鍵 移動',
    hintRun: 'Shift 奔跑',
    hintTap: '點地面 走過去',
    hintDrag: '拖曳 轉視角',
    hintZoom: '滾輪 縮放',

    // 課程卡
    panelClose: '關閉',
    fightBtn: '⚔️ 挑戰守關怪物',
    cancelDialog: '取消對話框',
    jumpAria: '跳躍',
    jumpBtn: '跳',
    mapCap: '新手村地圖',
    mapVillage: '村',

    // 戰鬥固定文字（其餘由 battle.js 透過注入的 ui 取用）
    flee: '逃跑 ✕',
    readChapter: '讀這個章節 →',

    // 完成（重生）畫面
    finaleH2: '新手村重生！',
    finaleP: '五道防線全部重建，中央大水晶綻放光芒，灰暗的村莊重獲生機——被石化的村民也解開了。這是你這趟旅程練成的「英雄守則」，把它帶回現實世界吧：',
    finaleScrollHd: '📜 英雄守則・你的個人行動清單',
    finaleTakeaway: '📚 延伸閱讀：進階文章 →',
    finaleRank: '榮銜：資安守護者 🛡️',
    finaleClose: '繼續探索 →',

    // 載入
    loaderText: '正在生成世界…',

    // 3D 標籤
    labelBoard: '村長告示牌',
    labelOcf: 'OCF 紀念碑',
    labelArchive: '📚 檔案室',
    labelGuideNext: '🧭 建議下一站',
    ruinUnknownLabel: '❔ 未知遺跡',
    keeperPetrified: '🗿 一尊石化的村民…',
    keeperHeader: (emoji, title) => `${emoji} ${title}・維護者`,
    keeperMore: (n, m) => `點一下看下一則　${n}/${m} →`,
    mageHeader: '🧙 村裡的嚮導',
    mageTip: '走出村莊，找回散落各地的「資安遺跡」並點亮水晶。遇到守關怪物時，用課程裡學到的小知識回擊就行！',
    mageTipDone: '五道防線都重建了，天也亮了——你成了真正的資安守護者！把學到的帶回現實：常用帳號開兩步驗證、用密碼管理器、定期備份。想複習就去找各遺跡的維護者聊聊吧。',

    // 課程卡狀態 / 前往鍵
    stateVillageQuest: '村莊任務',
    goLearnHow: '了解怎麼開始 →',
    statePurified: '✅ 已淨化',
    stateHasMonster: '⚔️ 有守關怪物',
    goReadBeforeBattle: '先閱讀章節備戰 →',
    stateReadDone: '✅ 已閱讀完成',
    stateNotRead: '尚未閱讀',
    goReadAgain: '再讀一次 →',
    goReadCourse: '閱讀此遺跡課程 →',

    // 進度徽章 / 任務清單
    badge: (d, c, total) => `🗺️ 發現 <b>${d}/${total}</b> ・ ✅ 閱讀 <b>${c}/${total}</b>`,
    stDone: '已閱讀',
    stDisc: '已發現',
    stNone: '未發現',
    unknownRuin: '未知遺跡',
    exploreHint: '到荒野探索找找看',

    // 通知（toast）
    toastDiscoverTitle: '🗺️ 發現遺跡',
    toastDiscoverSub: (emoji, title, sub) => `${emoji} ${title} — ${sub}`,
    toastDefense: (defense) => `🛡️ 重建了「${defense}」`,
    toastPurified: '🎉 遺跡淨化！',
    toastProgress: (title, left) => `${title} 已點亮 — 再點亮 ${left} 座，中央大水晶就會甦醒`,
    resetConfirm: '確定要重置所有遺跡進度嗎？此動作無法復原。',
    resetToastTitle: '🔄 進度已重置',
    resetToastSub: '所有遺跡回到未發現狀態',

    // 前後測信心檢核
    confQPre: '出發前，你對「保護自己的數位安全」有多少把握？',
    confQPost: '走完這趟旅程，現在你的把握是？',
    confSubPre: '一指選一個就好，通關時會再問一次。',
    confSubPost: '和出發前比比看吧。',
    confLevels: ['不太有把握', '普通', '蠻有把握'],
    confUp: '把握度提升了，繼續保持！',
    confSame: '穩穩守住了把握度。',
    confDown: '別氣餒，回章節再練練就更穩。',
    confCompare: (faceA, faceB, msg) => `把握度：${faceA} → ${faceB}　${msg}`,

    // 主角頭頂對話泡
    waterLines: ['哇！水好冰～', '我的鞋全濕了…', '撲通！這裡能游泳嗎？', '等等，我不太會游泳啦！', '冷颼颼…該上岸了。'],
    idleLines: [
      // 資安小提醒
      '可疑連結，絕對不點！',
      '雙重驗證開了，帳號才安心～',
      '密碼別重複用，一站一個才安全。',
      '長密碼短語，又好記又難破解。',
      '備份要 3-2-1：三份、兩種、一份離線。',
      '釣魚信？騙不了我的。',
      '公共 Wi-Fi 還是開個 VPN 比較安心。',
      '手機螢幕鎖，一定要設好。',
      '系統更新跳出來，就乖乖更新吧。',
      '密碼管理器幫我記，我只要記一組。',
      '收到「帳號異常」別緊張，自己開官網確認。',
      '備份碼收好了，換手機也不怕。',
      '中了勒索別付贖金，先靠備份救。',
      '主管突然要我買點數？先打通電話確認。',
      '權限給剛剛好就好，這叫最小權限。',
      'Passkey 聽說又方便又安全，來研究看看。',
      '重要訊息，加密傳才放心。',
      '密碼好像外洩了？先改密碼、再開 MFA。',
      '網址拼錯一個字，可能就是假網站。',
      '離職同事的帳號，記得要收回。',
      '定期看看帳號的登入紀錄。',
      '不明附件先別開，確認寄件人再說。',
      'QR Code 也可能是陷阱，掃之前想一下。',
      '備份做了嗎？我有做喔。',
      // 氛圍穿插
      '今天也要好好保護村子。',
      '前面的遺跡好像在發光？',
      '走走走，去探險！',
      '風好舒服…',
      '不知道村民們什麼時候會醒來。',
    ],

    // 戰鬥（由 main.js 注入給 BattleSystem）
    battle: {
      win: '🎉 淨化成功！',
      correct: '✓ 答對了！出招！',
      retreat: '撤退凱旋',
      next: '繼續',
      defeated: '🛡️ 防護被擊穿了…',
      goRead: '先去讀章節再來',
      wrongRetry: '✗ 中招了！看懂下面的說明，再試一次 →',
      tryAgain: '再試一次',
      wrongLearn: '✗ 中招了！點亮起的正解，學起來反擊 →',
      qCounter: (n, m, qText) => `第 ${n} / ${m} 題　${qText}`,
      phFrom: '寄件人',
      phSubject: '主旨',
      phYes: '🚩 這是釣魚／詐騙',
      phNo: '✅ 這是正常訊息',
      pwPlaceholder: '在這裡輸入一組密碼試試…',
      pwGo: '用這組密碼出招 →',
      pwMsg: {
        empty: '在上面輸入一組密碼試試…',
        common: '⚠️ 這是常見或可預測的密碼，太容易被猜中',
        short: '太短了——長度是密碼最重要的防線',
        mid: '再長一點（建議 12 字以上）會更難破解',
        variety: '夠長了！再加點變化（大小寫／數字／符號），或湊到 16 字以上',
        ok: '✓ 又長又難猜——這組可以！出招吧',
      },
    },
  },
  // 'zh-Hans': { ... }  ← Phase 2 補上
  // 'en':      { ... }  ← Phase 3 補上
};

export const UI_LANGS = Object.keys(UI_ALL);
export const DEFAULT_UI_LANG = 'zh-Hant';
