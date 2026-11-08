#!/usr/bin/env python3
"""Host-only fixed probe. Writes no credentials and accepts no command input."""
import json
import os
import subprocess
import time
from pathlib import Path

result = {'healthy': False, 'checkedAt': int(time.time()), 'runner': 'lhs-vps-isolated'}
try:
    data = json.loads(subprocess.check_output(
        ['docker', 'inspect', 'lhs-ci-runner'], timeout=5))[0]
    result['healthy'] = (data['State']['Running'] is True
                         and data['State'].get('Health', {}).get('Status') == 'healthy')
except Exception:
    pass
path = Path('/run/lhs-runner/health.json')
temporary = path.with_suffix('.next')
temporary.write_text(json.dumps(result), encoding='utf-8')
temporary.chmod(0o644)
os.replace(temporary, path)
