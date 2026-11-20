@echo off
chcp 65001 >nul
title Catalogo BAP online: atualizar dados e fotos
cd /d "%~dp0"
rem Traz a base unificada e as fotos do OneDrive, gera o site e envia ao GitHub (o Render publica sozinho).
set "ONEDRIVE_BAP=%USERPROFILE%\OneDrive - PMZ DISTRIBUIDORA SA\1 - PMZ\2025\IM PMZ\Regionais - Leandro"
if not exist "%ONEDRIVE_BAP%\BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx" (
  echo [ERRO] Nao achei a base em "%ONEDRIVE_BAP%\BAP Ajuda 2.0". Ajuste ONEDRIVE_BAP neste .bat.
  pause & exit /b 1
)
set "PY=py -3"
where py >nul 2>nul || set "PY=python"
git pull --no-rebase --no-edit
copy /y "%ONEDRIVE_BAP%\BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx" "dados\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx" >nul
%PY% scripts\gerar_site.py --fotos "%ONEDRIVE_BAP%\DOCUMENTOS BAP\FOTOS DOS PRODUTOS"
if errorlevel 1 ( echo [PARADO] o gerador recusou. Nada foi enviado. & pause & exit /b 1 )
git add -A
git diff --cached --quiet && ( echo Nada novo. & pause & exit /b 0 )
git commit -q -m "Atualiza o catalogo online (base unificada e fotos)" -m "Agente: alexandre"
git push
echo.
echo PRONTO: enviado. O Render publica em 1 a 2 minutos.
pause
