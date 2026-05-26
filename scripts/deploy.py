#!/usr/bin/env python3
# ruff: noqa: W605  -- docstring содержит примеры Windows-путей (Cert:\LocalMachine)
r"""
deploy.py — кросс-платформенный setup / update Superset стенда.

Использование:
    python3 scripts/deploy.py                          # default: setup if new, update if exists
    python3 scripts/deploy.py --update                 # принудительно update (без clone)
    python3 scripts/deploy.py --skip-prereqs           # пропустить проверку Node/Docker/zstd
    python3 scripts/deploy.py --skip-build             # только git pull + docker restart
    python3 scripts/deploy.py --corp-ca corp-ca.pem    # корп-CA правильно (рекомендуется)
    python3 scripts/deploy.py --corp-tls-off           # workaround: strict-ssl=false (небезопасно)

Получение корп-CA сертификата:
    Windows (powershell):
        Get-ChildItem Cert:\LocalMachine\Root | Where-Object {
            $_.Issuer -eq $_.Subject -and
            $_.Subject -notmatch "DigiCert|VeriSign|GlobalSign|Microsoft|GoDaddy|Sectigo|Amazon|Comodo|ISRG"
        } | Format-List Subject, Thumbprint
        # → найди корп-CA в списке (по имени компании или вендору прокси), скопируй Thumbprint:
        $cert = Get-ChildItem Cert:\LocalMachine\Root\<THUMBPRINT>
        "-----BEGIN CERTIFICATE-----`n" +
          [Convert]::ToBase64String($cert.RawData, [Base64FormattingOptions]::InsertLineBreaks) +
          "`n-----END CERTIFICATE-----" |
          Out-File -Encoding ascii corp-ca.pem

    Linux:  CA обычно уже в /etc/ssl/certs/. Или экспорт из браузера → корень цепочки.
    Mac:    security find-certificate -a -p > all-roots.pem  (выбери нужный)

Что делает (полный цикл):
    1. Проверяет prerequisites: docker, git, node, zstd
    2. (optional) корп-TLS workaround
    3. git clone (если репо нет) / git pull (если есть)
    4. npm install + build для superset-frontend + всех плагинов
    5. docker compose down/up --build

Требования (должны стоять на хосте):
    - Python 3.6+
    - Docker + Docker Compose v2
    - Git
    - Node.js 20.x  (npm idёт в комплекте)
    - zstd          (для simple-zstd в webpack)

Если чего-то нет — скрипт скажет и даст команду установки для твоей ОС.
"""
import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

# ─── Конфигурация ─────────────────────────────────────────────────────────
REPO_URL = "https://github.com/light050687/superset.git"
BRANCH = "custom/main"
COMPOSE_FILE = "docker-compose-non-dev.yml"
NODE_MIN_MAJOR = 20
PLUGINS = [
    "leaderboard", "metricTimeSeries", "bulletChart", "divergingBars",
    "drilldownDonut", "paretoAnalysis", "pivotHeatmap", "rankedBars",
    "riskMatrix", "scorecard",
]
IS_WIN = platform.system() == "Windows"
IS_MAC = platform.system() == "Darwin"
IS_LINUX = platform.system() == "Linux"


# ─── Помощники вывода ─────────────────────────────────────────────────────
def _color(code, msg):
    if IS_WIN and not os.environ.get("ANSICON") and not os.environ.get("WT_SESSION"):
        return msg
    return f"\033[{code}m{msg}\033[0m"


def step(msg):  print(_color("36", f"→ {msg}"))
def ok(msg):    print(_color("32", f"✓ {msg}"))
def warn(msg):  print(_color("33", f"! {msg}"))
def err(msg):   print(_color("31", f"✗ {msg}"))


def run(cmd, cwd=None, check=True, capture=False, shell=False):
    """Запустить команду. Возвращает (returncode, stdout, stderr).

    На Windows резолвим первый аргумент через shutil.which — иначе
    subprocess не находит .cmd/.bat файлы (npm.cmd, yarn.cmd и т.п.),
    которые в PATH (PowerShell их подбирает, Python без shell — нет).
    """
    if isinstance(cmd, str) and not shell:
        cmd = cmd.split()
    if IS_WIN and not shell and isinstance(cmd, list) and cmd:
        resolved = shutil.which(cmd[0])
        if resolved:
            cmd = [resolved] + cmd[1:]
    if not capture:
        result = subprocess.run(cmd, cwd=cwd, shell=shell)
        if check and result.returncode != 0:
            err(f"Команда упала с кодом {result.returncode}: {cmd}")
            sys.exit(result.returncode)
        return result.returncode, "", ""
    result = subprocess.run(cmd, cwd=cwd, shell=shell,
                            capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and result.returncode != 0:
        err(f"Команда упала: {cmd}\n{result.stderr}")
        sys.exit(result.returncode)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def have(cmd):
    return shutil.which(cmd) is not None


# ─── Prerequisites ────────────────────────────────────────────────────────
def check_prereqs():
    step("Проверка prerequisites...")
    missing = []

    # docker
    if not have("docker"):
        missing.append(("docker", {
            "linux": "sudo apt install docker.io docker-compose-plugin  (или https://docs.docker.com/engine/install/)",
            "darwin": "brew install --cask docker",
            "windows": "https://www.docker.com/products/docker-desktop",
        }))
    else:
        _, out, _ = run(["docker", "--version"], capture=True)
        ok(f"docker: {out}")

    # git
    if not have("git"):
        missing.append(("git", {
            "linux": "sudo apt install git",
            "darwin": "brew install git",
            "windows": "https://git-scm.com/download/win",
        }))
    else:
        _, out, _ = run(["git", "--version"], capture=True)
        ok(f"git: {out}")

    # node 20+
    if not have("node"):
        missing.append(("node 20.x", {
            "linux": "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs",
            "darwin": "brew install node@20",
            "windows": "https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi",
        }))
    else:
        _, out, _ = run(["node", "--version"], capture=True)
        major = int(out.lstrip("v").split(".")[0])
        if major < NODE_MIN_MAJOR:
            err(f"node: {out} — требуется ≥ v{NODE_MIN_MAJOR}.x")
            sys.exit(1)
        elif major != NODE_MIN_MAJOR:
            warn(f"node: {out} (рекомендуется v{NODE_MIN_MAJOR}.x; v{major} может работать, но npm warn EBADENGINE)")
        else:
            ok(f"node: {out}")

    # zstd
    if not have("zstd"):
        missing.append(("zstd", {
            "linux": "sudo apt install zstd",
            "darwin": "brew install zstd",
            "windows": (
                "1) Скачай https://github.com/facebook/zstd/releases/latest (zstd-vX.Y.Z-win64.zip)\n"
                "   2) Распакуй в %USERPROFILE%\\Tools\\zstd\\\n"
                "   3) Добавь в PATH (powershell):\n"
                "      $p = [Environment]::GetEnvironmentVariable('Path', 'User')\n"
                "      [Environment]::SetEnvironmentVariable('Path', \"$p;$env:USERPROFILE\\Tools\\zstd\", 'User')"
            ),
        }))
    else:
        _, out, _ = run(["zstd", "--version"], capture=True)
        ok(f"zstd: {out.splitlines()[0]}")

    if missing:
        err(f"Отсутствуют: {', '.join(m[0] for m in missing)}")
        print()
        for name, instructions in missing:
            os_key = "windows" if IS_WIN else "darwin" if IS_MAC else "linux"
            print(f"  Установить {name} ({platform.system()}):")
            for line in instructions[os_key].splitlines():
                print(f"    {line}")
            print()
        sys.exit(1)


# ─── Корп-TLS workaround ──────────────────────────────────────────────────
def disable_strict_ssl():
    step("Отключаю strict-ssl для npm/git (корп-сеть workaround)...")
    run(["git", "config", "--global", "http.sslVerify", "false"])
    run(["npm", "config", "set", "strict-ssl", "false"])
    warn("strict-ssl=false активирован. Для PROD-машины верни обратно:")
    warn("  git config --global --unset http.sslVerify")
    warn("  npm config delete strict-ssl")


def setup_corp_ca(cert_path, repo_root):
    """Правильный путь: подключить корп-CA в git, npm, Node и docker build.

    cert_path  — путь к .pem/.cer (PEM-формат: BEGIN CERTIFICATE...).
    repo_root  — корень репо для записи docker/.env-local (None — пропустить).
    """
    import base64
    p = Path(cert_path).expanduser().resolve()
    if not p.exists():
        err(f"Сертификат не найден: {p}")
        sys.exit(1)
    step(f"Подключаю корп-CA: {p}")

    # 1. git — CA bundle для HTTPS
    run(["git", "config", "--global", "http.sslCAInfo", str(p)])
    ok("git http.sslCAInfo")

    # 2. npm — cafile для TLS
    run(["npm", "config", "set", "cafile", str(p)])
    ok("npm cafile")

    # 3. Node.js — NODE_EXTRA_CA_CERTS для текущей сессии (webpack build)
    os.environ["NODE_EXTRA_CA_CERTS"] = str(p)
    ok(f"NODE_EXTRA_CA_CERTS={p} (в этой сессии)")

    # 4. Docker — CORP_CA_CERT_B64 в .env-local (для websocket Dockerfile)
    if repo_root is not None:
        b64 = base64.b64encode(p.read_bytes()).decode("ascii")
        env_local = repo_root / "docker" / ".env-local"
        env_local.parent.mkdir(parents=True, exist_ok=True)
        existing = env_local.read_text() if env_local.exists() else ""
        lines = [l for l in existing.splitlines() if not l.startswith("CORP_CA_CERT_B64=")]
        lines.append(f"CORP_CA_CERT_B64={b64}")
        env_local.write_text("\n".join(lines) + "\n")
        ok(f"docker/.env-local ← CORP_CA_CERT_B64 ({len(b64)} chars)")

    warn("Чтобы NODE_EXTRA_CA_CERTS остался после reboot — добавь в shell rc:")
    if IS_WIN:
        warn(f"  setx NODE_EXTRA_CA_CERTS \"{p}\"")
    else:
        warn(f"  echo 'export NODE_EXTRA_CA_CERTS={p}' >> ~/.bashrc")


# ─── Git ──────────────────────────────────────────────────────────────────
def ensure_repo(script_dir):
    """Если скрипт лежит ВНУТРИ репо — pull. Иначе — clone в ./superset."""
    repo_root = script_dir.parent
    if (repo_root / COMPOSE_FILE).exists():
        step(f"Скрипт внутри репо: {repo_root}")
        step("git fetch + pull...")
        run(["git", "fetch", "origin"], cwd=repo_root)
        run(["git", "checkout", BRANCH], cwd=repo_root)
        rc, _, stderr = run(["git", "pull", "origin", BRANCH], cwd=repo_root, check=False, capture=True)
        if rc != 0:
            err("git pull упал — возможно конфликт с локальными правками.")
            err(stderr)
            err("Разреши руками или: git stash && python3 scripts/deploy.py --update")
            sys.exit(1)
        return repo_root

    # Скрипт запущен отдельно — клонируем в текущей директории
    target = Path.cwd() / "superset"
    if target.exists() and (target / ".git").exists():
        step(f"Папка {target} уже есть — git pull...")
        run(["git", "fetch", "origin"], cwd=target)
        run(["git", "checkout", BRANCH], cwd=target)
        run(["git", "pull", "origin", BRANCH], cwd=target)
    else:
        step(f"git clone {REPO_URL} → {target}")
        run(["git", "clone", REPO_URL, str(target)])
        run(["git", "checkout", BRANCH], cwd=target)
    return target


# ─── Build frontend + plugins ─────────────────────────────────────────────
def npm_install_and_build(pkg_dir, label):
    step(f"  → {label}")
    # --legacy-peer-deps: плагины используют старый @superset-ui/chart-controls
    # с peer react^16, при наличии react@18/19 в дереве npm падает на ERESOLVE.
    # Старое поведение npm — просто warn, новое — error. Восстанавливаем
    # старое для совместимости со старыми плагинами.
    rc, _, _ = run(["npm", "install", "--legacy-peer-deps"], cwd=pkg_dir, check=False)
    if rc != 0:
        warn(f"  npm install {label} failed — пропускаю")
        return False
    rc, _, _ = run(["npm", "run", "build"], cwd=pkg_dir, check=False)
    if rc != 0:
        warn(f"  npm run build {label} failed — пропускаю")
        return False
    return True


def build_frontend(repo_root):
    step("Build superset-frontend (~15 мин)...")
    fe = repo_root / "superset-frontend"
    # Удалить наши custom плагины из node_modules, чтобы npm install взял
    # свежую копию из my-plugins/* (они file:-зависимости в package.json).
    # Без этого фронт может ссылаться на старые esm/ артефакты с прошлого
    # клона/npm install — webpack валится на missing ./components/InfoHint.
    node_modules = fe / "node_modules"
    for stale in node_modules.glob("superset-plugin-chart-*"):
        if stale.is_dir():
            shutil.rmtree(stale, ignore_errors=True)
    run(["npm", "install", "--legacy-peer-deps"], cwd=fe)
    run(["npm", "run", "build"], cwd=fe)
    ok("Frontend собран")


def build_plugins(repo_root):
    step(f"Build плагинов ({len(PLUGINS)} шт, ~15-20 мин)...")
    mp = repo_root / "my-plugins"
    built = 0
    for p in PLUGINS:
        pdir = mp / p
        if (pdir / "package.json").exists():
            if npm_install_and_build(pdir, p):
                built += 1
        else:
            warn(f"  {p}: нет package.json — пропускаю")
    ok(f"Плагинов собрано: {built}/{len(PLUGINS)}")


# ─── Docker ───────────────────────────────────────────────────────────────
def docker_recreate(repo_root):
    step("docker compose down...")
    run(["docker", "compose", "-f", COMPOSE_FILE, "down"], cwd=repo_root, check=False)
    step("docker compose up -d --build (~5-10 мин)...")
    run(["docker", "compose", "-f", COMPOSE_FILE, "up", "-d", "--build"], cwd=repo_root)


# ─── Main ─────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Deploy/update Superset BI стенд")
    p.add_argument("--update", action="store_true", help="Только git pull + rebuild (без проверки prereqs)")
    p.add_argument("--skip-prereqs", action="store_true", help="Пропустить проверку Docker/Node/zstd")
    p.add_argument("--skip-build", action="store_true", help="Только git pull + docker recreate")
    p.add_argument("--corp-tls-off", action="store_true",
                   help="workaround: strict-ssl=false для npm/git (небезопасно)")
    p.add_argument("--corp-ca", metavar="PATH",
                   help="путь к корп-CA сертификату (PEM) — правильное решение")
    args = p.parse_args()

    if not (args.skip_prereqs or args.update):
        check_prereqs()

    if args.corp_tls_off and args.corp_ca:
        err("Нельзя одновременно --corp-tls-off и --corp-ca. Выбери один.")
        sys.exit(1)
    if args.corp_tls_off:
        disable_strict_ssl()
    if args.corp_ca:
        # Применить настройки git/npm/Node ДО clone (нужны для https git clone)
        setup_corp_ca(args.corp_ca, None)

    script_dir = Path(__file__).resolve().parent
    repo_root = ensure_repo(script_dir)
    ok(f"Репо: {repo_root}")

    if args.corp_ca:
        # Теперь когда репо есть — дописать CORP_CA_CERT_B64 в docker/.env-local
        setup_corp_ca(args.corp_ca, repo_root)

    if not args.skip_build:
        # Порядок важен: плагины сначала (создают esm/lib артефакты),
        # потом frontend (npm install копирует свежие my-plugins → node_modules).
        # Обратный порядок → webpack видит старые esm/ без новых компонент.
        build_plugins(repo_root)
        build_frontend(repo_root)

    docker_recreate(repo_root)

    print()
    ok("Готово!")
    print("  Логи init:")
    print(f"    docker compose -f {COMPOSE_FILE} logs -f superset-init")
    print("  Когда увидишь 'exited with code 0' — открой:")
    print("    http://localhost:8088   (admin / admin)")


if __name__ == "__main__":
    main()
