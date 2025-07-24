---
icon: octicons/git-pull-request-16
title: 如何貢獻
---

# :octicons-git-pull-request-24: 如何貢獻

教材網站內容主要面向在臺灣的公民團體與其組織內日常情境，資安事件與手法隨時間不斷的演進，因此教材也需要與時俱進的迭代、更新。如果您對與我們目前所提供的內容、面向、議題方面，覺得還可以有增補與修正的空間，歡迎透過以下的流程協助我們！

## 教材架構

教材的編排架構為每一**課程主題**搭配介紹內容、**操作建議**與**政策規範**。

| 標題         | 說明                                         |
| ------------ | -------------------------------------------- |
| **課程主題** | 目前歸納收錄常見的八種主題分類。             |
| **操作建議** | 針對主題需要請使用者實際調整、操作指引說明。 |
| **政策規範** | 針對主題對於組織內可以制定相對應的政策內容。 |

**政策規範**之下包含**政策規範內文**範本、**安全建議執行**與**檢查表**。

| 標題             | 說明                                                     |
| ---------------- | -------------------------------------------------------- |
| **政策內文**     | 條列式針對該主題可參考引用的政策內文。                   |
| **安全建議執行** | 給予組織成員如何執行的引導，類似「執行細則」的制定原則。 |
| **檢查表**       | 給予資安負責人、IT 人員可以依循檢核組織成員完成狀況。    |

## 修正類型

### 錯別字、用語

教材內容編輯以正體中文、臺灣用語的方式撰寫，相關的專有名詞請以臺灣在地的用法使用。但即使在用中文說明的時候，某些情境下還是會用英文的方式單字稱呼（例如：coding、被 block 了），遇到這一類的翻譯問題可以參考**臺灣在地化社群 L10n Taiwan** 的[詞彙對照表](https://hackmd.io/@l10n-tw/glossaries){target="_blank"}。

發現這一類的問題，請直接校正後送出修正。

### 版本更新

在教材中所敘述的操作或流程，可能會因為其後續版本更新而有所差異，如果您發現這一類的問題，請直接送出校正後的修正。如果是圖片、畫面截圖也包含在需要協助修正的範圍中。

### 增補主題

教材內容主要以公民團體日常工作內容為情境，歸納為八個主題分類，不論您對於既有的章節內容提出修正、增補，或是提出建立新的主題（例如：AI 應用、軟體服務選用 ... 等），請依以下流程提出：

1. 請至 Github 上的專案建立 [Issue](https://github.com/ocftw/ssd/issues/new/choose){target="_blank"}。
2. 選擇「**新增主題建議**」。
3. 透過表單中的文字完成所需要填寫、說明的欄位內容。
4. 送出建議。
5. 等候團隊給予回覆。

### 學習資源

如果您發現不錯的資源，不論文字、影片，都可以[提供](https://github.com/ocftw/ssd/issues/new/choose){target="_blank"}給我們收錄在此教材網站中。

### 諮詢服務

如果您是提供資安相關的服務，也願意成為此份教材的諮詢團隊之一，也請與[我們聯絡](mailto:ssd@ocf.tw){target="_blank"}，洽談未來可以協助的方式。

## 如何編輯教材文件

教材網站的修正請先 Fork 一份到自己的 Github 專案中，新增專案後，不論是透過建立新的分支或是在 `main` 的分支上進行修改、增補，每一次的提交（`git commit`）請記得附上簽署、署名（`git commit -s`）。

所有的修正、增補完成後，請透過 Pull Requests（PR）的方式提出合併，等待團隊確認無誤後，即將內容合併到教材網站的主要分支中。

!!! info "參考資訊"

    - 如何簽署提交，[請參考 Github 說明](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits){target="_blank"}。
    - 如何建立 Pull Requests（PR），[請參考 Github 說明](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request){target="_blank"}。
        - 或參考「[與其它開發者的互動 - 使用 Pull Request（PR）](https://gitbook.tw/chapters/github/pull-request){target="_blank"}」。

### 透過 Github 線上編輯

如果您不熟悉程式相關的建立或佈署，僅針對教材內容文字的部分編輯，也可透過 Github 上的線上編輯方式進行內容編修、增補。

在欲編輯的[檔案頁面](https://github.com/ocftw/ssd/blob/shield/README.md){target="_blank"}中，上方的編輯列找到 :octicons-pencil-24:，點擊後進入到編輯模式。編輯完成後，右上方 "**Commit changes...**" 送出修改。
