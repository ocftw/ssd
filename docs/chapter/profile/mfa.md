---
title: 多重驗證
---

# 多重驗證

<small>預計操作時間：約 15–30 分鐘（依帳號數量而定）</small><br><small>所需預算：無（使用驗證 App 或備份碼皆免費）</small>

多重驗證（2FA/MFA）是在輸入密碼之後，再多一層驗證才能登入的機制。就像是線上刷信用卡時，需要多用手機簡訊接收一組認證碼一樣。即使別人取得你的密碼，沒有第二關（例如你手機上的驗證碼或實體金鑰）就無法登入，能降低帳號被盜用的風險。

!!! benefit "可以增強的防護力"

    - 密碼外洩時，他人仍無法僅靠密碼登入你的帳號
    - 降低釣魚或假網站騙走帳號密碼的風險
    
## 開始雙重驗證
建議在常用且重要的帳號（如 Email、密碼管理器、雲端服務）都開啟多重驗證。各服務的選單名稱可能為「兩步驟驗證」「雙重驗證」「2FA」「MFA」等，請在帳戶或安全性設定中尋找類似選項。設定方式可能因服務改版而不同，請以實際畫面為準。

- **LINE**：<br>可於「設定圖示」＞「我的帳號」裡，開啟「網頁登入雙重認證」的選項。
- **Gmail**：<br>開啟Google 帳戶，於「安全性與登入」>「登入Google 的方式」，選取「開啟兩步驟驗證」。
- **臉書 / Instagram**：<br> 「設定」>「帳號管理中心」>「密碼和帳號安全」>「雙重驗證」啟用

## 使用驗證應用程式（Authenticator App）
有些服務除了可以使用 email、簡訊做雙重認證，也可以使用驗證 App，產生「一次性驗證碼」，在登入時除了輸入密碼，再輸入 App 上顯示的六碼數字。

以下為我們**主推**的兩款驗證 App，門檻低、好上手。若有需要，[2FAS](https://2fas.com/){target="_blank"}、[Ente Auth](https://ente.com/auth){target="_blank"} 等開源跨平台工具也是不錯的延伸選項，可多探索。

=== "Google Authenticator"

    免費、操作簡單，適合多數人使用，跨 iOS、Android 皆可用。

    - 到應用商店下載並安裝 Google Authenticator（[Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2){target="_blank"}、[iOS](https://apps.apple.com/tw/app/google-authenticator/id388497605){target="_blank"}）。
    - 登入要啟用多重驗證的服務，在安全設定中選擇「使用 Google Authenticator」或「驗證應用程式」，用手機掃描服務提供的 QR Code（或手動輸入金鑰），即完成設定。
    - 之後登入該服務時，在密碼後輸入 App 上顯示的六碼即可。

=== "Aegis Authenticator（Android）"

    Android 平台的開源選擇，可加密匯出備份，比較不怕換手機時遺失驗證碼。

    - 到 Google Play 下載 [Aegis Authenticator](https://play.google.com/store/apps/details?id=com.beemdevelopment.aegis){target="_blank"}，或從 [Aegis 官網](https://getaegis.app/){target="_blank"} 取得 APK。
    - 第一次開啟時，請設定主密碼或生物辨識，作為解鎖驗證碼資料庫使用。
    - 登入要啟用多重驗證的服務，在安全設定中選擇「驗證應用程式」，用 Aegis 掃描 QR Code 或手動輸入金鑰即完成設定。
    - 建議在 Aegis 設定中產生**加密匯出檔**，存放在另一個安全位置（例如密碼管理器內附件），萬一手機遺失也能還原。

## 密碼金鑰（Passkey）

Passkey 是一種用裝置（如手機）或安全金鑰取代「密碼＋第二因素」的登入方式，可減少被釣魚或密碼外洩的風險。若服務支援 Passkey，可在該服務的帳戶或安全性設定中選擇「密碼金鑰」或「Passkey」依指示設定。以下為部分服務說明與支援狀況，可依實際介面操作。

- [改用密碼金鑰代替密碼登入 - Google 帳戶說明](https://support.google.com/accounts/answer/13548313?hl=zh-Hant){target="_blank"}
- [使用密碼金鑰 - Microsoft 支援服務](https://support.microsoft.com/zh-tw/account-billing/%E4%BD%BF%E7%94%A8%E5%AF%86%E7%A2%BC%E7%99%BB%E5%85%A5-09a49a86-ca47-406c-8acc-ed0e3c852c6d){target="_blank"}
- [目前有哪些服務支援 Passkeys？ - Passkeys.io](https://www.passkeys.io/who-supports-passkeys){target="_blank"}

## 備份碼

備份碼是「當你無法使用驗證 App 或安全金鑰時」用來登入的一次性密碼。建議在啟用多重驗證後，到同一服務的安全設定中產生並下載備份碼，妥善保存在安全且可取得的地方（例如加密的筆記或離線檔案），不要與他人分享。每次用備份碼登入後該碼即失效；若重新產生備份碼，舊的會失效，請更新你保存的版本。

## 安全金鑰（實體裝置）

若希望用「實體 USB 或 NFC 金鑰」作為第二因素，可搭配使用安全金鑰。購買與使用方式請見「[安全金鑰](security_key.md)」章節。

