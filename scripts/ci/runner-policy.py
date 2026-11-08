#!/usr/bin/env python3
"""Routing and job admission for the isolated LHS runner. No host privileges."""
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

REPOSITORY = 'Softdown-prog/A7-forge-2D-'
LABELS = ['self-hosted', 'Linux', 'lhs-vps-isolated']


def vps_enabled(env):
    """GitHub-hosted runners are the default. The isolated VPS runner is used only while the repository
    variable LHS_USE_VPS_RUNNER is exactly 'true' (Settings > Secrets and variables > Actions > Variables);
    deleting it or setting anything else sends every job back to GitHub with no code change."""
    return env.get('LHS_USE_VPS_RUNNER', '').strip().lower() == 'true'


def admitted(env):
    if env.get('GITHUB_REPOSITORY', '').casefold() != REPOSITORY.casefold():
        return False
    event, ref = env.get('GITHUB_EVENT_NAME'), env.get('GITHUB_REF')
    if event == 'push' and ref == 'refs/heads/main':
        return True
    return (event == 'workflow_dispatch'
            and env.get('GITHUB_ACTOR', '').casefold() == 'softdown-prog'
            and env.get('GITHUB_TRIGGERING_ACTOR', env.get('GITHUB_ACTOR', '')).casefold() == 'softdown-prog')


def choose(env, evidence, now=None):
    hosted = [env.get('HOSTED_LABEL', 'ubuntu-24.04')]
    if not vps_enabled(env) or not admitted(env) or env.get('REQUIRES_DOCKER', 'false') == 'true':
        return hosted
    now = time.time() if now is None else now
    if isinstance(evidence, dict) and isinstance(evidence.get('runners'), list):
        online = any(r.get('status') == 'online' and
                     set(LABELS).issubset({x.get('name') for x in r.get('labels', [])})
                     for r in evidence['runners'])
    else:
        stamp = evidence.get('checkedAt') if isinstance(evidence, dict) else None
        online = (isinstance(stamp, (int, float)) and not isinstance(stamp, bool)
                  and 0 <= now - stamp <= 90 and evidence.get('healthy') is True)
    return LABELS if online else hosted


def probe(secret):
    if '-----BEGIN OPENSSH PRIVATE KEY-----' in secret:
        with tempfile.TemporaryDirectory(prefix='lhs-runner-probe-') as folder:
            key = Path(folder) / 'key'
            # gh on Windows can serialize stdin with CRLF; OpenSSH requires LF.
            key.write_bytes(secret.replace('\r\n', '\n').strip().encode('utf-8') + b'\n')
            key.chmod(0o600)
            host_keys = Path(__file__).with_name('lhs-vps-known-hosts')
            completed = subprocess.run([
                'ssh', '-T', '-i', str(key), '-o', 'BatchMode=yes',
                '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
                '-o', f'UserKnownHostsFile={host_keys}', '-o', 'ConnectTimeout=5',
                '-o', 'ConnectionAttempts=1', 'lhsstatus@164.163.9.7', 'status'
            ], capture_output=True, timeout=12, check=True)
            if len(completed.stdout) > 8192:
                raise ValueError('Invalid status size')
            return json.loads(completed.stdout)
    request = urllib.request.Request(
        f'https://api.github.com/repos/{REPOSITORY}/actions/runners?per_page=100',
        headers={'Authorization': 'Bearer ' + secret,
                 'Accept': 'application/vnd.github+json', 'User-Agent': 'lhs-runner-router'})
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read(1024 * 1024))


def main():
    if '--guard' in sys.argv:
        if not admitted(os.environ):
            print('LHS runner refused this event; PRs and untrusted refs use GitHub-hosted.', file=sys.stderr)
            return 1
        print('LHS runner admission accepted.')
        return 0
    evidence = None
    # Do not even probe from PRs, another repository or Docker-only workflows.
    if vps_enabled(os.environ) and admitted(os.environ) and os.environ.get('REQUIRES_DOCKER', 'false') != 'true':
        secret = os.environ.get('STATUS_TOKEN', '').strip()
        if secret:
            try:
                evidence = probe(secret)
            except Exception as error:
                kind = type(error).__name__
                if isinstance(error, subprocess.CalledProcessError):
                    diagnostic = (error.stderr or b'').decode(errors='replace').lower()
                    for text, label in [('permission denied', 'ssh-authentication'),
                                        ('host key verification failed', 'ssh-host-identity'),
                                        ('no matching host key', 'ssh-host-algorithm'),
                                        ('error in libcrypto', 'ssh-key-format'),
                                        ('connection refused', 'ssh-refused'),
                                        ('connection timed out', 'ssh-timeout')]:
                        if text in diagnostic:
                            kind = label
                            break
                # Report only a category, never token material, commands or stderr.
                print(f'::notice::Runner probe unavailable ({kind}); selecting GitHub-hosted.')
    if not vps_enabled(os.environ):
        print("::notice::VPS runner is off (repository variable LHS_USE_VPS_RUNNER is not 'true'); using GitHub-hosted.")
    labels = choose(os.environ, evidence)
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
        output.write('runner_labels=' + json.dumps(labels, separators=(',', ':')) + '\n')
    print('Selected runner: ' + ', '.join(labels))
    return 0


if __name__ == '__main__':
    sys.exit(main())
