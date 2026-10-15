@echo off
chcp 65001 > nul
title Local Time Machine インストーラー
echo ========================================================
echo     Local Time Machine - インストーラーセットアップ
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
pause
