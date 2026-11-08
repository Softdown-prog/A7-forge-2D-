import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('policy', Path(__file__).with_name('runner-policy.py'))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class RunnerPolicyTests(unittest.TestCase):
    def setUp(self):
        self.env = dict(GITHUB_REPOSITORY=policy.REPOSITORY, GITHUB_EVENT_NAME='push',
                        GITHUB_REF='refs/heads/main', HOSTED_LABEL='ubuntu-latest')
        self.healthy = dict(healthy=True, checkedAt=1000)

    def test_main_online_uses_isolated_runner(self):
        self.assertEqual(policy.choose(self.env, self.healthy, 1030), policy.LABELS)

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


if __name__ == '__main__':
    unittest.main()
