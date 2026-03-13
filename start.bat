@echo off
setlocal enabledelayedexpansion

REM Définir le chemin de Node.js
set NODE_PATH=C:\Program Files\nodejs
set PATH=%NODE_PATH%;%PATH%

cd /d C:\Users\USER\Desktop\POD

echo.
echo ====================================
echo Démarrage du backend StartupFlow
echo ====================================
echo.

REM Vérifier si node fonctionne
"%NODE_PATH%\node.exe" --version
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
  echo Etape 1: Installation des dépendances (première fois)...
  call "%NODE_PATH%\npm.cmd" install
  if errorlevel 1 (
    echo ERREUR: npm install a échoué
    pause
    exit /b 1
  )
) else (
  echo ✓ Dépendances déjà installées
)

echo.
echo Etape 2: Génération Prisma...
call "%NODE_PATH%\npx.cmd" prisma generate
if errorlevel 1 (
  echo ERREUR: prisma generate a échoué
  pause
  exit /b 1
)

echo.
echo Etape 3: Migration de la base de données...
call "%NODE_PATH%\npx.cmd" prisma migrate dev --name init
if errorlevel 1 (
  echo Note: Migration peut déjà exister, c'est normal
)

echo.
echo Etape 4: Peuplement de la base de données...
call "%NODE_PATH%\npm.cmd" run seed
if errorlevel 1 (
  echo Note: Seed peut déjà être peuplée, c'est normal
)

echo.
echo ====================================
echo ✓ Démarrage du serveur sur port 3000
echo ====================================
echo.
echo Ouvre dans le navigateur:
echo http://localhost:3000 ou C:\Users\USER\Desktop\POD\gestion.html
echo.
echo La fenêtre va rester ouverte. NE LA FERME PAS !
echo.

call "%NODE_PATH%\npm.cmd" run dev
pause
