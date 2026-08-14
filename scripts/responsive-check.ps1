<#
.SYNOPSIS
    响应式设计自动化验证脚本（Windows PowerShell）
.DESCRIPTION
    流程：构建（可跳过）→ 注入测试页到 dist → 启动 vite preview →
          headless Edge 执行测试页（375/768/769/1280 四档视口采样断言）→ 输出结果 → 清理。
    退出码：0 = 全部通过；1 = 存在失败用例或运行异常。
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\responsive-check.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\responsive-check.ps1 -SkipBuild
#>
param(
    [int]$Port = 4173,
    [int]$CallbackPort = 4174,
    [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent
$CheckName = 'responsive-check.html'
$EdgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$Edge = $EdgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Edge) { Write-Host '[错误] 未找到 msedge.exe' -ForegroundColor Red; exit 1 }

function Stop-Preview($proc) {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
}

# 1. 构建（保证 dist 为最新）；外部命令的 stderr 警告不应中断脚本
if (-not $SkipBuild) {
    Write-Host '==> 构建生产版本...' -ForegroundColor Cyan
    $ErrorActionPreference = 'Continue'
    & npm.cmd run build *> $null
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($buildExit -ne 0) { Write-Host '[错误] 构建失败' -ForegroundColor Red; exit 1 }
}

# 2. 注入测试页
Copy-Item "$PSScriptRoot\$CheckName" "$Root\dist\$CheckName" -Force

$preview = $null
try {
    # 3. 启动 preview 服务器
    Write-Host "==> 启动 preview (端口 $Port)..." -ForegroundColor Cyan
    $preview = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'preview', '--', '--port', $Port, '--strictPort' -WorkingDirectory $Root -PassThru -WindowStyle Hidden
    $ready = $false
    foreach ($i in 1..30) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-WebRequest "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $ready = $true; break
        } catch { }
    }
    if (-not $ready) { throw 'preview 服务器启动超时' }

    # 4. headless Edge 前台执行测试页：--dump-dom 保证虚拟时间预算耗尽后自动退出，
    #    结果经 DOM（#out 节点的 URL 编码文本）与 console 双通道输出，取其一解析。
    #    注意：必须用管道接收原生程序输出（文件/变量重定向在 PS 5.1 下会丢失）。
    Write-Host '==> 执行响应式测试用例（约 30-60 秒）...' -ForegroundColor Cyan
    $ErrorActionPreference = 'Continue'
    $raw = & $Edge --headless=new --disable-gpu --no-sandbox --enable-logging=stderr `
        --dump-dom --window-size=1400,1000 --virtual-time-budget=120000 `
        "http://localhost:$Port/$CheckName" 2>&1 |
        Select-String -Pattern 'RESULT:' | Select-Object -First 1
    $ErrorActionPreference = 'Stop'
    if (-not $raw) { throw '未捕获到测试输出（RESULT 缺失，页面可能未在预算时间内完成）' }

    # 5. 解析与报告（截断 console 行尾巴 ", source:" 与 DOM 行尾巴 "</pre>"）
    $payload = ($raw.Line -replace '^.*?RESULT:', '') -replace '",\s*source:.*$', '' -replace '</pre>.*$', ''
    $result = ([Uri]::UnescapeDataString($payload)) | ConvertFrom-Json
    $failed = @($result.cases | Where-Object { $_.p -eq 0 })
    Write-Host ''
    Write-Host "==> 测试完成：共 $($result.total) 条，失败 $($failed.Count) 条" -ForegroundColor $(if ($failed.Count -eq 0) { 'Green' } else { 'Red' })
    foreach ($c in $failed) {
        Write-Host "  [FAIL] $($c.id) $($c.d)（实际值: $($c.a)）" -ForegroundColor Red
    }
    if ($failed.Count -eq 0) { Write-Host '  全部通过 [OK]' -ForegroundColor Green; exit 0 } else { exit 1 }
}
catch {
    Write-Host "[错误] $_" -ForegroundColor Red
    exit 1
}
finally {
    Stop-Preview $preview
    Remove-Item "$Root\dist\$CheckName" -Force -ErrorAction SilentlyContinue
}
