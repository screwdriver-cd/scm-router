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
    const ecosystem = {
        api: 'http://api.com',
        store: 'http://store.com'
    };
    const githubPluginOptions = {
        displayName: 'github.com',
        oauthClientId: 'OAUTH_CLIENT_ID',
        oauthClientSecret: 'OAUTH_CLIENT_SECRET',
        username: 'USERNAME',
        email: 'EMAIL',
        secret: 'SECRET',
        privateRepo: false
    };
    const gitlabPluginOptions = {
        displayName: 'gitlab.com',
        privateRepo: true
    };
    const examplePluginOptions = {
        displayName: 'example.com',
        somekey: 'somevalue'
    };
    const initMock = (plugin) => {
        const mock = {};

        [
            'dummyFunction',
            'dummyRejectFunction',
            'addWebhook',
            'parseUrl',
            'parseHook',
            'getCheckoutCommand',
            'decorateUrl',
            'decorateCommit',
            'decorateAuthor',
            'getPermissions',
            'getCommitSha',
            'updateCommitStatus',
            'getFile',
            'getOpenedPRs',
            'getPrInfo'
        ].forEach((method) => {
            mock[method] = sinon.stub().resolves(plugin);
        });
        mock.getBellConfiguration = sinon.stub().resolves({ [plugin]: `${plugin}Bell` });
        mock.stats = sinon.stub().returns({ [plugin]: { requests: plugin } });
        mock.canHandleWebhook = sinon.stub().resolves(true);
        mock.getScmContexts = sinon.stub().returns([`${plugin}.context`]);
        mock.getDisplayName = sinon.stub().returns(plugin);

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

        mockery.registerMock('screwdriver-scm-github', testScm(githubScmMock));
        mockery.registerMock('screwdriver-scm-gitlab', testScm(gitlabScmMock));
        mockery.registerMock('screwdriver-scm-example', testScm(exampleScmMock));

        // eslint-disable-next-line global-require
        Scm = require('../index');

        scm = new Scm({
            ecosystem,
            scms: [
                {
                    plugin: 'github',
                    config: githubPluginOptions
                },
                {
                    plugin: 'example',
                    config: examplePluginOptions
                },
                {
                    plugin: 'gitlab',
                    config: gitlabPluginOptions
                }
            ]
        });
    });

    afterEach(() => {
        mockery.deregisterAll();
    });

    describe('construction', () => {
        let githubOptions;
        let exampleOptions;
        let gitlabOptions;

        beforeEach(() => {
            githubOptions = Object.assign(
                { ecosystem },
                githubPluginOptions
            );
            exampleOptions = Object.assign(
                { ecosystem },
                examplePluginOptions
            );
            gitlabOptions = Object.assign(
                { ecosystem },
                gitlabPluginOptions
            );
        });

        it('throws an error when config does not exist', () => {
            assert.throws(() => {
                scm = new Scm();
            }, Error, 'No scm config passed in.');
        });

        it('throws an error when the scms config does not exist', () => {
            assert.throws(() => {
                scm = new Scm({ ecosystem });
            }, Error, 'No scm config passed in.');
        });

        it('throws an error when the scms config is not an array', () => {
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: {
                        plugin: 'github',
                        config: githubPluginOptions
                    }
                });
            }, Error, 'No scm config passed in.');
        });

        it('throws an error when the scms config is an empty array', () => {
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: []
                });
            }, Error, 'No scm config passed in.');
        });

        it('throws an error when the displayName config does not exist', () => {
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: {}
                    }]
                });
            }, Error, 'Display name not specified for github scm plugin');
        });

        it('throws an error when the config is not a map', () => {
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: 'config'
                    }]
                });
            }, Error, 'Display name not specified for github scm plugin');
        });

        it('throw an error when a npm module cannot be registered', () => {
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'DNE',
                        config: {
                            displayName: 'DNE.com'
                        }
                    },
                    {
                        plugin: 'example',
                        config: examplePluginOptions
                    }]
                });
            }, Error, 'Cannot find module \'screwdriver-scm-DNE\'');
        });

        it('registers multiple plugins', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
            assert.deepEqual(scmGitlab.constructorParams, gitlabOptions);
        });

        it('registers a single plugin', () => {
            scm = new Scm({
                ecosystem,
                scms: [{
                    plugin: 'example',
                    config: examplePluginOptions
                }]
            });

            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error and skip when npm module return empty scmContext', () => {
            githubScmMock.getScmContexts.returns(['']);
            assert.doesNotThrow(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: {
                            githubPluginOptions,
                            displayName: 'github.com'
                        }
                    },
                    {
                        plugin: 'example',
                        config: examplePluginOptions
                    }]
                });
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.equal(scmGithub, null);
            assert.equal(scmGitlab, null);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error and skip when getScmContexts return is not a string', () => {
            githubScmMock.getScmContexts.returns([{ somekey: 'github.context' }]);
            assert.doesNotThrow(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: {
                            githubPluginOptions,
                            displayName: 'github.com'
                        }
                    },
                    {
                        plugin: 'example',
                        config: examplePluginOptions
                    }]
                });
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.equal(scmGithub, null);
            assert.equal(scmGitlab, null);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error and not overwrited when duplicate scm plugins', () => {
            assert.doesNotThrow(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'example',
                        config: examplePluginOptions
                    },
                    {
                        plugin: 'example',
                        config: {
                            displayName: 'hoge'
                        }
                    }]
                });
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.equal(scmGithub, null);
            assert.equal(scmGitlab, null);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('throw an error when not registered all scm plugins', () => {
            githubScmMock.getScmContexts.returns(['']);
            assert.throws(() => {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: {
                            displayName: 'github.com'
                        }
                    },
                    {
                        plugin: 'github',
                        config: {
                            displayName: 'github.com'
                        }
                    }]
                });
            }, Error, 'No scm config passed in.');
        });
    });

    describe('loadPlugin', () => {
        let githubOptions;
        let exampleOptions;

        beforeEach(() => {
            githubOptions = Object.assign(
                { ecosystem },
                githubPluginOptions
            );
            exampleOptions = Object.assign(
                { ecosystem },
                examplePluginOptions
            );
            scm = new Scm({
                ecosystem,
                scms: [{
                    plugin: 'github',
                    config: githubPluginOptions
                }]
            });
        });

        it('register a plugin', () => {
            const config = Object.assign(
                { ecosystem },
                { displayName: 'example.com' },
                examplePluginOptions
            );

            scm.loadPlugin('example', config);

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('throw an error when a npm module cannot be registered', () => {
            const config = Object.assign(
                { ecosystem },
                { displayName: 'DNE.com' }
            );

            assert.throws(() => {
                scm.loadPlugin('DNE', config);
            }, Error, 'Cannot find module \'screwdriver-scm-DNE\'');

            const scmGithub = scm.scms['github.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
        });

        it('does not throw an error when scm-router plugin be specified for scms setting', () => {
            const config = Object.assign(
                { ecosystem },
                { displayName: 'example.com' },
                examplePluginOptions
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('router', config);
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.equal(scmGitlab, null);
            assert.equal(exampleScm, null);
        });

        it('does not throw an error when npm module return empty scmContext', () => {
            exampleScmMock.getScmContexts.returns(['']);
            const config = Object.assign(
                { ecosystem },
                { displayName: 'example.com' },
                examplePluginOptions
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('example', config);
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.equal(scmGitlab, null);
            assert.equal(exampleScm, null);
        });

        it('does not throw an error and overwrite when duplicate scm plugins', () => {
            githubOptions = Object.assign(
                { displayName: 'my.github.com' },
                githubOptions
            );
            const configDummy = {
                displayName: 'hoge.com'
            };
            const config = Object.assign(
                { ecosystem },
                { displayName: 'my.github.com' },
                githubPluginOptions
            );

            assert.doesNotThrow(() => {
                scm.loadPlugin('github', configDummy);
                scm.loadPlugin('github', config);
            });

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.equal(scmGitlab, null);
            assert.equal(exampleScm, null);
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
                    assert.strictEqual(err, 'there is no suitable webhook module');
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
                    assert.strictEqual(err, 'Not implemented');
                })
        );

        it('reject when not registered appropriate scm plugin', () =>
            scm.chooseScm({ scmContext: 'hoge.cotext' })
                .then(module => module.dummyFunction())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.notCalled(githubScmMock.dummyFunction);
                    assert.notCalled(gitlabScmMock.dummyFunction);
                    assert.notCalled(exampleScmMock.dummyFunction);
                    assert.strictEqual(err, 'Not implemented');
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
            githubScmMock.getBellConfiguration.rejects('bell reject');

            return scm.allScm(module => module.getBellConfiguration())
                .then(() => {
                    assert.fail();
                }, (err) => {
                    assert.equal(err, 'bell reject');
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

        it('call origin getPermissons', () => {
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

        it('call origin canHandleWebhook', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._canHandleWebhook(headers, payload)
                .then((result) => {
                    assert.strictEqual(result, true);
                    assert.called(scmGithub.canHandleWebhook);
                    assert.calledWith(scmGithub.canHandleWebhook, headers, payload);
                    assert.notCalled(scmGitlab.canHandleWebhook);
                    assert.called(exampleScm.canHandleWebhook);
                    assert.calledWith(exampleScm.canHandleWebhook, headers, payload);
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
});
