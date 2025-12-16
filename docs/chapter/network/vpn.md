---
title: VPN
---

# :material-security-network: VPN

VPN（Virtual Private Network，虛擬私人網路）是一種技術，通過建立加密連接，將使用者的網路流量重定向至遠端伺服器，使其看起來像是從該伺服器訪問網際網路。這能夠提高網路隱私和安全，避免資料數據封包被未授權者截取或監視。

以下是 VPN 的三個主要功能：

1. **隱藏 IP 位址**：VPN 可以掩藏使用者的真實 IP 位址，取而代之的是伺服器的 IP 位址，使得使用者的真實位置和身份更難被追蹤。
2. **傳輸數據加密**：VPN 會對使用者的網路流量進行加密，這意味著即使數據在傳輸過程中被攔截，也很難被解讀。
3. **繞過網路封鎖**：透過 VPN，使用者可以繞過地區網路限制和審查制度，訪問被封鎖的網站和服務。

## 挑選合適的 VPN

### 隱私政策

- **無記錄政策**：選擇不記錄使用者活動的 VPN，這樣即便伺服器遭受入侵，用戶的瀏覽紀錄也不會洩露。
- **透明度報告**：某些 VPN 服務會定期發佈透明度報告，詳細說明他們如何處理用戶傳輸數據和政府要求，這能增加選擇該 VPN 的信賴感。

### 伺服器和位置

- **多樣的伺服器位置**：選擇伺服器覆蓋面廣、位置分布多樣的 VPN 服務，能提供更多繞過封鎖的可能性。
- **高速伺服器**：確保所選 VPN 具有足夠的頻寬和較好效能的伺服器，以避免因連結過慢而影響使用體驗。

### 安全功能

- **進階加密技術**：選擇使用 AES-256 等行業標準高級加密技術的 VPN 服務，確保資料傳輸過程的安全。
- **自動斷線保護（Kill Switch）**：若 VPN 連接意外中斷，自動斷線功能能夠立即切斷使用者的網路連接，避免傳輸數據暴露在不安全的環境中。
- **防 DNS 洩漏**：確保 VPN 具有防 DNS 洩漏功能，防止網域名解析請求暴露真實位址。

## VPN 正確的使用情境

### 訪問被封鎖的網站和服務

- **新聞網站**：在嚴格審查的國家，公民團體可以利用 VPN 獲取被封鎖的國際新聞。
- **社群網站**：繞過封鎖，繼續在 Twitter、Facebook 等社群網站平台運作，維持組織的對外溝通管道。
- **電子郵件服務**：如 Gmail 被屏蔽時，可以透過 VPN 繞過限制，繼續運作電子郵件。

### 保護流量隱私

- **公共 Wi-Fi 安全**：在咖啡廳或公共場所使用不安全的 Wi-Fi 時，VPN 可保護個人和組織的隱私。
- **機敏訊息**：處理包含組織成員和活動計畫等機敏訊息時，投稿或聯絡關係人等工作都需要 VPN 的保護。

### 避免被政府監控

- **民主活動**：在進行機敏的民主活動或抗議時，不同地點的抗議者可同時使用 VPN 保持線上活動隱私。

## VPN 不足或是誤解使用的地方

!!! danger "VPN 不足或是誤解使用的地方"

    儘管 VPN 具有多重優點，但仍需注意其不足及誤解，以避免不當使用。

    ### VPN 不是萬能的隱私工具

    - **未完全匿名**：即使使用 VPN，{==也不能達到完全匿名==}，服務提供商仍能追蹤使用者流量來源及目的地。
    - **數據封包洩漏風險**：一些 VPN 服務不夠安全，其加密技術可能不夠強，甚至會記錄並出售使用者數據。

    ### 不適當使用 VPN 的後果

    - **速度降低**：過度依賴 VPN 可能導致連接速度顯著下降，影響正常的工作流程。
    - **法律風險**：在某些國家，使用 VPN 可能違法，進而導致法律問題。

    ### VPN 合規性問題

    - **免費 VPN 的風險**：免費 VPN 通常依賴廣告或其他方法盈利，可能涉及隱私風險。
    - **誤信假 VPN**：市面上有不少假冒的 VPN 服務，專門用來收集使用者數據或進行詐騙。

---

## 推薦的服務

目前推薦公民團體使用的 VPN 為：ProtonVPN、IVPN、Mullvad。其差異與特色可參考以下的表格：

- ProtonVPN：<https://protonvpn.com/>{target="_blank"}
- IVPN：<https://www.ivpn.net/>{target="_blank"}
- Mullvad：<https://mullvad.net/zh-hant>{target="_blank"}

|              | ProtonVPN                        | IVPN                                     | Mullvad                           |
| ------------ | -------------------------------- | ---------------------------------------- | --------------------------------- |
| 伺服器數量   | 約 5,000 台[^1]                  | 約 91 台[^5]                             | 約 684 台[^9]                     |
| 伺服器位置   | 約 91 個國家[^1]                 | 約 38 個國家[^5]                         | 約 44 個國家[^9]                  |
| 安全稽核     | 報告[^2]                         | 報告[^6]                                 | 報告[^10]                         |
| 開源軟體     | 已開源[^3]                       | 已開源[^7]                               | 已開源[^11]                       |
| 付款方式     | 信用卡、PayPal、比特幣、現金[^4] | 信用卡、PayPal、比特幣、禮物卡、現金[^8] | 信用卡、PayPal、比特幣、現金[^12] |
| 連線紀錄     | 不保留紀錄                       | 不保留紀錄                               | 不保留紀錄                        |
| 帳戶匿名     | 需建立登入帳號                   | 可匿名帳號                               | 匿名帳號                          |
| 最小付費期間 | 月                               | 週                                       | 月                                |
| 臺灣主機     | 20 台（台北、台中）              | 1 台（台北）                             | 無                                |
| Tor 洋蔥路由 | 支援，部分國家                   | 不支援                                   | 透過 Mullvad 為出口[^13]          |

[^1]: Proton VPN servers & locations. <https://protonvpn.com/vpn-servers>{target="_blank"}
[^2]: Security experts declare all Proton apps secure after they pass their security audit. <https://proton.me/blog/security-audit-all-proton-apps>{target="_blank"}
[^3]: All Proton VPN apps are now open source and audited. <https://protonvpn.com/vpn-servers>{target="_blank"}
[^4]: Payment options - Proton VPN Support. <https://protonvpn.com/support/payment-options/>{target="_blank"}
[^5]: IVPN Servers. <https://www.ivpn.net/status/>{target="_blank"}
[^6]: IVPN Posts about Audit. <https://www.ivpn.net/blog/tags/audit/>{target="_blank"}
[^7]: IVPN applications are now open source. <https://www.ivpn.net/blog/ivpn-applications-are-now-open-source/>{target="_blank"}
[^8]: IVPN What payment methods do you accept?. <https://www.ivpn.net/knowledgebase/general/what-payment-methods-do-you-accept/>{target="_blank"}
[^9]: Mullvad Servers. <https://mullvad.net/en/servers>{target="_blank"}
[^10]: Mullvad Audits. <https://mullvad.net/en/blog/tag/audits>{target="_blank"}
[^11]: Mullvad - We value open source. <https://mullvad.net/en/open-source>{target="_blank"}
[^12]: Mullvad Pricing. <https://mullvad.net/en/pricing>{target="_blank"}
[^13]: Tor and Mullvad VPN. <https://mullvad.net/zh-hant/help/tor-and-mullvad-vpn>{target="_blank"}

## Outline 自行架設

[Outline VPN](https://getoutline.org/zh-TW/){target="_blank"} 是一款免費且開源的 VPN 軟體，由 Jigsaw（Google 旗下的資安團隊）開發。它主要為新聞記者、議題行動者和公民團體設計，目的是提供簡單、安全和隱私的網路連線。

Outline VPN 由兩個主要組件組成：

1. **Outline Manager**：這是用來設定和管理 VPN 伺服器的圖形化介面應用程式。使用者可以使用它來快速設立新的伺服器、建立連線存取金鑰及監控流量使用情況。Outline Manager 可以在 Windows、macOS 和 Linux 上運行。

2. **Outline Client**：這是提供使用者連接到 VPN 伺服器的應用程式。使用者需要將由 Outline Manager 建立的連線存取金鑰輸入到 Outline Client 中才能連接。Outline Client 支援的平臺包括 Windows、macOS、iOS、Android 和 Linux。

### 伺服器

Outline 內建的雲端伺服器為 [Digital Ocean]{target="_blank"}、[AWS]{target="_blank"} 與 [Google Cloud]{target="_blank"}。透過 AWS、Google Cloud 需要一些連線遠端服務的基礎能力，建議透過 Digital Ocean 來設定與建立。

[Digital Ocean]: https://www.digitalocean.com/
[AWS]: https://aws.amazon.com/
[Google Cloud]: https://cloud.google.com/?hl=zh-TW

### Digital Ocean 帳號建立

如果從未使用過 Digital Ocean，需先建立帳號與付款設定，在後續的 Outline 設定過程中，因為會自動建立與設定主機。

??? success "建立 Digital Ocean 帳號"

    1. **Digital Ocean 官方網站**
          - 打開瀏覽器，進入 Digital Ocean 的官方網站：[https://www.digitalocean.com](https://www.digitalocean.com){target="_blank"}。

    2. **註冊帳號**
          - 點擊首頁右上角的「Sign Up」按鈕，進入註冊頁面。
          - 可以選擇使用電子郵件註冊，或透過第三方帳號（如 Google 或 GitHub）快速註冊。

    3. **填寫註冊資訊**
          - 如果選擇電子郵件註冊，請輸入你的電子郵件地址和密碼，然後點擊「Create Account」。

    4. **驗證電子郵件**
          - Digital Ocean 會發送一封確認郵件到你所填寫的電子郵件地址。請前往郵箱，找到該郵件並點擊其中的確認連結來驗證電子郵件地址。

??? success "完成信用卡付款的設定"

    在設定前，系統會引導完成 Project 的建立，請依指示完成一個 Project 的建立。

    1. **登入帳號**
          - 驗證電子郵件後，使用註冊的電子郵件和密碼登入 Digital Ocean。

    2. **前往付款資訊設定頁面**
          - 登入成功後，點擊右上角的個人頭像或使用者名稱，選擇「My Account」選項。

    3. **新增付款方式**
          - 在左側列表「Billing」頁面，找到「Add a payment method」或「新增付款方式」按鈕或連結進入。

    4. **填寫信用卡資訊**
          - 在彈出的輸入框中，填寫你的信用卡資訊，包括：
              - 信用卡號、有效期限（MM/YY）、檢查碼（CVV）
          - 確認填寫無誤後，點擊「Save」或「儲存」按鈕。

    5. **確認付款方式**
          - 如果信用卡資訊正確且有效，系統會提示成功綁定信用卡。此後，所有的 Digital Ocean 服務費用會自動從你綁定的信用卡中扣款。

### 下載和安裝 Outline Manager

1. **下載 Outline Manager**：前往 [Outline 官網](https://getoutline.org/zh-TW/get-started/){target="_blank"}，下載適用於你的操作系統（Windows、macOS 或 Linux）的 **Outline Manager**。
2. **安裝 Outline Manager**：根據下載後的安裝指引，完成安裝過程。

### 建立 VPN 伺服器

1. **開啟 Outline Manager**：啟動 Outline Manager 應用程式。
2. **建立伺服器**：左側選擇「**＋新增伺服器**」。
3. **選擇建立方法**：
      - **自動部署（建議）**：找到 DigitalOcean 區塊、點擊「建立伺服器」，並依照指示登入你的帳號、自動建立與部署伺服器。
      - **手動部署（進階）**：若已經有現成虛擬主機（VPS），可以選擇手動設置伺服器。Outline Manager 會提供一段指令，將其複製並貼到伺服器的終端（SSH）中執行。
4. **取得伺服器存取密鑰**：部署完成後，Outline Manager 會顯示你的伺服器管理密鑰。妥善保存這個密鑰，日後管理伺服器時需要使用。

### 設定使用者連線金鑰

1. **分享連線金鑰**：在 Outline Manager 中，點擊「新增金鑰」，為你的使用者建立新的連線金鑰。你可以通過複製連結或 QR Code 分享給使用者。
2. **下載 Outline 用戶端t**：讓所有需要使用 VPN 的使用者前往 [Outline 官網下載](https://getoutline.org/zh-TW/get-started/){target="_blank"}從第三步驟開始  ，並安裝 Outline 用戶端應用程式（iOS、Android、Windows、macOS）。

### 連接至 VPN

1. **新增存取金鑰**：在 Outline 用戶端應用程式中，點擊右上方「＋」，然後輸入或掃描你分享的存取金鑰。
2. **連接 VPN**：存取金鑰新增完成後，即可在列表中開啟 VPN 連接。接著，Outline VPN 就會開始保護你的網路流量。

!!! warning "注意事項"

      - **定期更新**：保持伺服器和軟體的版本更新，以確保獲得最新的安全修正和功能改進。
      - **監控流量和負載**：定期監控你的伺服器流量和負載情況，確保 VPN 服務穩定運行。

