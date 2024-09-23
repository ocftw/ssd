---
title: VPN
---

# :material-security-network: VPN

## 推薦的服務

目前推薦公民團體使用的 VPN 為：ProtonVPN、IVPN、Mullvad。其差異與特色可參考以下的表格：

- ProtonVPN：<https://protonvpn.com/>
- IVPN：<https://www.ivpn.net/>
- Mullvad：<https://mullvad.net/zh-hant>

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

[^1]: Proton VPN servers & locations. <https://protonvpn.com/vpn-servers>
[^2]: Security experts declare all Proton apps secure after they pass their security audit. <https://proton.me/blog/security-audit-all-proton-apps>
[^3]: All Proton VPN apps are now open source and audited. <https://protonvpn.com/vpn-servers>
[^4]: Payment options - Proton VPN Support. <https://protonvpn.com/support/payment-options/>
[^5]: IVPN Servers. <https://www.ivpn.net/status/>
[^6]: IVPN Posts about Audit. <https://www.ivpn.net/blog/tags/audit/>
[^7]: IVPN applications are now open source. <https://www.ivpn.net/blog/ivpn-applications-are-now-open-source/>
[^8]: IVPN What payment methods do you accept?. <https://www.ivpn.net/knowledgebase/general/what-payment-methods-do-you-accept/>
[^9]: Mullvad Servers. <https://mullvad.net/en/servers>
[^10]: Mullvad Audits. <https://mullvad.net/en/blog/tag/audits>
[^11]: Mullvad - We value open source. <https://mullvad.net/en/open-source>
[^12]: Mullvad Pricing. <https://mullvad.net/en/pricing>
[^13]: Tor and Mullvad VPN. <https://mullvad.net/zh-hant/help/tor-and-mullvad-vpn>

## Outline 自行架設

[Outline VPN](https://getoutline.org/zh-TW/) 是一款免費且開源的 VPN 軟體，由 Jigsaw（Google 旗下的資安團隊）開發。它主要為新聞記者、議題行動者和公民團體設計，目的是提供簡單、安全和隱私的網路連線。

Outline VPN 由兩個主要組件組成：

1. **Outline Manager**：這是用來設定和管理 VPN 伺服器的圖形化介面應用程式。使用者可以使用它來快速設立新的伺服器、建立連線存取金鑰及監控流量使用情況。Outline Manager 可以在 Windows、macOS 和 Linux 上運行。

2. **Outline Client**：這是提供使用者連接到 VPN 伺服器的應用程式。使用者需要將由 Outline Manager 建立的連線存取金鑰輸入到 Outline Client 中才能連接。Outline Client 支援的平臺包括 Windows、macOS、iOS、Android 和 Linux。

### 伺服器

Outline 內建的雲端伺服器為 [Digital Ocean]、[AWS] 與 [Google Cloud]。透過 AWS、Google Cloud 需要一些連線遠端服務的基礎能力，建議透過 Digital Ocean 來設定與建立。

[Digital Ocean]: https://www.digitalocean.com/
[AWS]: https://aws.amazon.com/
[Google Cloud]: https://cloud.google.com/?hl=zh-TW

### Digital Ocean 帳號建立

如果從未使用過 Digital Ocean，需先建立帳號與付款設定，在後續的 Outline 設定過程中，因為會自動建立與設定主機。

??? success "建立 Digital Ocean 帳號"

    1. **Digital Ocean 官方網站**
          - 打開瀏覽器，進入 Digital Ocean 的官方網站：[https://www.digitalocean.com](https://www.digitalocean.com)。

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

1. **下載 Outline Manager**：前往 [Outline 官網](https://getoutline.org/zh-TW/get-started/)，下載適用於你的操作系統（Windows、macOS 或 Linux）的 **Outline Manager**。
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
2. **下載 Outline 用戶端t**：讓所有需要使用 VPN 的使用者前往 [Outline 官網下載](https://getoutline.org/zh-TW/get-started/ 從第三步驟開始)，並安裝 Outline 用戶端應用程式（iOS、Android、Windows、macOS）。

### 連接至 VPN

1. **新增存取金鑰**：在 Outline 用戶端應用程式中，點擊右上方「＋」，然後輸入或掃描你分享的存取金鑰。
2. **連接 VPN**：存取金鑰新增完成後，即可在列表中開啟 VPN 連接。接著，Outline VPN 就會開始保護你的網路流量。

!!! warning "注意事項"

      - **定期更新**：保持伺服器和軟體的版本更新，以確保獲得最新的安全修正和功能改進。
      - **監控流量和負載**：定期監控你的伺服器流量和負載情況，確保 VPN 服務穩定運行。
