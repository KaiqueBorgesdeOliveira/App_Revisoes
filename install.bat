@echo off
echo ========================================
echo Sistema de Revisao de Salas - UOL
echo ========================================
echo.
echo Instalando dependencias...
echo.

REM Verificar se o Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js de https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se o NPM esta instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: NPM nao encontrado!
    echo Por favor, reinstale o Node.js com NPM
    pause
    exit /b 1
)

echo Node.js e NPM encontrados!
echo.
echo Instalando dependencias do projeto...
npm install

if %errorlevel% neq 0 (
    echo ERRO: Falha na instalacao das dependencias!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Instalacao concluida com sucesso!
echo ========================================
echo.
echo Para iniciar o sistema:
echo 1. Execute: npm start
echo 2. Abra o navegador em: http://localhost:3000
echo 3. Clique em "Inicializar Dados" para importar suas salas
echo.
echo Pressione qualquer tecla para iniciar o servidor agora...
pause

echo.
echo Iniciando servidor...
npm start
