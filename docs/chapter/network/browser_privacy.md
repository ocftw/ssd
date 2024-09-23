---
title: 隱私瀏覽行為
---

# :simple-googlechrome: 隱私瀏覽行為

## 瀏覽器選擇

瀏覽器已是我們每日探索世界、瞭解新知時所使用到的第一個工具，我們也需要透過瀏覽器來使用雲端服務來完成日常工作，因此瀏覽器有著無比重要的存在，也是駭客常常鎖定攻擊我們的重要途徑之一。

以下是一些主要的隱私瀏覽器，以及它們的特色比較：

### :simple-firefoxbrowser: Firefox

{++:first_place: 擴充彈性最高++}

- **隱私保護級別**：高。Firefox 預設啟用了「[加強型追蹤保護功能]」，可以阻擋廣告追踪和第三方 Cookie。
- **附加元件與擴充功能**：Firefox 支持多種隱私保護附加元件（如 uBlock Origin、Privacy Badger 等），用戶可以根據需要進一步加強隱私保護。
- **透明及開放源碼**：作為一個開放源碼的瀏覽器，社群和安全專家可以檢查和審核其源碼，確保沒有惡意或隱私侵害的功能。
- **隱身模式**：提供標準的隱身模式，不保存瀏覽歷史、 Cookie 和搜尋紀錄。

[加強型追蹤保護功能]: https://support.mozilla.org/zh-TW/kb/enhanced-tracking-protection-firefox-desktop

### :simple-brave: Brave

{++:first_place: 綜合平衡（隱私與性能）++}

- **內建廣告阻擋**：自帶廣告阻擋功能，防止追踪並提高頁面加載速度。
- **隱私保護級別**：非常高。Brave 專注於隱私保護和去中心化技術，避免第三方追踪。
- **Tor 整合**：內建能夠使用 Tor 網路的隱私視窗，進一步提升匿名性。
- **IPFS 星際檔案**：整合 [IPFS]（[星際檔案系統]），提供去中心化的檔案分享與存取，提升網路安全性與資料持久性。

[IPFS]: https://ipfs.tech/
[星際檔案系統]: https://zh.wikipedia.org/zh-tw/%E6%98%9F%E9%99%85%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F

### :simple-torbrowser: Tor 瀏覽器

{++:first_place: 最強隱私保護++}

- **匿名瀏覽**：通過 Tor 網路將您的流量經過多個 :simple-torproject: 洋蔥網路中繼點（Relay）進行加密，極大提高了匿名性和隱私保護。
- **預設隱私保護**：完全專注於隱私保護的設置，預設阻擋追蹤及腳本。
- **進階隱私需求**：適合高隱私需求的用戶（如記者、研究人員等），但可能會降低瀏覽速度。

## 隱私保護附加元件

瀏覽器附加元件（Browser Extensions），這些附加元件可以防止網站和第三方追踪使用者的瀏覽行為，從而保護個人資料隱私。此外有效的廣告阻擋工具不僅能提升網頁瀏覽速度，還能減少惡意廣告軟體的風險。

!!! note ""

    :simple-brave: Breve 與 :simple-googlechrome: Chrome 是同一架構的瀏覽器，可以直接取用 :simple-googlechrome: Chrome 的附加元件使用。

### uBlock Origin

這是一款高效的廣告阻擋器，可以阻止惡意網頁、釣魚網站和跟踪器。

[:simple-googlechrome: Chrome](https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm) | [:simple-firefoxbrowser: Firefox](https://addons.mozilla.org/zh-TW/firefox/addon/ublock-origin/)

### Privacy Badger

由電子前哨基金會（EFF）開發，它可自動學習並阻止跟踪機制，以保護您的隱私。

[:simple-googlechrome: Chrome](https://chromewebstore.google.com/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp) | [:simple-firefoxbrowser: Firefox](https://addons.mozilla.org/zh-TW/firefox/addon/privacy-badger17/)

### Cookie AutoDelete

自動刪除不必要的 Cookie，只有您信任且在白名單中的網站才能保存 Cookie，有效保護隱私。

[:simple-googlechrome: Chrome](https://chromewebstore.google.com/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh) | [:simple-firefoxbrowser: Firefox](https://addons.mozilla.org/zh-TW/firefox/addon/cookie-autodelete/)

### ClearURLs

此附加元件功能將自動移除網址中的追蹤元素，以幫助保護您在瀏覽網路時的隱私。

[:simple-googlechrome: Chrome](https://chromewebstore.google.com/detail/clearurls/lckanjgmijmafbedllaakclkaicjfmnk) | [:simple-firefoxbrowser: Firefox](https://addons.mozilla.org/zh-TW/firefox/addon/clearurls/)

## 瀏覽模式

### 一般瀏覽器

如 :simple-brave: Brave、:simple-googlechrome: Chrome、:simple-firefoxbrowser: Firefox、:simple-safari: Safari 的 :material-incognito: 無痕瀏覽（Incognito Mode）或隱私瀏覽模式（Private Browsing）目的是提高用戶的隱私性。

#### 主要特點和其限制

1. **本地歷史不保存**：瀏覽器不會記錄您的瀏覽歷史、下載記錄、Cookies 和網站資料。
2. **暫時性資料清理**：在無痕瀏覽模式中，您所訪問的網站數據資料和表單填寫的資訊會在關閉窗口後自動清除。
3. **分離瀏覽階段（Session）**：每次開啟無痕瀏覽模式都是一個新的瀏覽階段，與一般模式互不影響。

#### 不足與限制

1. **不匿名**：{==無痕瀏覽模式並不是匿名模式==}。您的網路行為仍可被網路服務供應商（ISP）、公司網路管理員、網站及追蹤器監視。
2. **未加密**：無痕瀏覽模式不會加密您的網路流量，因此仍易受網路攻擊，例如中間人攻擊（Man-in-the-Middle Attack）。
3. **附加元件**：某些瀏覽器附加元件或插件可能仍能辨識和記錄您的活動。
4. **下載文件**：通過無痕瀏覽模式下載的文件仍會保留在您的電腦上，它不會自動刪除已下載的內容。
5. **帳戶登錄**：{==如果您在無痕模式下登錄您的帳戶，該網站仍然可以記錄您的活動，只是不會保存在本地瀏覽器的歷史記錄中。==}
6. **惡意軟件防護**：無痕模式並不能保護您免受惡意軟件攻擊或釣魚詐騙。

### Tor 瀏覽器

當使用 Tor 瀏覽器作為隱私瀏覽模式時，使用者的網路流量會經過多層次的加密，並通過一系列全球志工運營的中繼點（Relays），使監視、追蹤或篡改使用者的流量變得極為困難。

#### 主要特點和優點

1. **匿名性強**：Tor 隨機選擇多個中繼點，使得追蹤數據來源非常困難。
2. **防止流量分析**：Tor 可以防止第三方觀察您正在訪問哪些網站，即使他們可以查看您的網路流量。
3. **穿透審查**：能夠繞過某些國家或網路管理者的網路封鎖和審查措施。

#### 不足和限制

1. **速度較慢**：由於數據封包資料需要通過多個中繼點，網路速度通常會比一般瀏覽器慢。
2. **有限的隱私**：Tor 無法完全隱藏使用者的身份，尤其是在使用不安全的網站或者安裝了非官方插件的情況下。
3. **不適用於所有用途**：例如，使用 Tor 進行大型文件下載或串流媒體服務可能不那麼實用，而且網站可能會禁止來自 Tor 節點的訪問。
4. **法律風險**：在部分國家或地區，使用 Tor 可能會引起法律問題，甚至遭遇政府監控。

#### 適用情境

- **保護個人隱私**：例如，記者與信息來源保持聯繫時可避免被追蹤。
- **繞過審查**：在言論受限的國家，使用者可藉此訪問被封鎖的網站。
- **隱藏 IP 地址**：對於一些對 IP 地址限制機敏的活動，使用者可以利用 Tor 隱藏真實 IP。

## 搜尋引擎

這些搜尋引擎都能夠在不同程度上保護使用者的隱私並提供良好的搜尋體驗，公民團體可以根據實際需要選擇最適合的搜尋引擎，尤其對於公民團體來說，使用注重隱私的搜尋引擎可以有效保護成員的個人資料及搜尋活動。除了使用隱私友善的搜尋引擎，也可結合其他安全措施，如使用加密通訊工具和維護良好的數位使用習慣。

1. **DuckDuckGo**
      - **特點**：DuckDuckGo 不儲存任何可識別用戶身份的資料，不追蹤你的搜尋歷史，而且使用加密技術來保護搜尋查詢。
      - **優勢**：簡單易用，適合大部分用戶，是注重隱私搜尋的首選之一。
      - :octicons-arrow-right-16: <https://duckduckgo.com/>

2. **Startpage**
      - **特點**：Startpage 使用 Google 的搜尋結果，但不儲存任何個人資料或搜尋歷史。它還會隱藏使用者的IP地址，提供匿名的搜尋體驗。
      - **優勢**：提供高質量的搜尋結果，同時確保用戶的隱私不被泄露。
      - :octicons-arrow-right-16: <https://www.startpage.com/>

3. **Qwant**
      - **特點**：Qwant 是一家總部位於歐洲的隱私友好型搜尋引擎，不會追蹤用戶或個人化搜尋結果。
      - **優勢**：符合歐盟的隱私法律，是值得信賴的搜尋工具。
      - :octicons-arrow-right-16: <https://www.qwant.com/> （目前臺灣、日本、新加坡無法使用）

4. **Searx**
      - **特點**：Searx 是一個開源的隱私搜尋引擎，允許用戶自己設置並管理其服務，避免集中式搜尋引擎的資料收集問題。
      - **優勢**：高度可配置，適合技術能力較強的用戶或需要自主持續引擎的團體。
      - :octicons-arrow-right-16: <https://searx.thegpm.org/>

5. **Brave Search**
      - **特點**：Brave Search 是由 Brave 瀏覽器團隊開發的，強調隱私和去中心化，不會追蹤用戶的搜尋歷史。
      - **優勢**：無廣告追蹤，提供自主生成的搜尋結果。
      - :octicons-arrow-right-16: <https://search.brave.com/>

!!! tip "調整預設瀏覽器"

      - 可在瀏覽器設定將以上推薦的瀏覽器設定為預設搜尋項目來使用。

## 定期更新

瀏覽器現在都會在背景中自動更新到最新版本，但是某些情況下是需要{==重新啟動瀏覽器==}才算是完整安裝到最新版本。當瀏覽器提醒需要重新啟動時，請儘快完成，避免暴露在危險的網路環境中。
