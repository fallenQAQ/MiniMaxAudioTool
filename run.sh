#!/usr/bin/env bash
# MiniMaxAudioTool 一键启动脚本（Linux / macOS）
# 用法：bash run.sh  （首次可能需赋权：chmod +x run.sh && ./run.sh）
set -e

echo "==> 检查 Node.js 环境..."
if ! command -v node >/dev/null 2>&1; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+：https://nodejs.org/"
    exit 1
fi
echo "    Node.js 版本：$(node --version)"

echo "==> 检查项目依赖..."
if [ ! -d "./node_modules" ]; then
    echo "    未检测到 node_modules，开始安装依赖..."
    npm install
    echo "    依赖安装完成。"
else
    echo "    node_modules 已存在，跳过依赖安装。"
fi

echo "==> 启动 Vite 开发服务器..."
echo "    默认地址：http://localhost:5173 （按 Ctrl+C 停止）"
npm run dev
