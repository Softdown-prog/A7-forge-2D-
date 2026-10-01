"""Canonical structured broadleaf entry point.

The production implementation lives in structured_broadleaf_scenery_v3.
Keeping this stable module path preserves workers/tests while allowing the
renderer to evolve without reviving the older flat-crown implementation.
"""
from .structured_broadleaf_scenery_v3 import *  # noqa: F401,F403
