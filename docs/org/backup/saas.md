---
title: SaaS 設定備份
---

# SaaS 設定備份

<small>預計操作時間：首次盤點約 0.5–1 天，每季截圖與匯出約 1 小時</small><br><small>所需預算：無（純人力時間）；若導入 GAM、PowerShell 等 CLI 工具或第三方備份服務，再另行編列</small>

除了資料，組織日常運作還依賴另一層東西：**設定**——使用者帳號清單、群組成員、共用磁碟結構、Calendar 共用權限、安全與 OAuth 規則等等。當 admin 帳號被駭、員工誤刪整個 group、或要對照舊架構重建組織時，光救回檔案不夠，還得知道「原本誰可以存取什麼、群組怎麼分」。

這一篇聚焦在 Google Workspace 與 Microsoft 365 的「服務設定」備份：寫給負責整體資安與行政的你，目標是把組織的「骨架」也留一份備份，不再只能憑印象重建。

!!! benefit "可以增強的防護力"

    - admin 帳號被盜或 admin 設定被改時，可對照舊版回復組織架構
    - 員工誤刪群組、共用磁碟、權限規則時，能在最短時間內重建
    - 整單位重組或外包廠商交接時，可用備份檔對照新舊架構
    - 配合 [雲端備份](cloud.md)（救資料）與 [實體備份](physical.md)（離線那份），讓事故當下的還原順序有依據


## 決定要備份的設定範圍

不是所有設定都要備份，重點是「**消失後重建會很麻煩**」的部分：

- **使用者帳號清單**：包含主要 Email、別名（alias）、群組歸屬、最後登入日。
- **群組與共用磁碟結構**：每個群組成員、共用磁碟（Shared Drive）的命名與權限。
- **雲端硬碟資料夾結構**：頂層資料夾的命名與權限分配（不需要包含每個檔案）。
- **Calendar 共用設定**：哪些行事曆對哪些成員開放、會議室資源設定。
- **內部 wiki**：Google Sites 或 SharePoint 的頁面結構與權限。
- **安全與 OAuth 規則**：admin 設定的密碼政策、雙重驗證強制清單、第三方應用程式授權白名單。
- **Form 與試算表的歷史資料**：收集個案資料的線上表單結構，避免新一年要重新設計欄位。

## Google Workspace 的做法

=== "Admin Console 報表匯出（最低門檻）"

    1. 以管理員身份登入 [admin.google.com](https://admin.google.com){target="_blank"}。
    2. 「目錄 → 使用者」可匯出全組織使用者清單為 CSV。
    3. 「目錄 → 群組」可匯出群組清單；點進去每個群組可看到成員。
    4. 「應用程式 → Drive 與文件 → 管理共用磁碟」可看到所有共用磁碟。
    5. 「安全性」與「報表」中的關鍵頁面，建議**截圖留底**，包含：登入活動、安全建議、第三方應用程式授權清單。

=== "GAM 一次性備份（CLI）"

    [GAM（Google Apps Manager）](https://github.com/GAM-team/GAM){target="_blank"} 是社群維護的開源 CLI 工具，可一次匯出 Workspace 大部分設定。常用指令範例：

    - `gam print users` 匯出使用者清單。
    - `gam print groups members` 匯出群組與成員。
    - `gam print sharddrives` 匯出共用磁碟與權限。
    - `gam print drivesettings` 匯出組織的 Drive 政策。

    GAM 適合有 1 位技術窗口協助的組織。第一次設定需要建立 OAuth 認證，之後可以排程跑。輸出 CSV 可放進加密資料夾保存。

=== "每季截圖 admin 規則頁（最低保險）"

    若不想導入 CLI，最低標準也應該每季登入 admin console，截圖以下重要頁面，存到加密資料夾：

    - 安全性 → 設定總覽
    - 安全性 → API 控制 → 應用程式存取控制
    - 報表 → 稽核 → 帳號活動（最近 90 天）
    - 應用程式 → Google Workspace → Gmail → 路由規則

## Microsoft 365 的做法

=== "Admin Center 報表匯出"

    1. 登入 [admin.microsoft.com](https://admin.microsoft.com){target="_blank"}。
    2. 「使用者 → 使用中的使用者」可匯出使用者清單為 CSV。
    3. 「團隊與群組」可匯出群組與 Teams 設定。
    4. 「報表 → 使用方式」可看到各服務的活動與授權狀況。

=== "PowerShell 指令備份"

    Microsoft 提供 [Microsoft Graph PowerShell SDK](https://learn.microsoft.com/zh-tw/powershell/microsoftgraph/installation){target="_blank"} 可批次匯出設定。常用指令範例：

    - `Get-MgUser -All | Export-Csv users.csv` 匯出所有使用者。
    - `Get-MgGroup -All | Export-Csv groups.csv` 匯出群組。
    - `Get-MgDirectoryRoleMember` 匯出各角色成員。

    需要由有 PowerShell 經驗的同仁或外包工程師協助設定。

=== "SharePoint 站台備份"

    使用 [SharePoint Migration Tool](https://learn.microsoft.com/zh-tw/sharepointmigration/introducing-the-sharepoint-migration-tool){target="_blank"} 可將整個站台與權限結構備份到本地。

## 預算或人力有限時的折衷做法

若組織還沒有專責技術窗口、預算非常有限，可採取最低標準的「截圖 + 簡單清單」做法：

1. **每季登入 admin console 一次**：依上面列的頁面清單，逐一截圖，存到加密的 ZIP 檔。
2. **手動維護一份「組織骨架」試算表**：在 Google Sheets / Excel 中記錄：
    - 使用者清單（姓名、Email、角色、加入日）
    - 群組清單（名稱、成員、用途）
    - 共用磁碟清單（名稱、成員、用途、敏感等級）
    - 重要 OAuth 授權（哪些 App 接了 Google / MS 帳號、誰授權的）
3. **每次有變動就更新**：新人到職、離職、新增群組、共用磁碟結構大改時，順手更新這份表。
4. **與 [數位服務帳號盤點](../account/audit.md) 同表維護**：避免重複輸入。


## 參考資料

- 「[雲端備份](cloud.md)」：資料的備份；本章是設定的備份。
- 「[實體備份](physical.md)」：離線那份；建議將本章的截圖與 CSV 同樣放一份在離線備份內。
- 「[數位服務帳號盤點](../account/audit.md)」：本章的「使用者清單」與帳號盤點高度重疊，可共用同一份試算表。
- 「[雙重驗證](../account/mfa.md)」：admin 帳號被盜是 SaaS 設定被改的最常見起點，admin 帳號必須開啟 MFA。
- 「[組織資安政策範本](../policy/template.md)」：本章規範可寫入第五章「備份原則」與第二章「資安角色與責任」。

