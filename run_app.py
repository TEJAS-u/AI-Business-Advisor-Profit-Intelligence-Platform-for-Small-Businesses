"""
AI CFO Platform Runner
Launches the full-stack SaaS platform on http://127.0.0.1:8000
and automatically opens your browser.
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
import socket
import uvicorn


def free_port(port: int = 8000):
    """Checks if port is in use and frees it cleanly on Windows."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            in_use = s.connect_ex(('127.0.0.1', port)) == 0

        if in_use and sys.platform.startswith('win'):
            # Find PID occupying the port
            cmd = f'netstat -ano | findstr :{port}'
            output = subprocess.check_output(
                cmd, shell=True).decode('utf-8', errors='ignore')
            lines = output.strip().split('\n')
            pids = set()
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5 and f':{port}' in parts[1] and parts[3] == 'LISTENING':
                    pid = parts[4]
                    if pid and pid != '0' and pid != str(os.getpid()):
                        pids.add(pid)

            for pid in pids:
                try:
                    subprocess.run(
                        f'taskkill /F /PID {pid}', shell=True, capture_output=True)
                    time.sleep(0.5)
                except Exception:
                    pass
    except Exception:
        pass


def open_browser():
    time.sleep(1.5)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    # Ensure port 8000 is clean and not blocked by old instances
    free_port(8000)

    backend_dir = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "backend")
    sys.path.insert(0, backend_dir)

    print("=" * 70)
    print("🚀 Starting AI CFO – Business Advisor & Profit Intelligence Platform")
    print("Tagline: Don't just see your numbers. Understand them. Act on them.")
    print("=" * 70)
    print("\n🌐 Full-Stack Application is running at:")
    print("   👉 http://127.0.0.1:8000\n")
    print("📖 API Documentation:")
    print("   👉 http://127.0.0.1:8000/docs\n")
    print("=" * 70)

    # Launch browser automatically
    threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run("main:app", app_dir=backend_dir, host="127.0.0.1", port=8000)
