#!/usr/bin/env python3
# ruff: noqa: W605  -- docstring содержит примеры Windows-путей (Cert:\LocalMachine)
r"""
deploy.py — кросс-платформенный setup / update Superset стенда.

Подкоманды:

    python3 scripts/deploy.py setup [опции]      # первичная установка с нуля
    python3 scripts/deploy.py update [опции]     # обновление работающего стенда

Опции setup:
    --corp-ca PATH              путь к корп-CA сертификату (PEM)
    --ca-from-windows-store     авто-извлечение корп-CA из Cert:\LocalMachine\Root
                                (только Windows; PowerShell helper)
    --corp-tls-off              workaround: strict-ssl=false (небезопасно)
    --with-examples             загружать demo-датасеты (World Bank, BART и пр.).
                                По умолчанию НЕ грузим — на корп-сети через MITM
                                это медленно/падает, и в проде не нужно.
    --wait-ready                после `docker compose up` ждать superset_app:healthy
                                (timeout 5 мин)

Опции update:
    --no-build                  только git pull + docker recreate (для случаев
                                когда меняется только Python/конфиг)
    --wait-ready                как в setup

Получение корп-CA (если --ca-from-windows-store не работает — например не Windows):
    Windows (powershell):
        $pem = ""
        @('Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root') | ForEach-Object {
          Get-ChildItem $_ | Where-Object {
            $_.Issuer -eq $_.Subject -and
            $_.Subject -notmatch "DigiCert|VeriSign|GlobalSign|Microsoft|GoDaddy|Sectigo|Amazon|Comodo|ISRG"
          } | ForEach-Object {
            $pem += "-----BEGIN CERTIFICATE-----`n"
            $pem += [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks)
            $pem += "`n-----END CERTIFICATE-----`n"
          }
        }
        $pem | Out-File -Encoding ascii corp-ca.pem

    Linux:  CA обычно уже в /etc/ssl/certs/. Или экспорт из браузера → корень цепочки.
    Mac:    security find-certificate -a -p > all-roots.pem  (выбери нужный)

Требования (должны стоять на хосте):
    - Python 3.6+
    - Docker + Docker Compose v2
    - Git
    - Node.js 20.x  (npm идёт в комплекте)
    - zstd          (для simple-zstd в webpack)

Если чего-то нет — скрипт скажет и даст команду установки для твоей ОС.
"""
import argparse
import base64
import os
import platform
import shutil
import subprocess
import sys
import time
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
# Win32 не пускает env var > 32767 chars (в реальности ARG_MAX exec ~32K общий).
# CORP_CA_CERT_B64 = full Windows trust store bundle обычно ~470 KB — НЕ влезает.
# Лимит выбран с запасом для остальных env vars в .env-local.
CORP_CA_B64_MAX = 30000

CONTAINER_APP = "superset_app"
CONTAINER_INIT = "superset_init"

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

    if not have("docker"):
        missing.append(("docker", {
            "linux": "sudo apt install docker.io docker-compose-plugin  (или https://docs.docker.com/engine/install/)",
            "darwin": "brew install --cask docker",
            "windows": "https://www.docker.com/products/docker-desktop",
        }))
    else:
        _, out, _ = run(["docker", "--version"], capture=True)
        ok(f"docker: {out}")

    if not have("git"):
        missing.append(("git", {
            "linux": "sudo apt install git",
            "darwin": "brew install git",
            "windows": "https://git-scm.com/download/win",
        }))
    else:
        _, out, _ = run(["git", "--version"], capture=True)
        ok(f"git: {out}")

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


def setup_corp_ca_host(cert_path):
    """Подключить корп-CA в git/npm/Node на хосте. Возвращает absolute Path."""
    p = Path(cert_path).expanduser().resolve()
    if not p.exists():
        err(f"Сертификат не найден: {p}")
        sys.exit(1)
    step(f"Подключаю корп-CA: {p}")

    run(["git", "config", "--global", "http.sslCAInfo", str(p)])
    ok("git http.sslCAInfo")

    run(["npm", "config", "set", "cafile", str(p)])
    ok("npm cafile")

    os.environ["NODE_EXTRA_CA_CERTS"] = str(p)
    ok(f"NODE_EXTRA_CA_CERTS={p} (в этой сессии)")

    warn("Чтобы NODE_EXTRA_CA_CERTS остался после reboot — добавь в shell rc:")
    if IS_WIN:
        warn(f"  setx NODE_EXTRA_CA_CERTS \"{p}\"")
    else:
        warn(f"  echo 'export NODE_EXTRA_CA_CERTS={p}' >> ~/.bashrc")

    return p


def extract_corp_ca_from_windows_store(out_path):
    """Авто-извлечение корп-CA из Windows trust store через PowerShell.

    Фильтр: self-signed (Issuer == Subject) И НЕ из well-known list
    (DigiCert, VeriSign и т.п.). Это даёт небольшой bundle (~3-10 KB)
    только с корп-CA организации и вендора прокси.

    Возвращает Path к сгенерированному .pem или None если на хосте нет
    корп-CA в trust store.
    """
    if not IS_WIN:
        err("--ca-from-windows-store работает только на Windows")
        sys.exit(1)
    out = Path(out_path).expanduser().resolve()
    step(f"Извлекаю корп-CA из Windows trust store → {out}")

    ps_script = r"""
$wellKnown = 'DigiCert|VeriSign|GlobalSign|Microsoft|GoDaddy|Sectigo|Amazon|Comodo|ISRG|USERTrust|Baltimore|Entrust|Apple|Mozilla|Starfield|Go Daddy|thawte|Equifax|QuoVadis|SwissSign|Atos|Cybertrust|Hellenic|TeliaSonera|Symantec|TWCA|Buypass|NetLock|AffirmTrust|SecureTrust|Trustwave|WoSign|XRamp|ePKI|Hongkong'
$pem = ''
$count = 0
@('Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root') | ForEach-Object {
  Get-ChildItem $_ -ErrorAction SilentlyContinue | Where-Object {
    $_.Issuer -eq $_.Subject -and
    $_.Subject -notmatch $wellKnown
  } | ForEach-Object {
    $pem += "-----BEGIN CERTIFICATE-----`n"
    $pem += [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks)
    $pem += "`n-----END CERTIFICATE-----`n"
    $count++
  }
}
$pem | Out-File -Encoding ascii -NoNewline '__OUT__'
Write-Output $count
"""
    ps_script = ps_script.replace("__OUT__", str(out).replace("\\", "\\\\"))
    rc, stdout, stderr = run(
        ["powershell", "-NoProfile", "-Command", ps_script],
        capture=True, check=False,
    )
    if rc != 0:
        err(f"PowerShell вернул код {rc}: {stderr}")
        sys.exit(1)

    count = stdout.strip().splitlines()[-1] if stdout.strip() else "0"
    try:
        n = int(count)
    except ValueError:
        n = 0
    if n == 0 or not out.exists() or out.stat().st_size == 0:
        err("В trust store не найдено корп-CA (всё well-known). Использовать --corp-tls-off или указать --corp-ca PATH руками.")
        sys.exit(1)
    ok(f"Извлечено {n} корп-CA, файл: {out} ({out.stat().st_size} байт)")
    return out


# ─── docker/.env-local ────────────────────────────────────────────────────
def setup_env_local(repo_root, *, load_examples=False, corp_ca_pem=None):
    """Создать/обновить docker/.env-local.

    SUPERSET_LOAD_EXAMPLES=no по умолчанию (load_examples=False) — иначе
    superset-init качает ~10 MB demo с cdn.jsdelivr.net (медленно через
    корп-MITM, не нужно в проде).

    Если corp_ca_pem передан — записываем CORP_CA_CERT_B64=... с size guard:
    если base64 > CORP_CA_B64_MAX, отказ + подсказка использовать --ca-from-windows-store
    (он экстрактит только корп-CA, не весь trust store).
    """
    env_local = repo_root / "docker" / ".env-local"
    env_local.parent.mkdir(parents=True, exist_ok=True)
    existing = env_local.read_text() if env_local.exists() else ""

    # Сохраняем существующие строки кроме тех что перезаписываем
    managed_keys = {"SUPERSET_LOAD_EXAMPLES", "CORP_CA_CERT_B64"}
    lines = [
        l for l in existing.splitlines()
        if "=" not in l or l.split("=", 1)[0].strip() not in managed_keys
    ]

    lines.append(f"SUPERSET_LOAD_EXAMPLES={'yes' if load_examples else 'no'}")

    if corp_ca_pem is not None:
        b64 = base64.b64encode(Path(corp_ca_pem).read_bytes()).decode("ascii")
        if len(b64) > CORP_CA_B64_MAX:
            err(f"CORP_CA_CERT_B64 слишком большой: {len(b64)} chars > limit {CORP_CA_B64_MAX}")
            err("Windows env var limit ~32 KB. Полный trust store bundle (477 KB) не влезет.")
            err("Используй --ca-from-windows-store (фильтрует только корп-CA, обычно 3-10 KB).")
            sys.exit(1)
        lines.append(f"CORP_CA_CERT_B64={b64}")
        ok(f"docker/.env-local ← CORP_CA_CERT_B64 ({len(b64)} chars)")

    env_local.write_text("\n".join(lines) + "\n")
    ok(f"docker/.env-local: SUPERSET_LOAD_EXAMPLES={'yes' if load_examples else 'no'}")


# ─── Git ──────────────────────────────────────────────────────────────────
def git_pull_with_stash(repo_root):
    """git fetch + checkout + pull с auto-stash при конфликте.

    Локальные правки (например customization Dockerfile под корп-CA)
    сохраняются в stash → pull → stash pop. При конфликте на pop —
    warn + продолжаем (юзер разрешит сам).
    """
    step("git fetch + pull...")
    run(["git", "fetch", "origin"], cwd=repo_root)
    run(["git", "checkout", BRANCH], cwd=repo_root, check=False)

    # Pre-check: есть ли локальные правки?
    rc, out, _ = run(["git", "status", "--porcelain"], cwd=repo_root, capture=True)
    has_local = bool(out.strip())

    if has_local:
        warn("Есть локальные правки — auto-stash перед pull")
        run(["git", "stash", "push", "-m", "deploy.py auto-stash"], cwd=repo_root)

    rc, _, stderr = run(["git", "pull", "origin", BRANCH], cwd=repo_root, check=False, capture=True)
    if rc != 0:
        err("git pull упал:")
        err(stderr)
        if has_local:
            warn("Восстанавливаю локальные правки из stash...")
            run(["git", "stash", "pop"], cwd=repo_root, check=False)
        sys.exit(1)

    if has_local:
        rc, _, _ = run(["git", "stash", "pop"], cwd=repo_root, check=False, capture=True)
        if rc != 0:
            warn("git stash pop дал конфликт. Разреши его руками, потом запусти update снова.")
            warn("Локальные правки в stash сохранены: git stash list")


def ensure_repo(script_dir, allow_clone=True):
    """Если скрипт лежит ВНУТРИ репо — pull. Иначе — clone в ./superset."""
    repo_root = script_dir.parent
    if (repo_root / COMPOSE_FILE).exists():
        step(f"Скрипт внутри репо: {repo_root}")
        git_pull_with_stash(repo_root)
        return repo_root

    if not allow_clone:
        err(f"Репо не найдено: {repo_root}. Запусти `python deploy.py setup` сначала.")
        sys.exit(1)

    target = Path.cwd() / "superset"
    if target.exists() and (target / ".git").exists():
        step(f"Папка {target} уже есть — git pull...")
        git_pull_with_stash(target)
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
    rc, _, _ = run(["npm", "install", "--legacy-peer-deps"], cwd=pkg_dir, check=False)
    if rc != 0:
        warn(f"  npm install {label} failed — пропускаю")
        return False
    rc, _, _ = run(["npm", "run", "build"], cwd=pkg_dir, check=False)
    if rc != 0:
        warn(f"  npm run build {label} failed — пропускаю")
        return False
    return True


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


def build_frontend(repo_root):
    step("Build superset-frontend (~15 мин)...")
    fe = repo_root / "superset-frontend"
    # Удалить наши custom плагины из node_modules, чтобы npm install взял
    # свежую копию из my-plugins/* (они file:-зависимости в package.json).
    # Без этого webpack валится на missing ./components/InfoHint (esm/ старый).
    node_modules = fe / "node_modules"
    for stale in node_modules.glob("superset-plugin-chart-*"):
        if stale.is_dir():
            shutil.rmtree(stale, ignore_errors=True)
    run(["npm", "install", "--legacy-peer-deps"], cwd=fe)
    run(["npm", "run", "build"], cwd=fe)
    ok("Frontend собран")


# ─── Docker ───────────────────────────────────────────────────────────────
def _load_env_local_into_os(repo_root):
    """Подгрузить CORP_CA_CERT_B64 (и др.) из docker/.env-local в os.environ,
    чтобы compose substitution `${CORP_CA_CERT_B64}` в build:args сработал."""
    env_local = repo_root / "docker" / ".env-local"
    if not env_local.exists():
        return
    for line in env_local.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            k = k.strip()
            if k and k not in os.environ:
                os.environ[k] = v.strip()


def docker_up(repo_root, recreate=True):
    _load_env_local_into_os(repo_root)
    if recreate:
        step("docker compose down...")
        run(["docker", "compose", "-f", COMPOSE_FILE, "down"], cwd=repo_root, check=False)
    step("docker compose up -d --build (~5-10 мин)...")
    run(["docker", "compose", "-f", COMPOSE_FILE, "up", "-d", "--build"], cwd=repo_root)


def wait_for_health(container=CONTAINER_APP, timeout=300, poll=5):
    """Polling docker inspect health до 'healthy' или timeout (сек)."""
    step(f"Жду {container}:healthy (timeout {timeout} сек)...")
    deadline = time.time() + timeout
    last_status = ""
    while time.time() < deadline:
        rc, out, _ = run(
            ["docker", "inspect", "--format", "{{.State.Health.Status}}", container],
            capture=True, check=False,
        )
        status = out.strip() if rc == 0 else "missing"
        if status == "healthy":
            ok(f"{container} healthy")
            return True
        if status != last_status:
            print(f"  {container}: {status}")
            last_status = status
        time.sleep(poll)
    err(f"{container} не стал healthy за {timeout} сек. Последний статус: {last_status}")
    err(f"Логи: docker logs {container}")
    return False


# ─── Подкоманды ───────────────────────────────────────────────────────────
def cmd_setup(args):
    check_prereqs()

    if args.corp_tls_off and (args.corp_ca or args.ca_from_windows_store):
        err("Нельзя одновременно --corp-tls-off и --corp-ca / --ca-from-windows-store.")
        sys.exit(1)

    # 1. Корп-CA workflow
    corp_ca_pem = None
    if args.corp_tls_off:
        disable_strict_ssl()
    elif args.ca_from_windows_store:
        out = Path.home() / "corp-ca-bundle.pem"
        corp_ca_pem = extract_corp_ca_from_windows_store(out)
        setup_corp_ca_host(corp_ca_pem)
    elif args.corp_ca:
        corp_ca_pem = setup_corp_ca_host(args.corp_ca)

    # 2. Clone / pull
    script_dir = Path(__file__).resolve().parent
    repo_root = ensure_repo(script_dir, allow_clone=True)
    ok(f"Репо: {repo_root}")

    # 3. .env-local: SUPERSET_LOAD_EXAMPLES=no, CORP_CA_CERT_B64 (опц.)
    setup_env_local(
        repo_root,
        load_examples=args.with_examples,
        corp_ca_pem=corp_ca_pem,
    )

    # 4. Build
    build_plugins(repo_root)
    build_frontend(repo_root)

    # 5. Docker
    docker_up(repo_root, recreate=True)

    # 6. Wait + print
    if args.wait_ready:
        wait_for_health(CONTAINER_APP, timeout=300)

    print()
    ok("Setup готов!")
    print("  Логи init:  docker logs -f superset_init")
    print("  Открой:     http://localhost:8088   (admin / admin)")


def cmd_update(args):
    script_dir = Path(__file__).resolve().parent
    repo_root = ensure_repo(script_dir, allow_clone=False)
    ok(f"Репо: {repo_root}")

    if not args.no_build:
        build_plugins(repo_root)
        build_frontend(repo_root)

    docker_up(repo_root, recreate=True)

    if args.wait_ready:
        wait_for_health(CONTAINER_APP, timeout=300)

    print()
    ok("Update готов!")
    print("  Открой:  http://localhost:8088")


# ─── Main ─────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(
        description="Deploy/update Superset BI стенд",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = p.add_subparsers(dest="cmd", required=True, metavar="{setup,update}")

    s = sub.add_parser("setup", help="первичная установка с нуля")
    s.add_argument("--corp-ca", metavar="PATH", help="путь к корп-CA сертификату (PEM)")
    s.add_argument("--ca-from-windows-store", action="store_true",
                   help="авто-извлечение корп-CA из Cert:\\LocalMachine\\Root (Windows)")
    s.add_argument("--corp-tls-off", action="store_true",
                   help="workaround: strict-ssl=false (небезопасно)")
    s.add_argument("--with-examples", action="store_true",
                   help="загружать demo-датасеты (default: no — на корп-MITM медленно)")
    s.add_argument("--wait-ready", action="store_true",
                   help="ждать superset_app:healthy перед завершением")
    s.set_defaults(func=cmd_setup)

    u = sub.add_parser("update", help="обновление работающего стенда")
    u.add_argument("--no-build", action="store_true",
                   help="пропустить npm build (только git pull + docker recreate)")
    u.add_argument("--wait-ready", action="store_true",
                   help="ждать superset_app:healthy перед завершением")
    u.set_defaults(func=cmd_update)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
