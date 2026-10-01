"""Canonical structured broadleaf entry point.

The production implementation lives in structured_broadleaf_scenery_v4.
Keeping this stable module path preserves workers/tests while the renderer
continues to evolve.
"""
from .structured_broadleaf_scenery_v4 import *  # noqa: F401,F403
