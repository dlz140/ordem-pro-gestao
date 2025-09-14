@echo off
title Sistema Ordem Pro Gestao - Iniciando...
color 0A

echo.
echo ======================================================
echo    SISTEMA ORDEM PRO GESTAO - INICIANDO SERVIDOR
echo ======================================================
echo.

REM Verificar se Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado! Por favor, instale o Node.js
    pause
    exit /b 1
)

REM Verificar se estamos na pasta correta
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado! Certifique-se de estar na pasta correta
    pause
    exit /b 1
)

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
)

echo [INFO] Iniciando servidor de desenvolvimento...
echo.
echo O servidor sera aberto automaticamente no navegador
echo URL: http://localhost:5173 ou http://localhost:5174
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

REM Iniciar o servidor e abrir o navegador
start "" http://localhost:5173
npm run dev

pause