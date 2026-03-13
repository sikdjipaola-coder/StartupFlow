@echo off
REM run_dev.cmd — utilitaire pour démarrer le serveur en évitant les blocages PowerShell
cd /d %~dp0
"C:\Program Files\nodejs\node.exe" -v
"C:\Program Files\nodejs\npm.cmd" -v
if not exist node_modules (
  echo Installing dependencies...
  "C:\Program Files\nodejs\npm.cmd" install || goto :err
)
"C:\Program Files\nodejs\npm.cmd" run dev || goto :err
pause
exit /b 0
:err
echo ERROR: command failed
pause
exit /b 1
