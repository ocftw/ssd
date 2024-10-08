---
icon: material/folder-open
title: 資料管理與備份
---

# :material-folder-open: 資料管理與備份

資訊安全政策範本分為基礎版與進階版，各版本分別再分為四個等級類型，請衡量組織的狀況作適當的調整。

!!! tip ""

    「資料管理與備份」包含章節內容中的「[檔案存取權限](../chapter/files_management/files_access.md)」、「[資料備份與封存](../chapter/files_management/backup_archive.md)」、「[更新軟體](../chapter/files_management/software_update.md)」。

## 等級說明

| 等級  | 說明                     |
| :---: | ------------------------ |
| 優先  | 需優先且必須達成的項目。 |
| 建議  | 完成或達成該項目會更好。 |
| 須知  | 需先瞭解相關的背景知識。 |
| 選用  | 額外的建議或其他的選項。 |

## 基礎版本

> 適用於剛開始建立資訊安全政策的小型公民團體

!!! danger "優先"

    1. **資料管理與備份使用者教育**：每位團體成員必須接受基礎資料管理與備份的教育，瞭解其重要性。
    2. **檔案存取權限控制**：所有成員必須為其資料設定密碼並定期更換（至少每三個月一次）。
    3. **週期性資料備份**：每個成員的工作資料必須在每週末備份一次，備份副本存放在異地硬碟上。
    4. **軟體更新**：每個成員在使用任何軟體之前，須確認其已更新至最新版本。
    5. **基本防毒軟體安裝**：所有工作設備必須安裝防毒軟體，並定期更新病毒碼。
    6. **建立事故報告流程**：發現任何資料遺失或異常，必須立即向主要負責人報告。
    7. **阻止外部裝置自動執行**：應設定裝置阻止 USB 等外部儲存裝置的自動執行功能。

!!! info "建議"

    1. **資料分類與標記**：每個成員對於其整理的資料進行分類和標記，以便於管理和查找。
    2. **設置唯一帳號與密碼**：每個成員在使用組織內部系統時必須使用唯一的帳號和密碼登入。
    3. **限制網路存取範圍**：限制所有成員的網路存取範圍，僅允許訪問與工作相關的網站。
    4. **軟體使用清單**：制定允許和禁止使用的軟體清單，要求成員避免使用來路不明的軟體。
    5. **定期檢查與審查紀錄**：每季度定期檢查並記錄資料備份與存取權限情況。
    6. **定期防毒掃描**：要求成員每月進行一次全系統的防毒掃描。
    7. **提供簡易安全手冊**：制定並分發一份簡易的資訊安全手冊給每位成員。

!!! warning "須知"

    1. **備份副本管理**: 瞭解如何正確存放和管理備份副本。
    2. **加密技術基礎**：瞭解基本的資料加密技術及其應用方式。
    3. **資訊安全基本實務**：瞭解什麼是資訊安全，包括常見的威脅與應對策略。
    4. **密碼策略**：瞭解如何設定強密碼以及密碼管理的常見方法。
    5. **軟體更新的重要性**：瞭解為何及如何進行軟體更新。
    6. **非法存取的風險與影響**：瞭解非法存取所帶來的風險與影響。
    7. **資料刪除的正確方法**：瞭解如何正確且安全地刪除機敏資料。

!!! quote "選用"

    1. **雲端備份**：考慮使用雲端備份服務作為額外的備份手段。
    2. **虛擬私人網路（VPN）**：對工作機敏性的資料進行傳輸時，可考慮使用 VPN 以增強安全性。
    3. **定期安全培訓**：每半年進行一次內部安全培訓工作坊或講座。
    4. **使用雙重認證**：在系統登入或重要操作中，使用雙重認證以提升安全性。
    5. **指定資安負責人**：指定一位成員為資安負責人，負責日常的安全管理和應急處理。
    6. **資料存取記錄**：實施資料存取日誌管理，紀錄並定期稽核存取紀錄。
    7. **社交工程防護**：針對社交工程攻擊，進行課程培訓並制定相關防護措施。

## 進階版本

> 適用於已有一定資訊安全政策基礎且規模較大的公民團體

??? danger "進階版本"

    !!! danger "優先"

          1. **落實定期資料備份檢查**：所有成員每週定期檢查備份的有效性，確保備份資料可用。
          2. **限定存取權限**：根據工作需要限定成員對資料的存取權限，避免資料過度曝光。
          3. **多層次資料備援**：設置多層次備份（例如：本地、異地和雲端備份），以提升資料安全。
          4. **強制內部網路隔離**：內部網路進行分區隔離，重要資料與一般工作資料分開存放。
          5. **系統漏洞修補**：及時應用所有系統和應用程式的安全性更新和修補程式。
          6. **啟動全磁碟加密**：對所有工作設備進行全磁碟加密，防止資料被非法取得。
          7. **落實密碼強度規定**：強制限制密碼設定須包括大小寫字母、數字和特殊符號，且長度不少於 16 位。

    !!! info "建議"

          1. **資料存取稽核**：定期對資料存取行為進行稽核，辨識並應對異常行為。
          2. **使用加密通訊**：所有內部資料傳輸須使用加密通訊協議（如 TLS/SSL）。
          3. **週期性安全評估**：每半年進行一次完整的安全評估，識別並修正潛在的安全風險。
          4. **政策更新檢視**：每年檢視並更新資訊安全政策，確保其持續適用。
          5. **特定資料異地同步**：對部分特定資料進行即時異地同步儲存，以便能立即恢復。
          6. **導入資源監控**：對成員使用的資源（如：存取頻率、頻寬使用等）進行監控。
          7. **導入端點檢測與回應（EDR）**：增加設備端點的安全監控，及時應對攻擊事件。

    !!! warning "須知"

          1. **高等級加密技術**：瞭解高等級的加密技術及其在工作中的應用。
          2. **緊急應變計畫制訂與演練**：制定並定期演練緊急應變計畫，確保在資料洩漏或攻擊發生時快速反應。
          3. **跨平台的安全措施**：瞭解並實行不同平臺（如 Windows、Mac、Linux）上的安全措施。
          4. **資安事件反應流程**：瞭解並實行標準的資安事件反應流程。
          5. **安全設備使用**：瞭解及妥善使用各種安全設備（如 防火牆、DLP）。
          6. **社交工程威脅認識**：更深入瞭解社交工程威脅，學習防範方法。
          7. **多因素認證（MFA）技術**：瞭解和應用多因素認證技術，提高登入安全性。

    !!! quote "選用"

          1.  **企業級雲端安全**：引入企業級的雲端安全解決方案，進一步提升雲端資料的安全性。
          2.  **端點安全管理 ESM**：實行端點安全管理，提供更細緻且即時的端點保護與管理。
          3. **持續滲透測試**：進行持續或間歇性滲透測試，找出並修補潛在漏洞。
          4. **自行托管伺服器**：考慮自行托管伺服器，以完全掌握資料的控制權與安全性。
          5. **數位簽章技術**：使用數位簽章技術，確保資料的完整性及來源的真實性。
          6. **網路流量分析**：引入網路流量分析工具，持續監控並分析不正常的網路行為。
          7. **自動化資訊安全解決方案**：導入自動化的資訊安全解決方案，替代部分人工操作，減少人為錯誤。
