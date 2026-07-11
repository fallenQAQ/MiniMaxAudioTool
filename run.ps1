<#
.SYNOPSIS
    MiniMaxAudioTool 一键启动脚本（Windows PowerShell）
.DESCRIPTION
    检查 Node.js 与依赖，启动 Vite 开发服务器。
.NOTES
    因 PowerShell 默认执行策略限制，请使用以下任一方式运行本脚本：
      1) powershell -ExecutionPolicy Bypass -File .\run.ps1
      2) 在已放开执行策略的会话中直接：.\run.ps1
    若不想调整执行策略，可直接运行：npm.cmd run dev
#>

$ErrorActionPreference = 'Stop'

# 1. 检查 Node.js 是否安装
Write-Host '==> 检查 Node.js 环境...' -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host '[错误] 未检测到 Node.js，请先安装 Node.js 18+：https://nodejs.org/' -ForegroundColor Red
    exit 1
}
$nodeVersion = (& node --version)
Write-Host "    Node.js 版本：$nodeVersion" -ForegroundColor Green

# 2. 检查 node_modules 是否存在，不存在则安装依赖
Write-Host '==> 检查项目依赖...' -ForegroundColor Cyan
if (-not (Test-Path -Path '.\node_modules')) {
    Write-Host '    未检测到 node_modules，开始安装依赖...' -ForegroundColor Yellow
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[错误] 依赖安装失败，请检查网络或 npm 配置后重试。' -ForegroundColor Red
        exit 1
    }
    Write-Host '    依赖安装完成。' -ForegroundColor Green
} else {
    Write-Host '    node_modules 已存在，跳过依赖安装。' -ForegroundColor Green
}

# 3. 启动开发服务器
Write-Host '==> 启动 Vite 开发服务器...' -ForegroundColor Cyan
Write-Host '    默认地址：http://localhost:5173 （按 Ctrl+C 停止）' -ForegroundColor DarkGray
& npm.cmd run dev
