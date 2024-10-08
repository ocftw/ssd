---
icon: material/order-bool-descending-variant
---
# 風險評估表

!!! note "風險評估表（正體中文版）"

    - :open_file_folder: [表格下載](https://drive.google.com/file/d/1z70BFEZ64b99-MGoEY43Z5StHMoJLOJA/view)[^1]。

    [^1]: 表格原始參考「[Security Education Companion](https://www.securityeducationcompanion.org/materials/threat-modeling-activity-handout-english-spanish)」。

## 名詞定義

- 資產：我想要保護什麼？
- 攻擊者：我想要保護我的資產免於誰的攻擊？
- 威脅：如果失敗了，潛在的後果是什麼？
- 風險：特定威脅發生的可能性。
- 攻擊者的能耐：攻擊者為了達成目的，有能力作些什麼？

!!! success ""

    - 不確定各項目如何進行，可以先參考「[章節內容：風險評估](../chapter/threat_modeling_class.md)」

## 威脅模型範例

### 範例：珠寶店商人

請開啟「風險評估表」並從第一頁開始，範例是以「珠寶店商人的威脅建模」。

??? abstract "1. 你要保護哪些資產？"

    - 價值 100 萬元的鑽石
    - 保險箱中的現金
    - 警報代碼
    - 客戶託管在保險箱中的物品

??? question "2. 誰是你的攻擊者？"

    - 珠寶小偷
    - （還有誰可以打開保險箱？）

??? failure "3. 如果失敗了，後果是什麼？"

    - 珠寶失竊
    - 損失客戶的信賴

??? warning "4. 這些發生的機會有多大？"

    - 員工亂放鑰匙
    - 一隻憤怒的熊把大門拆了
    - 客人偷瞄到保險箱的密碼
    - 珠寶店遭到強烈抗議
    - 寶石遭竊

??? tip "5. 如何應對最有可能發生的風險？"

    - 員工離職時更換密碼。

### 範例：公民團體的風險評估

??? abstract "1. 你要保護哪些資產？"

    - 成員、支持者、捐款者、關係人際網的個人資料，包括姓名、聯絡方式和貢獻記錄。
    - 團體的聲譽和信譽，以及其推動的議題。
    - 財務資源，包括捐款和資助來源。
    - 活動和項目的計劃和內部文件。

??? question "2. 誰是你的攻擊者？"

    - 駭客和惡意軟體可能試圖入侵網站或電子郵件系統，竊取成員資料或製造虛假資訊。
    - 政府或監控機構可能對團體進行監視或監控其成員和活動。
    - 業界利益相反者可能試圖破壞團體的聲譽或阻撓其活動。

??? failure "3. 如果失敗了，後果是什麼？"

    - 成員個人資料外洩可能導致隱私侵犯、信用卡詐騙或身份盜竊。
    - 團體的聲譽受損可能導致支持者流失、資助減少或議題推動的困難。
    - 財務資源外洩或損失可能導致活動和項目的中斷或取消。

??? warning "4. 這些發生的機會有多大？"

    - 在數位時代，公民團體面臨的網路攻擊和監控風險不容忽視。
    - 團體活動可能引起爭議，使其成為攻擊者的目標。

??? tip "5. 如何應對最有可能發生的風險？"

    - 實施加密和其他安全措施來保護成員和支持者的個人資料。
    - 定期進行資訊安全檢查，以確保系統和網站的安全性。
    - 提供資安意識培訓，讓成員了解如何保護自己或他人的個人資訊。
    - 與法律專家合作，確保團體的活動符合相關法律法規，並了解其權利和義務。

### 範例：公民團體上街抗議的風險評估

??? abstract "1. 你要保護哪些資產？"

    - 參與者的安全和健康。
    - 團體的聲譽和形象。
    - 活動的合法性和合法權益。
    - 公共空間的使用權。

??? question "2. 誰是你的攻擊者？"

    - 執法部門可能會試圖干預抗議活動，包括逮捕行動或使用武力驅散人群。
    - 政府或其他利益相關者可能會試圖破壞抗議活動，包括透過媒體渲染不利形象或操控輿論。
    - 極端分子或激進分子可能會試圖擾亂活動，導致暴力衝突或破壞財產。

??? failure "3. 如果失敗了，後果是什麼？"

    - 參與者可能遭受傷害、逮捕或其他不良後果。
    - 團體的聲譽和形象可能受到損害，使得其目標難以實現。
    - 活動的合法性和合法權益可能受到損害，面臨法律訴訟或其他法律後果。
    - 公共空間的使用權可能受到限制或取消。

??? warning "4. 這些發生的機會有多大？"

    - 抗議活動往往受到政府和其他利益相關者的監視和干預，風險相對較高。
    - 在某些情況下，抗議活動可能會引發暴力事件或其他不良後果。

??? tip "5. 如何應對最有可能發生的風險？"

    - 在策劃和組織抗議活動時，需要進行全面的風險評估，並制定應對措施。
    - 提供安全培訓，教導參與者如何在抗議活動中保持安全，如何與執法部門溝通以及如何處理潛在的暴力衝突。
    - 與律師團隊合作，確保抗議活動符合法律法規，並為可能的法律後果做好準備。
    - 與媒體和公眾溝通，傳達活動的目的和訴求，並防止外界對活動的誤解或曲解。

### 範例：公民團體辦公環境的風險評估

??? abstract "1. 你要保護哪些資產？"

    - 辦公室設備和資源，如電腦、印表機、資料庫、NAS。
    - 成員和員工的個人資料，包括姓名、聯絡方式和其他機敏信息。
    - 團體的財務資源，包括捐款、贊助和其他財務文件。
    - 組織的知識產權，如內部文件、研究報告和策略文件。

??? question "2. 誰是你的攻擊者？"

    - 入室盜竊：不法分子可能會試圖闖入辦公室，竊取設備或文件。
    - 登入嘗試：未經授權的登入或外部攻擊可能導致機敏資訊的外洩。
    - 社交工程攻擊：駭客可能通過欺騙手段，如偽造電子郵件或電話詐騙，試圖獲取機敏訊息。
    - 資料外洩：員工或成員的意外或有意訊息洩漏，可能導致機密文件的外洩。

??? failure "3. 如果失敗了，後果是什麼？"

    - 資產損失：設備和文件的丟失可能導致工作中斷或損害。
    - 隱私侵犯：個人資料的外洩可能導致法律責任、罰款或信用卡詐騙。
    - 財務損失：財務資源的外洩或盜竊可能導致經濟損失或資金流失。
    - 聲譽損害：訊息洩漏或安全漏洞可能損害組織的聲譽和信譽。

??? warning "4. 這些發生的機會有多大？"

    - 辦公環境中的安全風險是實際存在的，尤其是當公民團體處於社會機敏問題的前沿時。
    - 員工和成員的安全意識和訓練程度也會影響安全風險的程度。

??? tip "5. 如何應對最有可能發生的風險？"

    - 實施物理安全措施，如安全鎖和監視系統，以防止入室盜竊。
    - 建立資料安全政策和程序，包括加密機敏資訊、定期備份資料和限制存取權限。
    - 提供安全培訓，提高員工和成員對安全風險的認識，教導如何辨識和應對安全威脅。
    - 定期進行安全檢查和稽查，確保辦公環境的安全措施得到有效實施並及時更新。

## 政策制定

[:material-arrow-right-bold: 政策制定：威脅建模](../policy/risk_assessment.md){ .md-button .md-button--primary }
