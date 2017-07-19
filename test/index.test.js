'use strict';

/* eslint-disable no-underscore-dangle */

const chai = require('chai');
const assert = chai.assert;
const mockery = require('mockery');
const sinon = require('sinon');
const testScm = require('./data/testScm');
const sinonStubPromise = require('sinon-stub-promise');

sinon.assert.expose(chai.assert, { prefix: '' });
sinonStubPromise(sinon);

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

    before(() => {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(() => {
        githubScmMock = {
            dummyFunction: sinon.stub(),
            dummyRejectFunction: sinon.stub(),
            addWebhook: sinon.stub(),
            parseUrl: sinon.stub(),
            parseHook: sinon.stub(),
            getCheckoutCommand: sinon.stub(),
            decorateUrl: sinon.stub(),
            decorateCommit: sinon.stub(),
            decorateAuthor: sinon.stub(),
            getPermissions: sinon.stub(),
            getCommitSha: sinon.stub(),
            updateCommitStatus: sinon.stub(),
            getFile: sinon.stub(),
            getOpenedPRs: sinon.stub(),
            getBellConfiguration: sinon.stub(),
            getPrInfo: sinon.stub(),
            canHandleWebhook: sinon.stub(),
            getScmContexts: sinon.stub(),
            getDisplayName: sinon.stub()
        };
        githubScmMock.dummyFunction.returnsPromise().resolves('github');
        githubScmMock.dummyRejectFunction.returnsPromise().rejects('github');
        githubScmMock.addWebhook.returnsPromise().resolves('github');
        githubScmMock.parseUrl.returnsPromise().resolves('github');
        githubScmMock.parseHook.returnsPromise().resolves('github');
        githubScmMock.getCheckoutCommand.returnsPromise().resolves('github');
        githubScmMock.decorateUrl.returnsPromise().resolves('github');
        githubScmMock.decorateCommit.returnsPromise().resolves('github');
        githubScmMock.decorateAuthor.returnsPromise().resolves('github');
        githubScmMock.getPermissions.returnsPromise().resolves('github');
        githubScmMock.getCommitSha.returnsPromise().resolves('github');
        githubScmMock.updateCommitStatus.returnsPromise().resolves('github');
        githubScmMock.getFile.returnsPromise().resolves('github');
        githubScmMock.getOpenedPRs.returnsPromise().resolves('github');
        githubScmMock.getBellConfiguration.returnsPromise().resolves({ github: 'githubBell' });
        githubScmMock.getPrInfo.returnsPromise().resolves('github');
        githubScmMock.canHandleWebhook.returnsPromise().rejects('cannot handle');
        githubScmMock.getScmContexts.returns(['github.context']);
        githubScmMock.getDisplayName.returns('github');
        gitlabScmMock = {
            dummyFunction: sinon.stub(),
            dummyRejectFunction: sinon.stub(),
            addWebhook: sinon.stub(),
            parseUrl: sinon.stub(),
            parseHook: sinon.stub(),
            getCheckoutCommand: sinon.stub(),
            decorateUrl: sinon.stub(),
            decorateCommit: sinon.stub(),
            decorateAuthor: sinon.stub(),
            getPermissions: sinon.stub(),
            getCommitSha: sinon.stub(),
            updateCommitStatus: sinon.stub(),
            getFile: sinon.stub(),
            getOpenedPRs: sinon.stub(),
            getBellConfiguration: sinon.stub(),
            getPrInfo: sinon.stub(),
            canHandleWebhook: sinon.stub(),
            getScmContexts: sinon.stub(),
            getDisplayName: sinon.stub()
        };
        gitlabScmMock.dummyFunction.returnsPromise().resolves('gitlab');
        gitlabScmMock.dummyRejectFunction.returnsPromise().rejects('github');
        gitlabScmMock.addWebhook.returnsPromise().resolves('gitlab');
        gitlabScmMock.parseUrl.returnsPromise().resolves('gitlab');
        gitlabScmMock.parseHook.returnsPromise().resolves('gitlab');
        gitlabScmMock.getCheckoutCommand.returnsPromise().resolves('gitlab');
        gitlabScmMock.decorateUrl.returnsPromise().resolves('gitlab');
        gitlabScmMock.decorateCommit.returnsPromise().resolves('gitlab');
        gitlabScmMock.decorateAuthor.returnsPromise().resolves('gitlab');
        gitlabScmMock.getPermissions.returnsPromise().resolves('gitlab');
        gitlabScmMock.getCommitSha.returnsPromise().resolves('gitlab');
        gitlabScmMock.updateCommitStatus.returnsPromise().resolves('gitlab');
        gitlabScmMock.getFile.returnsPromise().resolves('gitlab');
        gitlabScmMock.getOpenedPRs.returnsPromise().resolves('gitlab');
        gitlabScmMock.getBellConfiguration.returnsPromise().resolves({ gitlab: 'gitlabBell' });
        gitlabScmMock.getPrInfo.returnsPromise().resolves('gitlab');
        gitlabScmMock.canHandleWebhook.returnsPromise().resolves('can handle');
        gitlabScmMock.getScmContexts.returns(['gitlab.context']);
        gitlabScmMock.getDisplayName.returns('gitlab');
        exampleScmMock = {
            dummyFunction: sinon.stub(),
            dummyRejectFunction: sinon.stub(),
            addWebhook: sinon.stub(),
            parseUrl: sinon.stub(),
            parseHook: sinon.stub(),
            getCheckoutCommand: sinon.stub(),
            decorateUrl: sinon.stub(),
            decorateCommit: sinon.stub(),
            decorateAuthor: sinon.stub(),
            getPermissions: sinon.stub(),
            getCommitSha: sinon.stub(),
            updateCommitStatus: sinon.stub(),
            getFile: sinon.stub(),
            getOpenedPRs: sinon.stub(),
            getBellConfiguration: sinon.stub(),
            getPrInfo: sinon.stub(),
            canHandleWebhook: sinon.stub(),
            getScmContexts: sinon.stub(),
            getDisplayName: sinon.stub()
        };
        exampleScmMock.dummyFunction.returnsPromise().resolves('example');
        exampleScmMock.dummyRejectFunction.returnsPromise().rejects('github');
        exampleScmMock.addWebhook.returnsPromise().resolves('example');
        exampleScmMock.parseUrl.returnsPromise().resolves('example');
        exampleScmMock.parseHook.returnsPromise().resolves('example');
        exampleScmMock.getCheckoutCommand.returnsPromise().resolves('example');
        exampleScmMock.decorateUrl.returnsPromise().resolves('example');
        exampleScmMock.decorateCommit.returnsPromise().resolves('example');
        exampleScmMock.decorateAuthor.returnsPromise().resolves('example');
        exampleScmMock.getPermissions.returnsPromise().resolves('example');
        exampleScmMock.getCommitSha.returnsPromise().resolves('example');
        exampleScmMock.updateCommitStatus.returnsPromise().resolves('example');
        exampleScmMock.getFile.returnsPromise().resolves('example');
        exampleScmMock.getOpenedPRs.returnsPromise().resolves('example');
        exampleScmMock.getBellConfiguration.returnsPromise().resolves({ example: 'exampleBell' });
        exampleScmMock.getPrInfo.returnsPromise().resolves('example');
        exampleScmMock.canHandleWebhook.returnsPromise().resolves('can handle');
        exampleScmMock.getScmContexts.returns(['example.context']);
        exampleScmMock.getDisplayName.returns('example');

        mockery.registerMock('screwdriver-scm-github', testScm(githubScmMock));
        mockery.registerMock('screwdriver-scm-gitlab', testScm(gitlabScmMock));
        mockery.registerMock('screwdriver-scm-example', testScm(exampleScmMock));

        // eslint-disable-next-line global-require
        Scm = require('../index');

        scm = new Scm({
            ecosystem,
            scm: {
                plugin: 'github',
                github: githubPluginOptions
            },
            scms: [
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
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm();
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
        });

        it('throws an error when the scms config does not exist', () => {
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm({ ecosystem });
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
        });

        it('throws an error when the scms config is not an array', () => {
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm({
                    ecosystem,
                    scms: {
                        plugin: 'github',
                        config: githubPluginOptions
                    }
                });
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
        });

        it('throws an error when the scms config is an empty array', () => {
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm({
                    ecosystem,
                    scms: []
                });
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
        });

        it('throws an error when the displayName config does not exist', () => {
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'github',
                        config: githubPluginOptions
                    }]
                });
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
        });

        it('does not throw an error when a npm module cannot be registered', () => {
            try {
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
            } catch (err) {
                assert.fail(err);
            }
        });

        it('registers a single plugin in scm', () => {
            try {
                scm = new Scm({
                    ecosystem,
                    scm: {
                        plugin: 'github',
                        github: githubPluginOptions
                    }
                });
            } catch (err) {
                assert.fail(err);
            }

            const scmGithub = scm.scms['github.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
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
            try {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'example',
                        config: examplePluginOptions
                    }]
                });
            } catch (err) {
                assert.fail(err);
            }

            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error and skip when npm module return empty scmContext', () => {
            githubScmMock.getScmContexts.returns(['']);
            try {
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
            } catch (err) {
                assert.fail(err);
            }

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.equal(scmGithub, null);
            assert.equal(scmGitlab, null);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error and overwrite when duplicate scm plugins', () => {
            try {
                scm = new Scm({
                    ecosystem,
                    scm: {
                        plugin: 'example'
                    },
                    scms: [{
                        plugin: 'example',
                        config: {
                            displayName: 'hoge'
                        }
                    },
                    {
                        plugin: 'example',
                        config: examplePluginOptions
                    }]
                });
            } catch (err) {
                assert.fail(err);
            }

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.equal(scmGithub, null);
            assert.equal(scmGitlab, null);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('throw an error when not registered all scm plugins', () => {
            const error = new Error('No scm config passed in.');

            try {
                scm = new Scm({
                    ecosystem,
                    scms: [{
                        plugin: 'DNE',
                        config: {
                            displayName: 'DNE.com'
                        }
                    },
                    {
                        plugin: 'DNE',
                        config: {
                            displayName: 'DNE.com'
                        }
                    }]
                });
            } catch (err) {
                assert.strictEqual(err.message, error.message);

                return;
            }
            assert.fail();
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
                scm: {
                    plugin: 'github',
                    github: githubPluginOptions
                }
            });
        });

        it('register a plugin', () => {
            const config = Object.assign(
                { ecosystem },
                { displayName: 'example.com' },
                examplePluginOptions
            );

            try {
                scm.loadPlugin('example', config);
            } catch (err) {
                assert.fail(err);
            }

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.deepEqual(exampleScm.constructorParams, exampleOptions);
        });

        it('does not throw an error when a npm module cannot be registered', () => {
            const config = Object.assign(
                { ecosystem },
                { displayName: 'DNE.com' }
            );

            try {
                scm.loadPlugin('DNE', config);
            } catch (err) {
                assert.fail(err);
            }
            const scmGithub = scm.scms['github.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
        });

        it('does not throw an error when npm module return empty scmContext', () => {
            exampleScmMock.getScmContexts.returns(['']);
            const config = Object.assign(
                { ecosystem },
                { displayName: 'example.com' },
                examplePluginOptions
            );

            try {
                scm.loadPlugin('example', config);
            } catch (err) {
                assert.fail(err);
            }

            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            assert.deepEqual(scmGithub.constructorParams, githubOptions);
            assert.equal(scmGitlab, null);
            assert.equal(exampleScm, null);
        });

        it('does not throw an error and overwrite when duplicate scm plugins', () => {
            githubOptions = Object.assign(
                githubOptions,
                { displayName: 'my.github.com' }
            );
            const configDummy = {
                displayName: 'hoge.com'
            };
            const config = Object.assign(
                { ecosystem },
                { displayName: 'my.github.com' },
                githubPluginOptions
            );

            try {
                scm.loadPlugin('github', configDummy);
                scm.loadPlugin('github', config);
            } catch (err) {
                assert.fail(err);
            }

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

        it('choose a webhookScm module', done =>
            scm.chooseWebhookScm(headers, payload, module => module.dummyFunction(headers, payload))
            .then((result) => {
                assert.strictEqual(result, 'example');
                assert.notCalled(githubScmMock.dummyFunction);
                assert.notCalled(gitlabScmMock.dummyFunction);
                assert.calledOnce(exampleScmMock.dummyFunction);
                assert.calledWith(exampleScmMock.dummyFunction, headers, payload);
            })
            .then(null, done())
            .catch((err) => {
                done(err);
            })
        );

        it('reject when not registered appropriate scm plugin', (done) => {
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

            return scm.chooseWebhookScm(headers, payload, module => module.dummyFunction())
            .then(() => {
                assert.fail();
            }, (err) => {
                assert.notCalled(githubScmMock.dummyFunction);
                assert.notCalled(gitlabScmMock.dummyFunction);
                assert.notCalled(exampleScmMock.dummyFunction);
                assert.strictEqual(err, 'there is no suitable webhook module');
            })
            .then(null, done())
            .catch((err) => {
                done(err);
            });
        });
    });

    describe('chooseScm', () => {
        const config = { scmContext: 'example.context' };

        it('choose a scm module', () =>
            scm.chooseScm(config, module => module.dummyFunction(config))
            .then((result) => {
                assert.strictEqual(result, 'example');
                assert.notCalled(githubScmMock.dummyFunction);
                assert.notCalled(gitlabScmMock.dummyFunction);
                assert.calledOnce(exampleScmMock.dummyFunction);
                assert.calledWith(exampleScmMock.dummyFunction, config);
            }).catch((err) => {
                assert.fail(err);
            })
        );

        it('reject when the scmContext config does not exist', () =>
            scm.chooseScm({ somekey: 'somevalue' }, module => module.dummyFunction())
            .then(() => {
                assert.fail();
            }).catch((err) => {
                assert.strictEqual(err, 'Not implemented');
            })
        );

        it('reject when not registered appropriate scm plugin', () =>
            scm.chooseScm({ scmContext: 'hoge.cotext' }, module => module.dummyFunction())
            .then(() => {
                assert.fail();
            }, (err) => {
                assert.notCalled(githubScmMock.dummyFunction);
                assert.notCalled(gitlabScmMock.dummyFunction);
                assert.notCalled(exampleScmMock.dummyFunction);
                assert.strictEqual(err, 'Not implemented');
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
            })
        );

        it('reject when origin 1st scm plugin rejects', () => {
            githubScmMock.getBellConfiguration.returnsPromise().rejects('bell reject');

            return scm.allScm(module => module.getBellConfiguration())
            .then(() => {
                assert.fail();
            }, (err) => {
                assert.calledOnce(githubScmMock.getBellConfiguration);
                assert.strictEqual(err, 'bell reject');
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
            });
        });
    });

    describe('_parseHook', () => {
        const headers = { key: 'headers' };
        const payload = { key: 'payload' };

        it('call origin parseHook', (done) => {
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
            }, done())
            .catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
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
            }).catch((err) => {
                assert.fail(err);
            });
        });
    });

    describe('_getScmContexts', () => {
        const context = ['github.context', 'example.context', 'gitlab.context'];

        it('get registered scm list', () =>
            scm._getScmContexts()
            .then((result) => {
                assert.deepEqual(result, context);
            }).catch((err) => {
                assert.fail(err);
            })
        );
    });

    describe('_canHandleWebhook', () => {
        const headers = { somekey: 'somevalue' };
        const payload = { hogekey: 'hogevalue' };

        it('call origin canHandleWebhook', (done) => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];

            return scm._canHandleWebhook(headers, payload)
            .then((result) => {
                assert.strictEqual(result, 'can handle');
                assert.notCalled(scmGithub.canHandleWebhook);
                assert.notCalled(scmGitlab.canHandleWebhook);
                assert.calledOnce(exampleScm.canHandleWebhook);
                assert.calledWith(exampleScm.canHandleWebhook, headers, payload);
            }, done())
            .catch((err) => {
                assert.fail(err);
            });
        });
    });

    describe('_getDisplayName', () => {
        const config = { scmContext: 'example.context' };

        it('call origin getDisplayName', () => {
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm._getDisplayName(config);

            assert.strictEqual(result, 'example');
            assert.notCalled(scmGithub.getDisplayName);
            assert.notCalled(scmGitlab.getDisplayName);
            assert.calledOnce(exampleScm.getDisplayName);
            assert.calledWith(exampleScm.getDisplayName, config);
        });

        it('call getDisplayName with scmContext does not exist', () => {
            const hogeConfig = { somekey: 'somevalue' };
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm._getDisplayName(hogeConfig);

            assert.strictEqual(result, '');
            assert.notCalled(scmGithub.getDisplayName);
            assert.notCalled(scmGitlab.getDisplayName);
            assert.notCalled(exampleScm.getDisplayName);
        });

        it('call getDisplayName with not registered scmContext', () => {
            const hogeConfig = { scmContext: 'hoge.context' };
            const scmGithub = scm.scms['github.context'];
            const exampleScm = scm.scms['example.context'];
            const scmGitlab = scm.scms['gitlab.context'];
            const result = scm._getDisplayName(hogeConfig);

            assert.strictEqual(result, '');
            assert.notCalled(scmGithub.getDisplayName);
            assert.notCalled(scmGitlab.getDisplayName);
            assert.notCalled(exampleScm.getDisplayName);
        });
    });
});
