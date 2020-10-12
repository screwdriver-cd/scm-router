'use strict';

/* eslint-disable no-underscore-dangle */

const chai = require('chai');
const assert = chai.assert;
const mockery = require('mockery');
const sinon = require('sinon');
const testScm = require('./data/testScm');

sinon.assert.expose(chai.assert, { prefix: '' });

describe('index test', () => {
    let Scm;
    let scm;
    let githubScmMock;
    let gitlabScmMock;
    let exampleScmMock;
    const githubPluginOptions = {
        oauthClientId: 'OAUTH_CLIENT_ID',
        oauthClientSecret: 'OAUTH_CLIENT_SECRET',
        username: 'USERNAME',
        email: 'EMAIL',
        secret: 'SECRET',
        privateRepo: false
    };
    const gitlabPluginOptions = {
        privateRepo: true
    };
    const examplePluginOptions = {
        somekey: 'somevalue'
    };
    const initMock = (plugin) => {
        const mock = {};

        [
            'dummyFunction',
            'dummyRejectFunction',
            'addWebhook',
            'addDeployKey',
            'autoDeployKeyGenerationEnabled',
            'parseUrl',
            'parseHook',
            'getCheckoutCommand',
            'decorateUrl',
            'decorateCommit',
            'decorateAuthor',
            'getPermissions',
            'getOrgPermissions',
            'getCommitSha',
            'getCommitRefSha',
            'addPrComment',
            'updateCommitStatus',
            'getFile',
            'getChangedFiles',
            'getOpenedPRs',
            'getPrInfo',
            'getBranchList',
            'openPr',
            'getWebhookEventsMapping'
        ].forEach((method) => {
            mock[method] = sinon.stub().resolves(plugin);
        });
        mock.getBellConfiguration = sinon.stub().resolves({ [plugin]: `${plugin}Bell` });
        mock.stats = sinon.stub().returns({ [plugin]: { requests: plugin } });
        mock.canHandleWebhook = sinon.stub().resolves(true);
        mock.getScmContexts = sinon.stub().returns([`${plugin}.context`]);
        mock.getDisplayName = sinon.stub().returns(plugin);
        mock.autoDeployKeyGenerationEnabled = sinon.stub().returns(plugin);
        mock.getWebhookEventsMapping = sinon.stub().returns({ pr: 'pull_request' });

        return mock;
    };

    before(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(() => {
        githubScmMock = initMock('github');
        githubScmMock.canHandleWebhook.resolves(false);
        gitlabScmMock = initMock('gitlab');
        exampleScmMock = initMock('example');

        mockery.registerMock('screwdriver-scm-base', testScm.getBaseClass());
        mockery.registerMock('screwdriver-scm-github', testScm.createMock(githubScmMock));
        mockery.registerMock('screwdriver-scm-gitlab', testScm.createMock(gitlabScmMock));
        mockery.registerMock('screwdriver-scm-example', testScm.createMock(exampleScmMock));

        // eslint-disable-next-line global-require
        Scm = require('../index');

        scm = new Scm({
            scms: {
                'github.com': {
                    plugin: 'github',
                    config: githubPluginOptions
                },
                'example.com': {
                    plugin: 'example',
                    config: examplePluginOptions
                },
                'gitlab.com': {
                    plugin: 'gitlab',
                    config: gitlabPluginOptions
                }
            }
        });
    });

    afterEach(() => {
        mockery.deregisterAll();
    });

    describe('construction', () => {
        let githubOptions;
        let exampleOptions;
        let gitlabOptions;
        let expectedGithubOptions;
        let expectedExampleOptions;
        let expectedGitlabOptions;

        beforeEach(() => {
            githubOptions = Object.assign(
                githubPluginOptions
            );
            exampleOptions = Object.assign(
                examplePluginOptions
            );
            gitlabOptions = Object.assign(
                gitlabPluginOptions
            );
            expectedGithubOptions = Object.assign(
                githubOptions,
                { displayName: 'github.com' }
            );
            expectedExampleOptions = Object.assign(
                exampleOptions,
                { displayName: 'example.com' }
            );
            expectedGitlabOptions = Object.assign(
                gitlabOptions,
                { displayName: 'gitlab.com' }
            );
        });

        it('throws an error when config does not exist', () => {
            assert.throws(() => {
                scm = new Scm();
            }, Error, 'No scm config passed in.');
        });

        it('does not throws an error when the scm.config does not exist', () => {
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'github.com': {
                            plugin: 'github'
                        }
                    }
                });
            });
        });

        it('throws an error when the scm config not a map', () => {
            assert.throws(() => {
                scm = new Scm({
                    scms: {
                        'github.com': 'value'
                    }
                });
            }, Error, 'No scm config passed in.');
        });

        it('throws an error when the scms config is an empty map', () => {
            assert.throws(() => {
                scm = new Scm({
                    scms: {}
                });
            }, Error, 'No scm config passed in.');
        });

        it('does not throws an error when the config is an empty map', () => {
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'github.com': {
                            plugin: 'github',
                            config: {}
                        }
                    }
                });
            });
        });

        it('throws an error when the config is not a map', () => {
            assert.throws(() => {
                scm = new Scm({
                    scms: {
                        'github.com': {
                            plugin: 'github',
                            config: 'config'
                        }
                    }
                });
            }, Error, 'No scm config passed in.');
        });

        it('does not throw an error when a npm module cannot be registered', () => {
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'DNE.com': {
                            plugin: 'DNE',
                            config: {}
                        },
                        'example.com': {
                            plugin: 'example',
                            config: examplePluginOptions
                        }
                    }
                });
            });
        });

        it('does not throw an error when a module of scm-router module', () => {
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'router.com': {
                            plugin: 'router',
                            config: {}
                        },
                        'example.com': {
                            plugin: 'example',
                            config: examplePluginOptions
                        }
                    }
                });
            });
        });

        it('registers multiple plugins', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, expectedGithubOptions);
            assert.deepEqual(exampleScm.constructorParams, expectedExampleOptions);
            assert.deepEqual(scmGitlab.constructorParams, expectedGitlabOptions);
        });

        it('registers a single plugin', () => {
            scm = new Scm({
                scms: [{
                    plugin: 'example',
                    config: examplePluginOptions
                }]
            });

            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(exampleScm.constructorParams, expectedExampleOptions);
        });

        it('does not throw an error and skip when npm module return empty scmContext', () => {
            githubScmMock.getScmContexts.returns(['']);
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'github.com': {
                            plugin: 'github',
                            config: githubPluginOptions
                        },
                        'example.com': {
                            plugin: 'example',
                            config: examplePluginOptions
                        }
                    }
                });
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.isUndefined(scmGithub);
            assert.isUndefined(scmGitlab);
            assert.deepEqual(exampleScm.constructorParams,
                Object.assign(exampleOptions, { displayName: 'example.com' }));
        });

        it('does not throw an error and skip when getScmContexts return is not a string', () => {
            githubScmMock.getScmContexts.returns([{ somekey: 'github.context' }]);
            assert.doesNotThrow(() => {
                scm = new Scm({
                    scms: {
                        'github.com': {
                            plugin: 'github',
                            config: githubPluginOptions
                        },
                        'example.com': {
                            plugin: 'example',
                            config: examplePluginOptions
                        }
                    }
                });
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.isUndefined(scmGithub);
            assert.isUndefined(scmGitlab);
            assert.deepEqual(exampleScm.constructorParams, expectedExampleOptions);
        });

        it('throw an error when not registered all scm plugins', () => {
            githubScmMock.getScmContexts.returns(['']);
            assert.throws(() => {
                scm = new Scm({
                    scms: {
                        'DNE.com': {
                            plugin: 'DNE',
                            config: {}
                        },
                        'DNE.co.jp': {
                            plugin: 'DNE',
                            config: {}
                        }
                    }
                });
            }, Error, 'No scm config passed in.');
        });
    });

    describe('loadPlugin', () => {
        let githubOptions;
        let exampleOptions;
        let expectedGithubOptions;
        let expectedExampleOptions;

        beforeEach(() => {
            scm = new Scm({
                scms: {
                    'github.com': {
                        plugin: 'github',
                        config: githubPluginOptions
                    }
                }
            });
            githubOptions = Object.assign(
                githubPluginOptions
            );
            exampleOptions = Object.assign(
                examplePluginOptions
            );
            expectedGithubOptions = Object.assign(
                githubOptions,
                { displayName: 'github.com' }
            );
            expectedExampleOptions = Object.assign(
                exampleOptions,
                { displayName: 'example.com' }
            );
        });

        it('register a plugin', () => {
            const config = Object.assign(
                { displayName: 'example.com' },
                examplePluginOptions
            );

            scm.loadPlugin('example', config);

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(scmGithub.constructorParams, expectedGithubOptions);
            assert.deepEqual(exampleScm.constructorParams, expectedExampleOptions);
        });

        it('does not throw an error when a npm module cannot be registered', () => {
            const config = Object.assign(
                { displayName: 'DNE.com' }
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('DNE', config);
            });

            const scmGithub = scm.scms['github.context'];

            assert.deepEqual(scmGithub.constructorParams, expectedGithubOptions);
        });

        it('does not throw an error when scm-router plugin be specified for scms setting', () => {
            const config = Object.assign(
                { displayName: 'example.com' },
                examplePluginOptions
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('router', config);
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, expectedGithubOptions);
            assert.isUndefined(scmGitlab);
            assert.isUndefined(exampleScm);
        });

        it('does not throw an error when npm module return empty scmContext', () => {
            exampleScmMock.getScmContexts.returns(['']);
            const config = Object.assign(
                { displayName: 'example.com' },
                examplePluginOptions
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('example', config);
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, expectedGithubOptions);
            assert.isUndefined(scmGitlab);
            assert.isUndefined(exampleScm);
        });
    });

    describe('chooseWebhookScm', () => {
        const headers = { key: 'headers' };
        const payload = { key: 'payload' };

        it('choose a webhookScm module', () =>
            scm.chooseWebhookScm(headers, payload)
                .then(module => module.dummyFunction(headers, payload))
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(githubScmMock.dummyFunction);
                    assert.notCalled(gitlabScmMock.dummyFunction);
                    assert.calledOnce(exampleScmMock.dummyFunction);
                    assert.calledWith(exampleScmMock.dummyFunction, headers, payload);
                })
        );

        it('reject when not registered appropriate scm plugin', () => {
            scm = new Scm({
                scms: [
                    {
                        plugin: 'github',
                        config: {
                            displayName: 'github.com'
                        }
                    }
                ]
            });

            return scm.chooseWebhookScm(headers, payload)
                .then(module => module.dummyFunction())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.notCalled(githubScmMock.dummyFunction);
                    assert.notCalled(gitlabScmMock.dummyFunction);
                    assert.notCalled(exampleScmMock.dummyFunction);
                    assert.deepEqual(err, new Error('there is no suitable webhook module'));
                });
        });
    });

    describe('chooseScm', () => {
        const config = { scmContext: 'example.context' };

        it('choose a scm module', () =>
            scm.chooseScm(config)
                .then(module => module.dummyFunction(config))
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(githubScmMock.dummyFunction);
                    assert.notCalled(gitlabScmMock.dummyFunction);
                    assert.calledOnce(exampleScmMock.dummyFunction);
                    assert.calledWith(exampleScmMock.dummyFunction, config);
                })
        );

        it('reject when the scmContext config does not exist', () =>
            scm.chooseScm({ somekey: 'somevalue' })
                .then(module => module.dummyFunction())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.deepEqual(err, new Error('Not implemented'));
                })
        );

        it('reject when not registered appropriate scm plugin', () =>
            scm.chooseScm({ scmContext: 'hoge.context' })
                .then(module => module.dummyFunction())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.notCalled(githubScmMock.dummyFunction);
                    assert.notCalled(gitlabScmMock.dummyFunction);
                    assert.notCalled(exampleScmMock.dummyFunction);
                    assert.deepEqual(err, new Error('Not implemented'));
                })
        );
    });

    describe('allScm', () => {
        const config = { scmContext: 'example.context' };
        const bell = { github: 'githubBell', example: 'exampleBell', gitlab: 'gitlabBell' };

        it('call all origin scm module and return conbined', () =>
            scm.allScm(module => module.getBellConfiguration(config))
                .then((result) => {
                    assert.deepEqual(result, bell);
                    assert.calledOnce(githubScmMock.getBellConfiguration);
                    assert.calledWith(githubScmMock.getBellConfiguration, config);
                    assert.calledOnce(exampleScmMock.getBellConfiguration);
                    assert.calledWith(exampleScmMock.getBellConfiguration, config);
                    assert.calledOnce(gitlabScmMock.getBellConfiguration);
                    assert.calledWith(gitlabScmMock.getBellConfiguration, config);
                })
        );

        it('reject when origin 1st scm plugin rejects', () => {
            githubScmMock.getBellConfiguration.rejects('bellreject');

            return scm.allScm(module => module.getBellConfiguration())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.strictEqual(err.name, 'bellreject');
                });
        });
    });

    describe('_addWebhook', () => {
        const config = { scmContext: 'example.context' };

        it('call origin addWebhook', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._addWebhook(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.addWebhook);
                    assert.notCalled(scmGitlab.addWebhook);
                    assert.calledOnce(exampleScm.addWebhook);
                    assert.calledWith(exampleScm.addWebhook, config);
                });
        });
    });

    describe('_addDeployKey', () => {
        const config = { scmContext: 'example.context' };

        it('call origin addDeployKey', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._addDeployKey(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.addDeployKey);
                    assert.notCalled(scmGitlab.addDeployKey);
                    assert.calledOnce(exampleScm.addDeployKey);
                    assert.calledWith(exampleScm.addDeployKey, config);
                });
        });
    });

    describe('_parseUrl', () => {
        const config = { scmContext: 'example.context' };

        it('call origin parseUrl', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._parseUrl(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.parseUrl);
                    assert.notCalled(scmGitlab.parseUrl);
                    assert.calledOnce(exampleScm.parseUrl);
                    assert.calledWith(exampleScm.parseUrl, config);
                });
        });
    });

    describe('_parseHook', () => {
        const headers = { key: 'headers' };
        const payload = { key: 'payload' };

        it('call origin parseHook', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._parseHook(headers, payload)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.parseHook);
                    assert.notCalled(scmGitlab.parseHook);
                    assert.calledOnce(exampleScm.parseHook);
                    assert.calledWith(exampleScm.parseHook, headers, payload);
                });
        });
    });

    describe('_getCheckoutCommand', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getCheckourCommand', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getCheckoutCommand(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getCheckoutCommand);
                    assert.notCalled(scmGitlab.getCheckoutCommand);
                    assert.calledOnce(exampleScm.getCheckoutCommand);
                    assert.calledWith(exampleScm.getCheckoutCommand, config);
                });
        });
    });

    describe('_decorateUrl', () => {
        const config = { scmContext: 'example.context' };

        it('call origin decorateUrl', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._decorateUrl(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.decorateUrl);
                    assert.notCalled(scmGitlab.decorateUrl);
                    assert.calledOnce(exampleScm.decorateUrl);
                    assert.calledWith(exampleScm.decorateUrl, config);
                });
        });
    });

    describe('_decorateCommit', () => {
        const config = { scmContext: 'example.context' };

        it('call origin decorateCommit', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._decorateCommit(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.decorateCommit);
                    assert.notCalled(scmGitlab.decorateCommit);
                    assert.calledOnce(exampleScm.decorateCommit);
                    assert.calledWith(exampleScm.decorateCommit, config);
                });
        });
    });

    describe('_decorateAuthor', () => {
        const config = { scmContext: 'example.context' };

        it('call origin decorateAuthor', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._decorateAuthor(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.decorateAuthor);
                    assert.notCalled(scmGitlab.decorateAuthor);
                    assert.calledOnce(exampleScm.decorateAuthor);
                    assert.calledWith(exampleScm.decorateAuthor, config);
                });
        });
    });

    describe('_getPermissions', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getPermissions', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getPermissions(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getPermissions);
                    assert.notCalled(scmGitlab.getPermissions);
                    assert.calledOnce(exampleScm.getPermissions);
                    assert.calledWith(exampleScm.getPermissions, config);
                });
        });
    });

    describe('_getOrgPermissions', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getOrgPermissions', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getOrgPermissions(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getOrgPermissions);
                    assert.notCalled(scmGitlab.getOrgPermissions);
                    assert.calledOnce(exampleScm.getOrgPermissions);
                    assert.calledWith(exampleScm.getOrgPermissions, config);
                });
        });
    });

    describe('_getCommitSha', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getCommitSha', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getCommitSha(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getCommitSha);
                    assert.notCalled(scmGitlab.getCommitSha);
                    assert.calledOnce(exampleScm.getCommitSha);
                    assert.calledWith(exampleScm.getCommitSha, config);
                });
        });
    });

    describe('_getCommitRefSha', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getCommitRefSha', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getCommitRefSha(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getCommitRefSha);
                    assert.notCalled(scmGitlab.getCommitRefSha);
                    assert.calledOnce(exampleScm.getCommitRefSha);
                    assert.calledWith(exampleScm.getCommitRefSha, config);
                });
        });
    });

    describe('_addPrComment', () => {
        const config = { scmContext: 'example.context' };

        it('call origin addPrComment', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._addPrComment(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.addPrComment);
                    assert.notCalled(scmGitlab.addPrComment);
                    assert.calledOnce(exampleScm.addPrComment);
                    assert.calledWith(exampleScm.addPrComment, config);
                });
        });
    });

    describe('_updateCommitStatus', () => {
        const config = { scmContext: 'example.context' };

        it('call origin updateCommitStatus', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._updateCommitStatus(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.updateCommitStatus);
                    assert.notCalled(scmGitlab.updateCommitStatus);
                    assert.calledOnce(exampleScm.updateCommitStatus);
                    assert.calledWith(exampleScm.updateCommitStatus, config);
                });
        });
    });

    describe('_getFile', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getFile', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getFile(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getFile);
                    assert.notCalled(scmGitlab.getFile);
                    assert.calledOnce(exampleScm.getFile);
                    assert.calledWith(exampleScm.getFile, config);
                });
        });
    });

    describe('_getChangedFiles', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getChangedFiles', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getChangedFiles(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getChangedFiles);
                    assert.notCalled(scmGitlab.getChangedFiles);
                    assert.calledOnce(exampleScm.getChangedFiles);
                    assert.calledWith(exampleScm.getChangedFiles, config);
                });
        });
    });

    describe('_getOpenedPRs', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getOpenedPRs', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getOpenedPRs(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getOpenedPRs);
                    assert.notCalled(scmGitlab.getOpenedPRs);
                    assert.calledOnce(exampleScm.getOpenedPRs);
                    assert.calledWith(exampleScm.getOpenedPRs, config);
                });
        });
    });

    describe('_getBellConfiguration', () => {
        const bell = { github: 'githubBell', example: 'exampleBell', gitlab: 'gitlabBell' };

        it('call origin getBellConfiguration and return combined', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getBellConfiguration()
                .then((result) => {
                    assert.deepEqual(result, bell);
                    assert.calledOnce(scmGithub.getBellConfiguration);
                    assert.calledOnce(exampleScm.getBellConfiguration);
                    assert.calledOnce(scmGitlab.getBellConfiguration);
                });
        });
    });

    describe('_getPrInfo', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getPrInfo', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getPrInfo(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getPrInfo);
                    assert.notCalled(scmGitlab.getPrInfo);
                    assert.calledOnce(exampleScm.getPrInfo);
                    assert.calledWith(exampleScm.getPrInfo, config);
                });
        });
    });

    describe('stats', () => {
        const stats = {
            github: { requests: 'github' },
            example: { requests: 'example' },
            gitlab: { requests: 'gitlab' }
        };

        it('call origin stats', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm.stats();

            assert.deepEqual(result, stats);
            assert.calledOnce(scmGithub.stats);
            assert.calledOnce(scmGitlab.stats);
            assert.calledOnce(exampleScm.stats);
        });
    });

    describe('_getScmContexts', () => {
        const context = ['github.context', 'example.context', 'gitlab.context'];

        it('get registered scm list', () => {
            const result = scm._getScmContexts();

            assert.deepEqual(result, context);
        });
    });

    describe('_canHandleWebhook', () => {
        const headers = { somekey: 'somevalue' };
        const payload = { hogekey: 'hogevalue' };

        it('returns true when desired scm found', () => {
            const exampleScm = scm.scms['example.context'];

            return scm._canHandleWebhook(headers, payload)
                .then((result) => {
                    assert.strictEqual(result, true);
                    assert.calledOnce(exampleScm.canHandleWebhook);
                });
        });

        it('returns true when desired scm not found', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            scmGithub.canHandleWebhook.resolves(false);
            exampleScm.canHandleWebhook.resolves(false);
            scmGitlab.canHandleWebhook.resolves(false);

            return scm._canHandleWebhook(headers, payload)
                .then((result) => {
                    assert.strictEqual(result, false);
                    assert.calledOnce(scmGithub.canHandleWebhook);
                    assert.calledOnce(exampleScm.canHandleWebhook);
                    assert.calledOnce(scmGitlab.canHandleWebhook);
                });
        });
    });

    describe('getDisplayName', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getDisplayName', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm.getDisplayName(config);

            assert.strictEqual(result, 'example');
            assert.notCalled(scmGithub.getDisplayName);
            assert.notCalled(scmGitlab.getDisplayName);
            assert.calledOnce(exampleScm.getDisplayName);
        });
    });

    describe('autoDeployKeyGenerationEnabled', () => {
        const config = { scmContext: 'example.context' };

        it('call origin autoDeployKeyGenerationEnabled', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm.autoDeployKeyGenerationEnabled(config);

            assert.strictEqual(result, 'example');
            assert.notCalled(scmGithub.autoDeployKeyGenerationEnabled);
            assert.notCalled(scmGitlab.autoDeployKeyGenerationEnabled);
            assert.calledOnce(exampleScm.autoDeployKeyGenerationEnabled);
        });
    });

    describe('getWebhookEventsMapping', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getWebhookEventsMapping', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm._getWebhookEventsMapping(config);

            assert.deepEqual(result, { pr: 'pull_request' });
            assert.notCalled(scmGithub.getWebhookEventsMapping);
            assert.notCalled(scmGitlab.getWebhookEventsMapping);
            assert.calledOnce(exampleScm.getWebhookEventsMapping);
        });
    });

    describe('_getBranchList', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getBranchList', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._getBranchList(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.getBranchList);
                    assert.notCalled(scmGitlab.getBranchList);
                    assert.calledOnce(exampleScm.getBranchList);
                    assert.calledWith(exampleScm.getBranchList, config);
                });
        });
    });

    describe('_openPr', () => {
        const config = {
            checkoutUrl: 'git@github.com:screwdriver-cd/scm-github.git#master',
            token: 'thisisatoken',
            files: [{
                name: 'file.txt',
                content: 'content'
            }, {
                name: 'file2.txt',
                content: 'content'
            }],
            title: 'update file',
            message: 'update file',
            scmContext: 'example.context'
        };

        it('call origin openPr', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._openPr(config)
                .then((result) => {
                    assert.strictEqual(result, 'example');
                    assert.notCalled(scmGithub.openPr);
                    assert.notCalled(scmGitlab.openPr);
                    assert.calledOnce(exampleScm.openPr);
                    assert.calledWith(exampleScm.openPr, config);
                });
        });
    });
});
