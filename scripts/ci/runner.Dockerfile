FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive RUNNER_ALLOW_RUNASROOT=1 ImageOS=ubuntu24
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git jq rsync tar unzip xz-utils ffmpeg python3 python3-venv \
    sudo procps libicu74 libkrb5-3 libssl3t64 zlib1g liblttng-ust1t64 \
    && rm -rf /var/lib/apt/lists/*
COPY runner.tar.gz /tmp/runner.tar.gz
WORKDIR /runner
RUN tar -xzf /tmp/runner.tar.gz && rm /tmp/runner.tar.gz
COPY runner-policy.py /usr/local/lib/lhs-runner/runner-policy.py
COPY runner-entrypoint.sh /usr/local/bin/lhs-runner-entrypoint
COPY runner-cleanup.sh /usr/local/bin/lhs-runner-cleanup.sh
COPY runner-admission.sh /usr/local/bin/lhs-runner-admission.sh
RUN chmod 0755 /usr/local/bin/lhs-runner-*
ENV ACTIONS_RUNNER_HOOK_JOB_STARTED=/usr/local/bin/lhs-runner-admission.sh \
    ACTIONS_RUNNER_HOOK_JOB_COMPLETED=/usr/local/bin/lhs-runner-cleanup.sh
ENTRYPOINT ["/usr/local/bin/lhs-runner-entrypoint"]
