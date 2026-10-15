# LocalTimeMachine Installer Script
Add-Type -AssemblyName System.Windows.Forms

$title = "Local Time Machine - インストール"
$warningMsg = @"
【⚠️ 重要警告：ストレージ容量が約2倍使用されます】

本アプリ「Local Time Machine」は、ユーザーの大切なファイル、写真、動画を万が一の事態から絶対に守るため、独自の二重保護アーキテクチャを採用しています。

【なぜ容量が2倍必要なのか？】
1. ショートカットのみの登録は禁止（完全物理バイナリコピー）
2. エクスプローラー上で誤ってゴミ箱からも完全削除されても即座に復元可能
3. 間違って上書き保存しても過去のあらゆるバージョンへ復旧可能

上記のリスクと安全性の理由を理解し、インストールを続行しますか？
"@

$result = [System.Windows.Forms.MessageBox]::Show($warningMsg, $title, [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Warning)

if ($result -ne [System.Windows.Forms.DialogResult]::Yes) {
    [System.Windows.Forms.MessageBox]::Show("インストールがキャンセルされました。", $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    exit 0
}

# Install Directory: %LOCALAPPDATA%\Programs\LocalTimeMachine
$installDir = "$env:LOCALAPPDATA\Programs\LocalTimeMachine"
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$sourceDir = Join-Path $PSScriptRoot "..\release\win-unpacked"
if (!(Test-Path $sourceDir)) {
    $sourceDir = $PSScriptRoot
}

Write-Host "ファイルをインストール中: $installDir ..." -ForegroundColor Cyan
Copy-Item -Path "$sourceDir\*" -Destination $installDir -Recurse -Force

# Create Desktop Shortcut
$wscript = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcut = $wscript.CreateShortcut("$desktopPath\Local Time Machine.lnk")
$shortcut.TargetPath = "$installDir\LocalTimeMachine.exe"
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "Local Time Machine - 安全隔離スナップショット＆復元システム"
$shortcut.Save()

# Create Start Menu Shortcut
$startMenuPath = [System.Environment]::GetFolderPath('Programs')
$startMenuDir = "$startMenuPath\Local Time Machine"
if (!(Test-Path $startMenuDir)) {
    New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
}
$smShortcut = $wscript.CreateShortcut("$startMenuDir\Local Time Machine.lnk")
$smShortcut.TargetPath = "$installDir\LocalTimeMachine.exe"
$smShortcut.WorkingDirectory = $installDir
$smShortcut.Save()

$successMsg = @"
Local Time Machine のインストールが正常に完了しました！

・インストール先: $installDir
・デスクトップにショートカットを作成しました。
・スタートメニューに登録しました。

今すぐ起動しますか？
"@

$launchChoice = [System.Windows.Forms.MessageBox]::Show($successMsg, "インストール完了", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Information)

if ($launchChoice -eq [System.Windows.Forms.DialogResult]::Yes) {
    Start-Process "$installDir\LocalTimeMachine.exe"
}
