"""mkdocs build hook：給 /games 的 ES module 加上內容雜湊版本號（?v=<hash>）。

目的：部署時瀏覽器若把新舊 .js 混搭（例如新的 main.js 配到還在快取的舊 content.js），
會出現「does not provide an export named ...」而整個遊戲載入失敗。為所有相對 import 與
入口 <script> 加上同一個版本參數後，任何模組一改，整組 URL 一起換，快取自然失效、不再混搭。

- 版本號由 docs/games 原始檔內容算出（與不相關的文件變動無關，games 沒改就不會強迫重抓）。
- 只改相對路徑（./x.js）；CDN 的 three / three/addons/ 為 bare specifier，不受影響。
- 改寫具冪等性：已帶 ?v= 的不會被重複加。
"""
import hashlib
import pathlib
import re

GAMES = "games"
# 參與快取破壞的本地模組（固定順序，雜湊才穩定）
MODULES = ["audio.js", "battle.js", "battles.js", "content.js", "main.js", "terrain.js"]


IMG_EXT = (".png", ".jpg", ".jpeg", ".webp")


def _version(src_games: pathlib.Path) -> str:
    h = hashlib.sha1()
    for name in MODULES:
        p = src_games / name
        if p.exists():
            h.update(name.encode("utf-8"))
            h.update(p.read_bytes())
    # 影像（含 tex/ 子目錄）一併納入雜湊：改貼圖/圖檔也會更新版本
    for p in sorted(src_games.rglob("*")):
        if p.is_file() and p.suffix.lower() in IMG_EXT:
            h.update(str(p.relative_to(src_games)).encode("utf-8"))
            h.update(p.read_bytes())
    return h.hexdigest()[:8]


def on_post_build(config, **kwargs):
    site_games = pathlib.Path(config["site_dir"]) / GAMES
    src_games = pathlib.Path(config["docs_dir"]) / GAMES
    if not site_games.is_dir() or not src_games.is_dir():
        return
    v = _version(src_games)
    names = "|".join(re.escape(m) for m in MODULES)
    # from './x.js'  或  import('./x.js')；後面緊接同一個引號才算（已帶 ?v= 不會匹配 → 冪等）
    imp = re.compile(r"(from\s+|import\(\s*)(['\"])\./(" + names + r")\2")

    def _imp_sub(m):
        return f"{m.group(1)}{m.group(2)}./{m.group(3)}?v={v}{m.group(2)}"

    # JS 內的圖檔字串：'./x.png' / "./tex/x.webp" 等 → 加 ?v=（已帶 ?v= 不會匹配 → 冪等）
    img = re.compile(r"""(['"])(\./[^'"]*\.(?:png|jpe?g|webp))\1""")

    def _img_sub(m):
        return f"{m.group(1)}{m.group(2)}?v={v}{m.group(1)}"

    for name in MODULES:
        p = site_games / name
        if not p.exists():
            continue
        txt = p.read_text(encoding="utf-8")
        new = img.sub(_img_sub, imp.sub(_imp_sub, txt))
        if new != txt:
            p.write_text(new, encoding="utf-8")

    idx = site_games / "index.html"
    if idx.exists():
        html = idx.read_text(encoding="utf-8")
        new = re.sub(r'(<script[^>]*\bsrc=")\./main\.js(")',
                     lambda m: f'{m.group(1)}./main.js?v={v}{m.group(2)}', html)
        if new != html:
            idx.write_text(new, encoding="utf-8")
