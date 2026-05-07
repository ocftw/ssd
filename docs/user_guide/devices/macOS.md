---
title: MacOS 裝置
---

# MacOS 裝置

<small>預計操作時間：約 25–35 分鐘</small><br><small>所需預算：無（基本設定皆免費）</small>

若您用 Mac 處理工作或敏感資料，先把系統設定做好，就像出門前把裝備帶好，能顯著提升防護力。以下設定皆在「系統設定」中完成（點選左上角蘋果選單 > 系統設定），不需花錢，約半小時即可完成。

!!! benefit "可以增強的防護力"

    - 降低不明裝置透過藍牙或網路連上電腦的風險
    - 減少 IP 與追蹤暴露、保護隱私
    - 以防火牆與隱私設定為資料把關
    - 維持系統更新，修補已知漏洞

## 藍牙

不使用時建議關閉藍牙，可避免他人透過藍牙連上你的電腦；需要時再從選單列開啟即可。

1. 進入「系統設定」>「藍牙」，選擇「關閉」。
2. 使用時可點選選單列（畫面左上）的藍牙圖示快速開啟或關閉。

設定方式可能因 macOS 版本不同而有所差異，更多說明可參考[官方「Bluetooth 無線技術功能」](https://support.apple.com/zh-tw/HT3039){target="_blank"}。

## 網路（限制 IP 位置追蹤） {#network-ip-tracking}

開啟「限制 IP 位置追蹤」可讓「郵件」與 Safari 針對已知追蹤器隱藏電腦的 IP，降低被追蹤的風險。

1. 依目前連線方式進入「系統設定」>「Wi-Fi」或「系統設定」>「網路」。
2. 點選目前連線右側的「詳細資訊⋯」，在頁面中找到「限制 IP 位置追蹤」並開啟。

設定方式可能因 macOS 版本不同而有所差異，更多說明可參考[官方「在 Mac 上更改「隱私權與安全性」設定」](https://support.apple.com/zh-tw/guide/mac-help/mchl211c911f/mac){target="_blank"}或[「更改網路服務設定」](https://support.apple.com/zh-tw/guide/mac-help/mchlp1523/mac){target="_blank"}。

## 防火牆 {#firewall}

建議開啟內建防火牆，並啟用「阻擋所有傳入連線」，以降低不明連線與攻擊的風險。

1. 進入「系統設定」>「網路」>「防火牆」，開啟「防火牆」。
2. 點選「選項⋯」，開啟「阻擋所有傳入連線」。

設定方式可能因 macOS 版本不同而有所差異，更多說明可參考[官方「使用防火牆阻擋 Mac 的連線」](https://support.apple.com/zh-tw/guide/mac-help/mh34041/mac){target="_blank"}。

## 一般（裝置名稱與軟體更新） {#general}

建議修改裝置名稱，避免包含個人資料（例如姓名）；預設名稱通常會直接使用登入帳號名稱，改為不含個人資訊的名稱（例如「Mac」）可避免暴露身份。並開啟自動更新，讓系統與安全回應維持在最新狀態。設定方式可能因 macOS 版本不同而有所差異，更多說明可參考[官方「更新 Mac 上的 macOS」](https://support.apple.com/zh-tw/108382){target="_blank"}。

1. **修改裝置名稱**：<br>
  進入「系統設定」>「一般」>「關於」>「名稱」，改為不包含個人資訊的名稱。
2. **軟體更新**：<br>
  進入「系統設定」>「一般」>「軟體更新」，點「自動更新」右側的 :material-information-outline: 開啟詳細設定，建議勾選：
    - 檢查更新項目
    - 可用時下載新的更新項目
    - 安裝 macOS 更新項目
    - 從 App Store 安裝應用程式更新項目
    - 安裝安全回應和系統檔案


## 隱私權與安全性 {#privacy}

透過系統設定可為密碼、位置、分析與廣告等把關，降低資料外洩風險。建議在「系統設定」>「隱私權與安全性」中逐一確認以下項目，設定方式可能因 macOS 版本不同而有所差異，更多說明可參考[官方「在 Mac 上更改「隱私權與安全性」設定」](https://support.apple.com/zh-tw/guide/mac-help/mchl211c911f/mac){target="_blank"}。

- **定位服務**：<br>
  建議統一關閉，或逐一檢視 App 是否真的需要「定位服務」。
- **分析與改進功能**：<br>
  關閉此頁所有分析項目。
- **Apple 廣告**：<br>
  關閉「個人化廣告」。
- **檔案保險箱**：<br>
  建議開啟，這代表會幫你的電腦磁碟加密，需要登入或復原密碼才能讀取資料。
- **進階⋯**：<br>
  點頁面下方「進階⋯」，啟用「需要管理者密碼才能取用系統層面的設定」。
- **封閉模式**：<br>
  封閉模式是針對高風險人士（例如記者、人權工作者、行動人士）設計的高防護機制，用於對抗國家級間諜軟體（如 Pegasus）的針對性攻擊。開啟後，Mac 會限制部分功能以縮小攻擊面，包括停用 Safari 中的部分網頁技術、要求裝置在解鎖狀態才能接受有線連線，以及限制 FaceTime 與共享照片等功能。部分 App 的功能可能因此受限，建議依自身風險評估後再決定是否開啟。<br>
  進入「系統設定」>「隱私權與安全性」> 找到「封閉模式」> 點選「開啟」> 依畫面指示重新啟動 Mac。更多說明可參考[「封閉模式」](https://support.apple.com/zh-tw/105120){target="_blank"}。


## 完成後做健檢

設定完成後，建議每半年回頭檢視本章各項設定是否仍有效、是否被系統更新改寫。

## 參考資料

- [Apple 平台安全性 - Apple 支援](https://support.apple.com/zh-tw/guide/security/welcome/web){target="_blank"}
- [macOS Overview - Privacy Guides](https://www.privacyguides.org/en/os/macos-overview/){target="_blank"}
- [Protect your MacOS device - security in-a-box](https://securityinabox.org/en/phones-and-computers/mac/){target="_blank"}
