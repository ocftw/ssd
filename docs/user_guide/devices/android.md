---
title: Android
---

# :simple-android: Android

Android 系統是由 Google 開發的一個開源行動操作系統，主要用於智慧手機和平板電腦。Android 系統基於 Linux 核心，並設計支援觸控螢幕，提供使用者友好的介面和各種應用程式（App）。該系統經常由不同的製造商定制，以包含各自的使用者界面和應用程式，但核心功能基本一致。

Android 系統普及，開發者可以透過 Google Play 商店或其他平台發佈應用程式。由於其開源的特性，Android 提供廣泛的自訂和開發可能性，但也因此需要在資訊安全上特別注意，以保護個人和組織的資料安全。

## 建議的操作設定

### 更新到最新版本

如同其他作業系統的建議，請檢查使用裝置是否更新到最新的作業系統版本，如果您的裝置已經無法更新到最新的作業系統，建議請汰換到較近生產的裝置。

??? question "如何查看版本"

    - [檢查及更新 Android 版本 - Android 說明](https://support.google.com/android/answer/7680439)

??? tip "Android 支援列表"

    - [Android 版本列表 - 維基百科，自由的百科全書](https://zh.wikipedia.org/wiki/Android%E7%89%88%E6%9C%AC%E5%88%97%E8%A1%A8)

### 受信任的來源下載應用程式

建議在受信任的來源下載 Android 應用程式的原因有以下幾點：

1. **防止惡意軟體**：從受信任的應用商店（如 Google Play 商店）下載應用程式，可以減少下載到惡意軟體的風險。這些應用商店有專門的安全措施和審核機制，可以過濾掉帶有惡意代碼的應用程式。（即使還是有可能下載到惡意程式，但應用商店能遠端移除有問題的應用程式。）
2. **應用程式安全性更新**：受信任的來源通常會定期推送安全性更新和軟體修補，修正已知漏洞，確保應用程式的安全性。如果從不受信任的來源下載，可能無法獲得及時更新，留下資安隱患。
3. **維護隱私和數據安全**：受信任的應用商店對應用程式的隱私政策和資料使用進行監控，確保應用程式不會非法收集或濫用用戶的個人信息。在不受信任的來源下載，可能會遭遇到隱私泄露和數據濫用的風險。
4. **減少兼容性問題**：受信任的應用商店中的應用程式通常經過多方面的測試，保障與不同 Android 裝置的兼容性，從而減少安裝和使用過程中的問題。

!!! success "檢查安全防護"

    - [使用 Google Play 安全防護檢查應用程式和裝置是否出現有害行為。](https://support.google.com/accounts/answer/2812853)

### 應用程式權限

請逐一檢視給予應用程式相關的權限，以下列舉的權限請斟酌應用程式是否必要取得此項目的權限。

??? success "需確認的權限"

    - 位置
    - 聯絡人
    - 簡訊
    - 麥克風
    - 語音或語音識別
    - （網路）攝影機
    - 螢幕錄製
    - 通話記錄或通話歷史
    - 電話
    - 日曆
    - 電子郵件
    - 圖片
    - 電影或影片及其資料庫
    - 指紋識別器
    - 近距離無線通訊（NFC）
    - 藍牙
    - 任何包含「磁碟存取」、「檔案」、「文件夾」或「系統」的設定
    - 任何包含「安裝」的設定
    - 人臉識別
    - 允許下載其他應用程式

!!! question "變更應用程式權限"

    - 如何變更權限，請參考「[在 Android 手機上變更應用程式權限](https://support.google.com/android/answer/9431959?hl=zh-Hant)」。

### 移除無用的應用程式

逐一檢視少用與無用的應用程式，如何操作可以參考「[刪除、停用及管理 Android 上未使用的應用程式](https://support.google.com/googleplay/topic/13627086?hl=zh-Hant)」。

### 定位資訊

關閉定位資訊與移除歷史定位資訊，請衡量安全性與便利性，建議在處理到工作事務使用嚴格的設定。如何調整可以參考說明：

- [管理 Android 裝置的位置資訊設定](https://support.google.com/android/answer/3467281)
- [管理定位記錄](https://support.google.com/android/answer/3118687)

### 帳號管理

確認帳號權限目前屬於管理者的角色只有您才可以登入、一般權限的使用者不能過度授權存取。並養成習慣平時使用**一般授權帳號**操作，只有在需要管理者權限時變更系統設定時**才切換為管理者**。

!!! question "變更使用者"

    - 如何[刪除、切換或新增使用者](https://support.google.com/android/answer/2865483)

### 螢幕鎖定

設定螢幕閒置時間後、進行螢幕鎖定，建議使用「**密碼**」類型設定，避免使用容易遭窺視的「**解鎖圖案**」。

!!! question "設定螢幕鎖定"

    - 如何[在 Android 裝置上設定螢幕鎖定功能](https://support.google.com/android/answer/9079129)

### 語音控制

關閉 Google 助理語音控制，請逐步檢查設定：

!!! success "關閉語音控制"

    1. 開啟 Google 應用程式
    2. 點擊你的頭像
    3. 點擊設定
    4. 點擊 Google 語音助理
    5. 點擊一般
    6. 關閉 Google 語音助理

    :material-account-question: 其他關於語音助理的設定調整，請參考「[透過語音指令使用 Google 助理](https://support.google.com/assistant/answer/7394306?hl=zh-Hant)」。

## 參考資料

- [Android Security and Update Bulletins  |  Android Open Source Project](https://source.android.com/docs/security/bulletin)
