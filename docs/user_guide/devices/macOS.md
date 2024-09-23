---
title: MacOS
---

# :material-apple-finder: MacOS

當今的數位時代，資訊安全對於每一個公民團體來說都是至關重要的，而 MacOS 作為 Apple 開發的作業系統，以其安全性和穩定性而聞名。然而，即便在強大的 MacOS 環境下，我們仍需要採取積極的安全措施來保護機敏資料。這一章節將提供一系列有關 MacOS 資訊安全的操作設定與建議。

## 建議的操作設定

### 系統設定

以下設定在「系統設定」頁操作。

#### 藍牙（Bluetooth）

!!! success ""

    - [ ] **關閉**藍牙連線

藍牙連線在不使用時請關閉。關閉的方式請透過「系統設定」、「藍牙」頁面完全關閉。

#### 網路

!!! success ""

    - [x] **開啟**「限制 IP 位置追蹤」。

依目前連線的模式「Wi-Fi」或「網路」，在已連線的項目後方點擊「**詳細資訊⋯**」，開啟「**限制 IP 位置追蹤**」。

#### 防火牆

!!! success ""

    - [x] **開啟**防火牆
    - [x] **開啟**阻擋所有傳入連線

在「設定」頁面，點擊「網路」、「防火牆」並啟用。在「防火牆」下方的「**選項⋯**」開啟後設定較進階的防護，建議可以啟用「**阻擋所有傳入連線**」。

#### 一般

**修改裝置名稱**：在、「關於」、「名稱」。在預設情況下會揭露登入帳號名稱，建議修改成**通用型名稱**，如：Mac。

**軟體更新**：在「軟體更新」中點擊「自動更新」後方圖示 :octicons-info-16: 開啟詳細設定。以下項目建議開啟：

!!! success ""

    - [x] 檢查更新項目
    - [x] 可用時下載新的更新項目
    - [x] 安裝 macOS 更新項目
    - [x] 從 App Store 安裝應用程式更新項目
    - [x] 安裝安全回應和系統檔案

#### 隱私權與安全性

請逐一確認以下項目設定狀態。

!!! info ""

    - **定位服務**：可以直接關閉定位功能，或是逐一檢視應用程式是否需要「**定位服務**」。
    - **分析與改進功能**：關閉、停用此頁所有的分析項目。
    - **Apple 廣告**：關閉、停用「**個人化廣告**」。
    - **檔案保險箱**：此功能為磁碟加密，開啟後需要登入密碼或復原密碼來讀取資料，因此**請記得提升登入密碼強度**。
    - **封閉模式**：此功能為極端保護模式，建議啟用後評估是否影響日常工作流程。
    - **進階⋯**：在頁面下方的「**進階⋯**」按鈕點開後，啟用「**需要管理者密碼才能取用系統層面的設定**」。

## :warning: 進階的操作設定

!!! warning "閱讀說明"

    以下操作**技術成份較高**，需要有一定的**相關背景認知**比較不會有意料之外、所造成錯誤的風險。如果您想要進一步瞭解，也想要學習與挑戰，在以下內容將伴隨較初階的內容補充，協助您提升高階抵禦技能。

### 隨機產生 MAC 位址

由於 :material-apple-finder: macOS 不像 :material-cellphone-information: iOS 可以針對不同的 Wi-Fi 連線時、各自產生隨機的 MAC 位址，且 :material-apple-finder: macOS 網路介面也沒有提供任何選項使用，因此目前在 :material-apple-finder: macOS 作業系統環境中，每次連線到不同的 Wi-Fi 時，**都會顯示相同的 MAC 位址，因而產生唯一識別、容易造成有心人士的追蹤與鎖定**。

??? question "什麼是「MAC 位址（MAC Address）」？"

    MAC 位址（Media Access Control Address）是一個網路硬體設備的唯一識別碼，用來標識網路介面卡（NIC）。每個網路設備的 MAC 位址都是唯一的，它由製造商在硬體生成時寫入設備中，不會重複。MAC 位址通常由 48 位元（6 個字節）組成，以十六進位表示，並以冒號或連字號分隔，如「00:1A:2B:3C:4D:5E」。

在開始設定隨機 MAC 位址時，請先與目前連線的 Wi-Fi 設備斷線，之後開啟「終端機」輸入以下指令。

``` zsh
openssl rand -hex 6 | sed 's/^\(.\{1\}\)./\12/; s/\(..\)/\1:/g; s/.$//' | xargs sudo ifconfig en0 ether
```

無任何的錯誤訊息顯示代表設定成功。可透過 `ifconfig en0` 查詢新的 MAC 位址。（或是在執行指令前先 `ifconfig en0` 取得舊的 MAC 位址來比較其更新的差異。）

**每次重開機後，MAC 位址都會恢復的原始的設定，請記得再次執行以上的指令**，或頻繁且刻意的更新 MAC 位址。

??? question "如何開啟「終端機」？"

    - [在 Mac 上打開或結束「終端機」 - Apple 支援](https://support.apple.com/zh-tw/guide/terminal/apd5265185d-f365-44cb-8b09-71a064a42125/mac)

## 參考資料

- [Apple 平台安全性 - Apple 支援](https://support.apple.com/zh-tw/guide/security/welcome/web)
- [macOS Overview - Privacy Guides](https://www.privacyguides.org/en/os/macos-overview/)
- [Protect your MacOS device - security in-a-box](https://securityinabox.org/en/phones-and-computers/mac/)
