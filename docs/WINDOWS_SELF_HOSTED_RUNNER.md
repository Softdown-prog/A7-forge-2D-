# Windows self-hosted runner

This repository is prepared to execute A7 Forge 2D jobs on a Windows self-hosted GitHub Actions runner.

## Runner labels

The workflow targets the default GitHub runner labels:

- `self-hosted`
- `Windows`
- `X64`

## Register the PC

In GitHub open **Settings > Actions > Runners > New self-hosted runner**, select Windows x64, and run the commands GitHub provides on the target PC.

Prefer installing the runner as a Windows service so it is available after reboot.

## Workflow

Run **A7 Forge 2D - Windows Self-Hosted** manually from the Actions tab.

The workflow validates Git, Python and repository checkout first. An optional `run_command` input can execute the Forge's existing command without hard-coding a command before the repository entrypoint is confirmed.

Heavy generation is intentionally routed to the self-hosted Windows machine rather than a GitHub-hosted runner.
