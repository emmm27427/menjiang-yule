#!/bin/bash
# 门将娱乐 - PWA 启动脚本
# 用法: bash start.sh  [端口号]
PORT="${1:-8080}"
cd "$(dirname "$0")"

echo "=============================="
echo "  门将娱乐 - PWA 启动"
echo "=============================="
echo ""

# 尝试 Python 3
if command -v python3 &> /dev/null; then
  echo "服务地址: http://localhost:$PORT/tcg-assistant.html"
  echo "按 Ctrl+C 停止"
  echo ""
  python3 -m http.server "$PORT"
# 尝试 Python 2
elif command -v python &> /dev/null; then
  echo "服务地址: http://localhost:$PORT/tcg-assistant.html"
  echo "按 Ctrl+C 停止"
  echo ""
  python -m SimpleHTTPServer "$PORT"
# 尝试 Node.js
elif command -v npx &> /dev/null; then
  echo "服务地址: http://localhost:$PORT/tcg-assistant.html"
  echo "按 Ctrl+C 停止"
  echo ""
  npx serve -l "$PORT" .
else
  echo "错误: 未找到 Python 或 Node.js 环境"
  echo "请安装 Python 3: https://python.org"
  echo "或安装 Node.js: https://nodejs.org"
  exit 1
fi
