@echo off
REM ─────────────────────────────────────────────────────────────────
REM bootstrap.cmd — поднимает локальный Superset стек на чистом клоне.
REM
REM Использование:
REM   scripts\bootstrap.cmd
REM
REM Что делает:
REM   1. Проверяет Docker Desktop запущен
REM   2. Создаёт docker\.env-local из .env-local.example (если нет)
REM   3. docker compose up -d
REM   4. Ждёт superset_app (healthy) до 10 минут
REM   5. Билдит фронтенд внутри superset-node контейнера
REM   6. Печатает URL и логин
REM ─────────────────────────────────────────────────────────────────

setlocal EnableDelayedExpansion

REM Перейти в корень репо
pushd "%~dp0\.."

echo.
echo ^>^> Проверяю Docker Desktop...
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop не запущен. Запустите его и повторите.
    popd
    exit /b 1
)
echo Docker OK

REM .env-local
if not exist "docker\.env-local" (
    if exist "docker\.env-local.example" (
        echo [WARN] docker\.env-local не найден — копирую из .env-local.example
        copy /Y "docker\.env-local.example" "docker\.env-local" >nul
        echo [WARN] Просмотрите docker\.env-local и заполните значения,
        echo [WARN] затем перезапустите bootstrap.
    )
)

echo.
echo ^>^> Поднимаю docker-compose стек...
docker compose up -d
if errorlevel 1 (
    echo [ERROR] docker compose up failed
    popd
    exit /b 1
)

echo.
echo ^>^> Ожидаю superset_app (healthy)... (timeout 10 минут)

set /a DEADLINE=600
set /a ELAPSED=0
:wait_loop
docker compose ps superset 2>nul | findstr "(healthy)" >nul
if not errorlevel 1 (
    echo superset_app — healthy
    goto wait_done
)
docker compose ps superset 2>nul | findstr "(unhealthy)" >nul
if not errorlevel 1 (
    echo [ERROR] superset_app — unhealthy. Логи: docker compose logs superset
    popd
    exit /b 1
)
if !ELAPSED! geq !DEADLINE! (
    echo [ERROR] Timeout 10 минут.
    popd
    exit /b 1
)
timeout /t 5 /nobreak >nul
set /a ELAPSED=ELAPSED+5
goto wait_loop
:wait_done

echo.
echo ^>^> Билжу frontend (~3-5 минут)...

REM Загружаем AI_BACKEND_URL из .env-local если есть
set "AI_URL=http://dataru-saod-llm02-vm.samberi.com:8080"
if exist "docker\.env-local" (
    for /f "usebackq tokens=2 delims==" %%a in (`findstr /b "AI_BACKEND_URL=" "docker\.env-local"`) do set "AI_URL=%%a"
)

docker compose run --rm ^
    -e AI_BACKEND_URL=!AI_URL! ^
    -e PUPPETEER_SKIP_DOWNLOAD=true ^
    -e NPM_CONFIG_STRICT_SSL=false ^
    superset-node bash -c "cd /app/superset-frontend && npm run build"
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    popd
    exit /b 1
)

echo Frontend собран

echo.
echo ^>^> Перезапускаю superset + nginx...
docker compose restart superset nginx >nul

echo.
echo ════════════════════════════════════════════════════
echo  Готово!
echo.
echo   URL:    http://localhost:8088
echo   Логин:  admin
echo   Пароль: admin
echo.
echo   Документация: docs\setup.md
echo ════════════════════════════════════════════════════

popd
endlocal
