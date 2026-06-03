# VPN

預計操作時間：約 15–30 分鐘（選擇服務、註冊與首次連線）\
所需預算：依服務而異；免費選項 0 元；付費服務訂閱費約月付 50–200 元或年付約 500–2000 元

VPN（虛擬私人網路）能將你的網路流量經由加密通道送到遠端伺服器再連上網路，讓別人較難從連線看出你的真實位置與內容。對公民團體來說，像是多一層盾：存取被封鎖的新聞或社群、在公共 Wi‑Fi 下保護流量、或降低被監控的風險時，都可以考慮使用。但 VPN 並不能達到完全匿名，服務商仍能得知流量經由其伺服器進出。若要更高匿名性，需搭配其他工具（如 Tor）並注意使用習慣。此外，市面上的 VPN 品質參差，部分會記錄或出售使用者數據，免費 VPN 也常依廣告營利、隱私風險較高，建議選擇有第三方稽核與無記錄政策的服務。使用 VPN 可能略為影響連線速度，且部分國家或地區對 VPN 使用有法律限制，使用前請留意當地規定。

可以增強的防護力

- 隱藏真實 IP，降低被追蹤或鎖定身份的風險
- 傳輸過程加密，降低流量被窺探的風險
- 繞過地區封鎖，存取被限制的網站或服務
- 在公共 Wi‑Fi 下保護連線，減少被竊聽的風險

## 挑選合適的 VPN

- **隱私政策**：優先選擇標示「無記錄」（不記錄使用者活動）且願意公布透明度報告的服務，較能降低資料外洩風險。
- **伺服器與位置**：伺服器數量與分布國家愈多，通常愈容易找到穩定連線或繞過特定地區封鎖；可依需求（例如是否需要臺灣節點）比較。
- **安全功能**：建議選擇具備自動斷線保護（Kill Switch，VPN 斷線時自動切斷網路）與防 DNS 洩漏的產品，避免連線中斷時流量外露。

以下為我們建議的開源、注重隱私的 VPN 服務，門檻不高、好上手。開源代表程式碼公開，外部的資安研究人員可以獨立審查確認沒有後門或隱藏的資料收集，選擇開源工具，你的信任不必只靠廠商的自我聲明。**主要建議**為 ProtonVPN 與 Mullvad；**亦可考慮** IVPN。若預算有限或僅需基本保護，可參考免費選項 Riseup VPN（功能與節點較受限）。差異與特色見下表。

|              | ProtonVPN[1](#fn:1)          | Mullvad[2](#fn:2)             | IVPN[3](#fn:3)                       | Riseup VPN       |
| ------------ | ---------------------------- | ----------------------------- | ------------------------------------ | ---------------- |
| 伺服器數量   | 約 15,000+ 台                | 約 700 台                     | 約 88 台                             | 有限（捐贈維運） |
| 伺服器位置   | 約 120+ 個國家               | 約 50 個國家                  | 約 41 個國家                         | 無臺灣節點       |
| 安全稽核     | 有[4](#fn:4)                 | 有[5](#fn:5)                  | 有[6](#fn:6)                         | 有第三方稽核     |
| 開源軟體     | 是                           | 是                            | 是                                   | 是               |
| 付款方式     | 信用卡、PayPal、比特幣、現金 | 信用卡、PayPal、比特幣、現金  | 信用卡、PayPal、比特幣、禮物卡、現金 | 免費（捐贈）     |
| 連線紀錄     | 不保留紀錄                   | 不保留紀錄                    | 不保留紀錄                           | 不保留紀錄       |
| 帳戶匿名     | 需註冊帳號                   | 匿名帳號（僅帳號編號）        | 可匿名帳號                           | 不需註冊         |
| 最小付費期間 | 月                           | 月                            | 週                                   | —                |
| 臺灣主機     | 有（台北、台中等）           | 無                            | 有（台北）                           | 無               |
| Tor 洋蔥路由 | 支援（部分國家）             | 透過 Mullvad 為出口[7](#fn:7) | 不支援                               | 不支援           |

- **ProtonVPN**：<https://protonvpn.com/>
- **Mullvad**：<https://mullvad.net/zh-hant>
- **IVPN**：<https://www.ivpn.net/>
- **Riseup VPN**：<https://riseup.net/en/vpn>（由 Riseup 維護，供行動者與公民團體使用）

**免費選項說明**：Riseup VPN 為免費、開源、無日誌，不需註冊即可使用，適合預算有限或僅需基本保護的團體。以捐贈維運，伺服器數量與頻寬有限，連線速度可能較慢，且無法自選節點、無臺灣節點，亦無 Kill Switch 等進階功能；若需要穩定速度或臺灣節點，建議改用付費服務。

## 在需要的時候，開啟 VPN

- **訪問被封鎖的網站與服務**：在審查較嚴的地區，可用 VPN 存取被封鎖的新聞、社群平台或電子郵件服務，維持對外溝通。
- **保護流量隱私**：在咖啡廳、機場等公共 Wi‑Fi 下處理公務或機敏訊息時，VPN 可加密傳輸，降低被竊聽風險。
- **降低被監控風險**：進行敏感倡議或跨地協作時，成員可透過 VPN 降低連線被單一節點監控的風險（VPN 仍無法達到完全匿名，僅為多一層防護）。

## 其他做法：自行架設 Outline

[Outline VPN](https://getoutline.org/zh-TW/) 是免費、開源的自架 VPN 方案，由 Jigsaw（Google 旗下資安團隊）發起，現由 Outline Foundation 維護；不記錄使用者活動。適合**已有 IT 人員或可自行維護伺服器的公民團體**，由組織自建 VPN 供成員使用。

Outline 由兩部分組成：**Outline Manager**（在 Windows、macOS、Linux 上安裝，用來建立與管理 VPN 伺服器、產生連線金鑰）；**Outline Client**（成員在手機或電腦安裝，輸入金鑰後連線）。伺服器可架在 [Digital Ocean](https://www.digitalocean.com/)、[AWS](https://aws.amazon.com/) 或 [Google Cloud](https://cloud.google.com/?hl=zh-TW)；若不熟悉雲端，建議優先使用 Digital Ocean（需先具備帳號並完成付款設定，詳見 [Outline 官方入門](https://getoutline.org/zh-TW/get-started/)）。

1. **取得 VPS 並建立伺服器**：下載並安裝 [Outline Manager](https://getoutline.org/zh-TW/get-started/)，在左側選擇「＋新增伺服器」。可選「自動部署」並依指示登入 Digital Ocean 自動建機，或選「手動部署」在既有 VPS 上貼上 Outline 提供的指令執行。完成後妥善保存 Manager 顯示的**伺服器管理密鑰**。
1. **建立並分享連線金鑰**：在 Outline Manager 中點擊「新增金鑰」，為每位成員建立一組連線金鑰，以連結或 QR Code 分享。
1. **成員連線**：成員至 [Outline 官網](https://getoutline.org/zh-TW/get-started/) 下載 Outline Client（iOS、Android、Windows、macOS），安裝後點擊「＋」輸入或掃描金鑰即可連線。

請定期更新伺服器與 Outline 軟體以取得安全修正，並檢視伺服器流量與負載以確保服務穩定。介面與步驟可能因版本而異，請以 [Outline 官方說明](https://getoutline.org/zh-TW/get-started/) 為準。

______________________________________________________________________

1. Proton VPN servers & locations. <https://protonvpn.com/vpn-servers> [↩](#fnref:1 "Jump back to footnote 1 in the text")
1. Mullvad Servers. <https://mullvad.net/en/servers> [↩](#fnref:2 "Jump back to footnote 2 in the text")
1. IVPN Servers. <https://www.ivpn.net/status/> [↩](#fnref:3 "Jump back to footnote 3 in the text")
1. Security audit - Proton VPN. <https://proton.me/blog/security-audit-all-proton-apps> [↩](#fnref:4 "Jump back to footnote 4 in the text")
1. Mullvad Audits. <https://mullvad.net/en/blog/tag/audits> [↩](#fnref:5 "Jump back to footnote 5 in the text")
1. IVPN Audits. <https://www.ivpn.net/blog/tags/audit/> [↩](#fnref:6 "Jump back to footnote 6 in the text")
1. Tor and Mullvad VPN. <https://mullvad.net/zh-hant/help/tor-and-mullvad-vpn> [↩](#fnref:7 "Jump back to footnote 7 in the text")
