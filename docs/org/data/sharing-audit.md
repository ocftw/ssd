---
title: 稽查雲端分享連結
---

# 稽查雲端分享連結

<small>預計操作時間：首次盤點約 0.5–1 天，其後每季稽查約 1–3 小時</small><br><small>所需預算：無（純人力時間）；若導入第三方權限稽核工具，再另行編列服務訂閱費</small>

「**知道連結即可存取**」是雲端時代最普遍的破口。一份捐款人名單，可能透過某次方便的分享，連結被轉傳到第三方、甚至被搜尋引擎索引一直公開到現在。離職同仁可能仍是某個關鍵資料夾的擁有者，沒有人能改權限，結果多年後他還是能回來翻查這份資料。這一篇是寫給負責整體資安與行政的你，目標是幫組織建立**分享連結稽查節奏**與**離職時的雲端檔案接管流程**，不再讓「方便分享」變成長期未管的隱形資產。本篇會搭配 [角色與權限](role.md) 與 [定期審查更新權限](review.md) 一起運作。

!!! benefit "可以增強的防護力"

    - 找出組織中已存在但未察覺的公開連結，及早撤銷或限縮
    - 離職與專案結束時有清楚流程接管雲端檔案，不再讓 ownership 卡在個人手上
    - 從源頭降低分享連結散落
    - 為個資保護義務與後續資安稽核留下可追溯的紀錄


## 盤點組織內所有公開連結

不同雲端服務的稽查方式不同。下面以 admin 角色與一般成員兩個視角分述：

=== "Google Workspace（admin）"

    1. 登入 [admin.google.com](https://admin.google.com){target="_blank"}。
    2. 「報表 → 稽核與調查 → Drive 記錄」，可篩選「外部使用者已查看」、「已公開分享」等事件。
    3. 「應用程式 → Google Workspace → Drive 與文件 → 共用設定」可確認組織預設分享政策（建議：「組織內」為預設、「知道連結的任何人」需經 admin 核可）。
    4. 第三方稽核工具如 [GAT+](https://www.gatlabs.com/){target="_blank"}、[Drive Audit](https://drive-audit.com/){target="_blank"} 可一次掃描整個組織的公開連結；NPO 可詢問是否有非營利方案。

=== "Microsoft 365（admin）"

    1. 登入 [Microsoft 365 系統管理中心](https://admin.microsoft.com){target="_blank"}。
    2. 進入 [Compliance Center](https://compliance.microsoft.com){target="_blank"} → 「資料生命週期管理」 → 「共用報表」，可看到 SharePoint 與 OneDrive 的所有外部分享。
    3. 「OneDrive 系統管理中心 → 共用」可調整全組織預設分享層級。

=== "Dropbox（admin）"

    1. 登入 [Dropbox Admin Console](https://www.dropbox.com/team/admin){target="_blank"}。
    2. 「活動」報表可篩選「已建立連結」、「已分享給組織外」等事件。
    3. 「設定 → 分享」可調整全組織預設政策。

=== "沒有 admin 權限時的折衷"

    若你沒有 admin 權限（例如使用免費版 Google 帳號），仍可從個人視角逐一檢視高敏感資料夾：

    - **Google Drive**：在 drive.google.com 搜尋列輸入 `to:anyone`，可列出所有「知道連結即可存取」的檔案；輸入 `to:外部 email` 可列出與外部分享的檔案。
    - **Dropbox**：個人帳號頁面的「分享」標籤頁，可看到自己建立的所有連結。
    - **OneDrive**：「共用」標籤頁可看到自己分享出去的內容。

    將檢視結果整理進下面的稽查表。

## 建立「分享連結稽查表」

第一次盤點後，建議建立一份持續維護的稽查表（可放進組織既有的資安紀錄試算表）。建議欄位：

| 欄位 | 說明 |
| --- | --- |
| 檔案 / 資料夾名稱 | 例如「2024 年捐款人名冊」 |
| 連結類型 | 公開（知道連結）／組織內／指定人 |
| 敏感等級 | 對應 [角色與權限](role.md) 的高／中／低 |
| 目前 owner | 帳號所屬人 |
| 分享對象 | 列出主要存取者；公開連結則寫「不限」 |
| 分享原因 | 例如「2024 年捐款活動」、「與某 NGO 合作」 |
| 最近檢查日 | 每次稽查更新 |
| 處理決定 | 保留／改限定人／撤銷／已轉所有權 |
| 到期日（若為臨時分享） | 例如「2025-12-31」 |

實作上：

1. 由資安或行政窗口建立表格架構，先填入第一次盤點的結果。
2. 對「**高度敏感**」與「**公開連結**」交集的項目，**24 小時內優先處理**。
3. 對「**臨時分享**」的項目，務必填上到期日。

## 將稽查變成例行工作

把分享連結稽查接進現有的資安節奏，避免變成額外的負擔：

- **每季一次完整稽查**：建議與 [定期審查更新權限](review.md) 同步進行，由同一位資安窗口統籌。
- **優先處理順序**：
    1. 高度敏感資料的公開連結 → 立即撤銷或改為指定人。
    2. 已過期的「臨時分享」 → 預設撤銷，除非有負責人提出延期理由。
    3. 離職同仁仍是 owner 的資料 → 啟動接管流程（見下節）。
    4. 對外部信箱的長期分享 → 確認合作關係仍存在，或改為共用磁碟成員邀請。
- **每次處理都記錄**：在稽查表的「處理決定」欄位填入結果與日期，方便下次稽查對照。

把這些動作寫進組織例行任務清單，與帳號盤點、權限審查搭配執行，可以大幅降低重覆功夫。

## 員工離職時的雲端檔案交接

員工離職是分享權限失控最常見的時機。建議將以下步驟寫進離職清單：

=== "Google Workspace"

    - **共用磁碟（Shared Drive）優先**：共用磁碟上的檔案 owner 屬於組織，離職時不需轉移 ownership，只需從成員清單移除該員。
    - **個人 My Drive 接管**：在 admin.google.com 的「使用者 → 該使用者 → 資料 → 移轉檔案擁有權」可一次將該員 My Drive 的所有檔案 ownership 轉移給接管人。
    - **30 天緩衝**：建議離職後保留帳號 30 天，期間若發現遺漏的檔案分享或 Calendar 事件，仍可由原帳號協助處理。
    - **撤銷個人分享連結**：被接管的檔案中，原本以該員身份建立的「知道連結即可存取」連結，建議全數撤銷後再重建（避免攻擊者未來透過外洩連結直接存取）。

=== "Microsoft 365"

    - **OneDrive 接管**：admin 可在「OneDrive 系統管理中心」設定該員 OneDrive 的「次要管理員」，將檔案複製到接管人後刪除原帳號。
    - **Stream 影片轉移**：若有用 Stream 錄製會議或培訓影片，需另外將影片擁有權轉移。
    - **Teams 群組 owner 接手**：檢查該員在哪些 Teams 群組為 owner，加上備援 owner。

=== "Dropbox / 個人帳號"

    - 多數小型組織會用個人 Dropbox 帳號處理工作，這時無法強制轉移。請在離職前要求該員手動將所有公務檔案複製到組織共用資料夾，並在組織端確認接收後再讓對方移除。
    - 個人 Email 帳號的歷史信件原則上不接管，但若有重要交涉紀錄，建議先匯出 PST / MBOX 留檔。

## 請組織夥伴使用共同磁碟 (Shared Drive)

事後處理永遠不如事前設計。對 Google Workspace / Microsoft 365 組織來說，最有效的預防是讓**所有公務檔案預設放到共用磁碟（Shared Drive / SharePoint Site）**，而不是個人 My Drive / OneDrive：

| 項目 | 個人 My Drive / OneDrive | 共用磁碟 / SharePoint Site |
| --- | --- | --- |
| 檔案擁有權 | 個人 | 組織 |
| 離職時 | 需逐一轉移 ownership | 移除成員即可，檔案不動 |
| 分享連結管理 | 各自為政 | 可由 admin 統一稽查 |
| 預設分享層級 | 較難集中控制 | 可由 admin 統一政策 |

可採取的預設行為：

1. **新人到職時，預設加入對應部門的共用磁碟**，並說明「公務檔案請建立在共用磁碟」。
2. **逐步把過去散落在 My Drive 的檔案，移到共用磁碟**：每季鎖定 1–2 個資料夾搬遷，避免一次大遷移造成混亂。
3. **不要為了「方便分享」就把檔案放回個人空間**：若需要與外部協作，建議建立專案專用的共用磁碟，結束後封存。


## 參考資訊

- 「[角色與權限](role.md)」：本章稽查表的「敏感等級」欄位對應該章建立的資料分類。
- 「[定期審查更新權限](review.md)」：建議與本章每季一起執行，兩者共用同一個檢查週期。
- 「[雲端備份](../backup/cloud.md)」：備份還原回來的資料若沒有重新檢查分享連結，可能造成新的外洩，記得把本章稽查列入還原後的標準動作。
- 「[數位服務帳號盤點](../account/audit.md)」：盤點時可順手記錄哪些雲端服務有分享連結需要稽查。
- 「[組織資安政策範本](../policy/template.md)」：本章內容對應「資料分類、權限與備份原則」的存取權限段。

<div class="sub-category-cards">
  <div class="sub-category-card">
    <h3 class="sub-category-card__title">角色與權限</h3>
    <p class="sub-category-card__duration">首次設計約 1–2 天，其後每年檢查與調整約數小時</p>
    <p class="sub-category-card__description">把資料分敏感等級、把權限綁在角色上而非個人；本章稽查表會直接引用該章的資料分類。</p>
    <a href="role.html" class="sub-category-card__cta">› 馬上設計</a>
  </div>

  <div class="sub-category-card">
    <h3 class="sub-category-card__title">定期審查更新權限</h3>
    <p class="sub-category-card__duration">每 3–6 個月檢查約 1–3 小時</p>
    <p class="sub-category-card__description">把分享連結稽查與權限定期審查放在同一個檢查週期，由同一位窗口統籌，減少重工。</p>
    <a href="review.html" class="sub-category-card__cta">› 馬上排程</a>
  </div>

  <div class="sub-category-card">
    <h3 class="sub-category-card__title">雲端備份</h3>
    <p class="sub-category-card__duration">首次規劃約 0.5–1 天，每月例行匯出約 1–2 小時</p>
    <p class="sub-category-card__description">備份取回資料時別忘了重新檢查分享連結，否則「還原 = 重新公開」。</p>
    <a href="../backup/cloud.html" class="sub-category-card__cta">› 馬上規劃</a>
  </div>
</div>
