#!/usr/bin/env python3
"""
delta.py — быстрый delta-deploy frontend bundle в работающий Docker контейнер.

Копирует только изменённые .js/.css (по mtime, ≤ N минут) + manifest.json
в `superset_app:/app/superset/static/assets/`. Без docker restart —
Flask раздаёт статику напрямую, cache-bust работает через [contenthash]
в filename (webpack production build).

Типичный цикл «правка плагина → :8088»:

    cd my-plugins/<plugin> && npm run build
    cd ../../superset-frontend && npm run build
    cd .. && python scripts/delta.py
    # Hard refresh: Ctrl+Shift+R на :8088

~3 сек вместо 200 MB полного docker cp.

Usage:
    python scripts/delta.py [--max-age-min N] [--container NAME]
"""
import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

CONTAINER_DEFAULT = "superset_app"
MAX_AGE_MIN_DEFAULT = 5
TARGET_DIR = "/app/superset/static/assets"


def _color(code, msg):
    import os, platform
    if platform.system() == "Windows" and not os.environ.get("ANSICON") and not os.environ.get("WT_SESSION"):
        return msg
    return f"\033[{code}m{msg}\033[0m"


def step(msg):  print(_color("36", f"→ {msg}"))
def ok(msg):    print(_color("32", f"✓ {msg}"))
def warn(msg):  print(_color("33", f"! {msg}"))
def err(msg):   print(_color("31", f"✗ {msg}"))


def docker_bin():
    """Резолв docker.exe на Windows (subprocess без shell не находит .exe в PATH иначе)."""
    return shutil.which("docker") or "docker"


def container_running(name):
    """True если `docker ps` показывает контейнер."""
    result = subprocess.run(
        [docker_bin(), "ps", "--format", "{{.Names}}"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if result.returncode != 0:
        err(f"docker ps failed: {result.stderr}")
        sys.exit(1)
    return name in result.stdout.splitlines()


def docker_cp(src, container, dst):
    """docker cp с MSYS_NO_PATHCONV=1 (на Git Bash Windows иначе мангалит пути)."""
    import os
    env = os.environ.copy()
    env["MSYS_NO_PATHCONV"] = "1"
    result = subprocess.run(
        [docker_bin(), "cp", str(src), f"{container}:{dst}"],
        env=env, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if result.returncode != 0:
        err(f"docker cp {src} → {container}:{dst} failed: {result.stderr}")
        return False
    return True


def find_delta_files(assets_dir, max_age_min):
    """Найти .js/.css в assets_dir с mtime > now() - max_age_min."""
    cutoff = time.time() - max_age_min * 60
    delta = []
    for f in assets_dir.iterdir():
        if not f.is_file():
            continue
        if f.suffix not in (".js", ".css"):
            continue
        if f.stat().st_mtime > cutoff:
            delta.append(f)
    return sorted(delta)


def main():
    p = argparse.ArgumentParser(
        description="Delta-deploy frontend bundle в Docker superset_app",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Запускай ПОСЛЕ npm run build плагина и frontend.\n"
            "Если superset_app не запущен — запусти `python scripts/deploy.py setup` "
            "(первый раз) или `python scripts/deploy.py update`."
        ),
    )
    p.add_argument("--max-age-min", type=int, default=MAX_AGE_MIN_DEFAULT,
                   help=f"копировать файлы с mtime < N минут (default: {MAX_AGE_MIN_DEFAULT})")
    p.add_argument("--container", default=CONTAINER_DEFAULT,
                   help=f"имя контейнера (default: {CONTAINER_DEFAULT})")
    args = p.parse_args()

    # Источник: <repo_root>/superset/static/assets/ — собирается webpack'ом.
    # delta.py в <repo_root>/scripts/, так что parent = repo_root.
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    assets = repo_root / "superset" / "static" / "assets"

    if not assets.is_dir():
        err(f"assets dir не найден: {assets}")
        err("Запусти `cd superset-frontend && npm run build` сначала.")
        sys.exit(1)

    if not container_running(args.container):
        err(f"Контейнер '{args.container}' не запущен.")
        err("Запусти сначала:")
        err("  python scripts/deploy.py setup   # первый раз")
        err("  python scripts/deploy.py update  # обновление")
        sys.exit(1)

    step(f"assets: {assets}")
    step(f"container: {args.container}")
    step(f"max-age: {args.max_age_min} min")
    print()

    # 1. manifest.json (всегда)
    manifest = assets / "manifest.json"
    if not manifest.exists():
        err(f"manifest.json не найден: {manifest}")
        sys.exit(1)
    step("[1/2] manifest.json")
    if not docker_cp(manifest, args.container, f"{TARGET_DIR}/manifest.json"):
        sys.exit(1)

    # 2. Delta .js/.css.
    # Копируем ВСЕ свежие — webpack splitChunks даёт много entry/chunk
    # (vendor packages, src splits, DashboardContainer и т.д.), все
    # referenced из spa entry runtime. Фильтр по имени рискует пропустить
    # нужный chunk — копируем по mtime.
    step(f"[2/2] delta files (.js/.css, mtime < {args.max_age_min} min)")
    delta = find_delta_files(assets, args.max_age_min)
    if not delta:
        warn(f"Свежих .js/.css не найдено (последний build > {args.max_age_min} мин назад).")
        warn("Проверь mtime: ls -la superset/static/assets/*.js | head")
        warn("Или собери заново: cd superset-frontend && npm run build")
        sys.exit(0)

    copied = 0
    for f in delta:
        if docker_cp(f, args.container, f"{TARGET_DIR}/{f.name}"):
            print(f"  + {f.name}")
            copied += 1

    print()
    ok(f"Скопировано: {copied} файлов + manifest. Hard refresh (Ctrl+Shift+R) на :8088.")


if __name__ == "__main__":
    main()
