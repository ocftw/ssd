#!/usr/bin/env python3
"""開發用本機伺服器：強制「不快取」，避免瀏覽器（尤其 iOS Safari）拿到舊的 js/css。

用法：
    cd docs/games
    python3 serve.py            # 預設 http://0.0.0.0:8000
    python3 serve.py 8080       # 指定埠號

手機測試：同網路下用「電腦區網 IP:埠號」開啟即可（例如 http://192.168.0.10:8000）。
"""
import sys
import http.server
import socketserver


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), NoCacheHandler) as httpd:
        print(f"資安防護新手村 · 開發伺服器（不快取）→ http://0.0.0.0:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nbye")


if __name__ == "__main__":
    main()
