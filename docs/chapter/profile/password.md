---
title: 密碼強度
---

# :material-shield-key: 密碼強度

在資訊安全中，密碼強度是指密碼抗破解能力的高低。強密碼能有效防止未經授權的使用者進入系統，降低保護資料被盜取或篡改的風險。這一章節將介紹**密碼（password）**和**密碼短語（密碼片語、助記詞，passphrase）**的重要性及如何選擇強密碼。

## 密碼 Password

### 密碼的長度與複雜度

- **長度**：一般建議密碼應至少有 12 個字符。長度越長，越難以通過暴力破解攻擊（brute force attack）破解。
- **字符組合**：應包含大小寫字母、數字及特殊符號（如`!@#$`等）。例如：`H6!pS3@z09`。

### 避免常見模式

- 不要使用常見詞彙或模式，如 `123456`、`password`、`qwerty`。
- 避免使用個人相關資訊，如姓名、生日、電話號碼等。

!!! note "經常更新密碼"

    - 最好定期更換密碼，如每三到六個月。
    - 確保不同帳戶使用不同的密碼，這樣即使一個帳號被破解，其他帳號仍然安全。
        - 請搭配「[密碼管理器](./password_manager.md)」來達成此建議。

## 密碼短語 Passphrase

密碼短語是一組隨機的單詞組合，相較於傳統密碼更長且更容易記憶。例如：`Sunlight!Dances@Midnight`、`Rewrite8-Neuter-Showoff-Backboned-Surviving`。

### 密碼短語的優點

- **長度**：密碼短語通常會比一般密碼更長，使破解時間成倍增加。
- **記憶容易**：對於人腦而言，記住一串相關或有意義的詞語比記住一長串隨機字符容易。

### 選擇強密碼短語

- 包含多個無關的單詞，避免常見語法或詞組。
- 可以結合特殊符號或數字，如：`Cats&Mountains4Ever!`。

!!! tip "養成良好習慣"

    - 使用密碼管理器，工具能幫助記住複雜且唯一的密碼，並能自動完成填寫密碼。
    - 使用 2FA / MFA 認證機制，提高安全性。
    - 避免在公共場所輸入密碼，如咖啡店、圖書館。
    - 不在不同網站重複使用同一組密碼。

!!! note "密碼策略：密碼與密碼短語差異"

    ![https://xkcd.com/936/](https://imgs.xkcd.com/comics/password_strength_2x.png){ loading=lazy }

    - 密碼：亂數密碼對於電腦運算來說非常容易，但是對於人類很難記憶。
    - 密碼短語：反而對於電腦運算非常困難，一段句子短語對人來來說很好記憶。
    - 圖片來源：[xkcd: Password Strength - https://xkcd.com/936/](https://xkcd.com/936/)

!!! info "2024 年破解密碼的時間"

    ![Are Your Passwords in the Green?](https://images.squarespace-cdn.com/content/v1/5ffe234606e5ec7bfc57a7a3/c8c21f1a-ac0a-4dd5-97bf-51a2e4fa63e4/Hive+Systems+Password+Table+-+2024+Square.png){ loading=lazy }

    - 參考資料：[Are Your Passwords in the Green? - Hive Systems](https://www.hivesystems.com/blog/are-your-passwords-in-the-green)
