import importlib.util
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from pathlib import Path

spec = importlib.util.spec_from_file_location('policy', Path(__file__).with_name('runner-policy.py'))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class RunnerPolicyTests(unittest.TestCase):
    def setUp(self):
        self.env = dict(GITHUB_REPOSITORY=policy.REPOSITORY, GITHUB_EVENT_NAME='push',
                        GITHUB_REF='refs/heads/main', HOSTED_LABEL='ubuntu-latest',
                        LHS_USE_VPS_RUNNER='true')
        self.healthy = dict(healthy=True, checkedAt=1000)

    def test_main_online_uses_isolated_runner(self):
        self.assertEqual(policy.choose(self.env, self.healthy, 1030), policy.LABELS)

    def test_github_hosted_is_the_default_until_the_vps_switch_is_on(self):
        for value in (None, '', 'false', '0', 'yes', 'TRUEISH'):
            env = {k: v for k, v in self.env.items() if k != 'LHS_USE_VPS_RUNNER'}
            if value is not None:
                env['LHS_USE_VPS_RUNNER'] = value
            self.assertFalse(policy.vps_enabled(env), repr(value))
            self.assertEqual(policy.choose(env, self.healthy, 1030), ['ubuntu-latest'], repr(value))
        self.assertTrue(policy.vps_enabled(self.env | {'LHS_USE_VPS_RUNNER': ' True '}))
        self.assertEqual(policy.choose(self.env | {'LHS_USE_VPS_RUNNER': ' True '}, self.healthy, 1030), policy.LABELS)

    def test_the_switch_does_not_weaken_the_admission_guard(self):
        # The guard that protects the VPS runner itself is independent of the routing switch.
        env = {k: v for k, v in self.env.items() if k != 'LHS_USE_VPS_RUNNER'}
        self.assertTrue(policy.admitted(env))
        self.assertFalse(policy.admitted(env | {'GITHUB_EVENT_NAME': 'pull_request'}))

    def test_missing_offline_stale_future_invalid_fall_back(self):
        for evidence in (None, {}, {'healthy': False, 'checkedAt': 1000},
                         {'healthy': True, 'checkedAt': 900},
                         {'healthy': True, 'checkedAt': 1100},
                         {'healthy': True, 'checkedAt': True}):
            self.assertEqual(policy.choose(self.env, evidence, 1030), ['ubuntu-latest'])

    def test_pr_forks_and_branch_push_never_reach_vps(self):
        for values in ({'GITHUB_EVENT_NAME': 'pull_request'},
                       {'GITHUB_EVENT_NAME': 'pull_request_target'},
                       {'GITHUB_REPOSITORY': 'someone/fork'},
                       {'GITHUB_REF': 'refs/heads/unreviewed'}):
            self.assertEqual(policy.choose(self.env | values, self.healthy, 1030), ['ubuntu-latest'])

    def test_docker_workflows_use_hosted(self):
        self.assertEqual(policy.choose(self.env | {'REQUIRES_DOCKER': 'true'}, self.healthy, 1030), ['ubuntu-latest'])

    def test_manual_dispatch_requires_owner_including_rerun(self):
        self.env.update(GITHUB_EVENT_NAME='workflow_dispatch', GITHUB_ACTOR='Softdown-prog')
        self.assertTrue(policy.admitted(self.env))
        self.assertFalse(policy.admitted(self.env | {'GITHUB_ACTOR': 'outsider'}))
        self.assertFalse(policy.admitted(self.env | {'GITHUB_TRIGGERING_ACTOR': 'outsider'}))

    def test_api_requires_isolated_label_not_legacy_runner(self):
        evidence = {'runners': [{'status': 'online', 'busy': True,
                                'labels': [{'name': name} for name in policy.LABELS]}]}
        self.assertEqual(policy.choose(self.env, evidence), policy.LABELS)
        evidence['runners'][0]['labels'][-1]['name'] = 'lhs-vps'
        self.assertEqual(policy.choose(self.env, evidence), ['ubuntu-latest'])

    def test_ssh_key_transferred_from_windows_is_normalized_to_lf(self):
        key = '-----BEGIN OPENSSH PRIVATE KEY-----\r\nexample\r\n-----END OPENSSH PRIVATE KEY-----\r\n'
        def ssh(args, **options):
            material = Path(args[args.index('-i') + 1]).read_bytes()
            self.assertNotIn(b'\r', material)
            self.assertTrue(material.endswith(b'\n'))
            self.assertIn('StrictHostKeyChecking=yes', args)
            return SimpleNamespace(stdout=b'{"healthy":true,"checkedAt":1000}')
        with patch.object(policy.subprocess, 'run', side_effect=ssh):
            self.assertTrue(policy.probe(key)['healthy'])


if __name__ == '__main__':
    unittest.main()
