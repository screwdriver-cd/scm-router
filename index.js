'use strict';

const Scm = require('screwdriver-scm-base');
const async = require('async');
const hoek = require('@hapi/hoek');
const logger = require('screwdriver-logger');

class ScmRouter extends Scm {
    /**
     * Constructs a router for different scm strategies
     * @method constructor
     * @param  {Object}         config                             Object with scms
     * @param  {Array}          config.scms                        Array of scms to load
     * @param  {String}         config.scms[x].plugin              Name of the scm NPM module to load
     * @param  {String}         config.scms[x].config              Configuration to construct the module with
     * @return {ScmRouter}
     */
    constructor(config = {}) {
        const scmsConfig = config.scms;

        super();

        this.scms = {};

        if (typeof scmsConfig === 'object') {
            Object.keys(scmsConfig).forEach(displayName => {
                const scm = scmsConfig[displayName];

                if (typeof scm !== 'object') {
                    throw new Error('No scm config passed in.');
                }
                if (scm.config && typeof scm.config !== 'object') {
                    throw new Error('No scm config passed in.');
                }

                const options = hoek.applyToDefaults({ displayName }, scm.config); // Add displayName to scm options

                this.loadPlugin(scm.plugin, options);
            });
        }

        if (Object.keys(this.scms).length === 0) {
            throw new Error('No scm config passed in.');
        }
    }

    /**
     * load scm module
     * @method loadPlugin
     * @param  {String}         plugin                   load plugin name
     * @param  {Object}         options                  settings for scm module
     */
    loadPlugin(plugin, options) {
        if (plugin === 'router') {
            logger.warn('The plugin of scm-router can not be specified for scms setting');

            return;
        }

        let ScmPlugin;

        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            ScmPlugin = require(`screwdriver-scm-${plugin}`);
        } catch (e) {
            logger.warn(`Scm plugin ${plugin} is not supported`);

            return;
        }

        const scmPlugin = new ScmPlugin(options);
        const scmContexts = scmPlugin.getScmContexts();
        const scmContext = scmContexts[0]; // plugins return only one scmContext

        if (!scmContext || typeof scmContext !== 'string') {
            logger.warn(`Illegal scmContext for ${plugin} scm plugin`);

            return;
        }

        if (typeof this.scms[scmContext] === 'object') {
            logger.warn(`Duplicate scm config for ${scmContext}`);

            return;
        }

        this.scms[scmContext] = scmPlugin;
    }

    /**
     * choose webhook scm module
     * @method chooseWebhookScm
     * @param  {Object}     headers          The request headers associated with the webhook payload
     * @param  {Object}     payload          The webhook payload received from the SCM service
     * @return {Promise}                     scm object
     */
    chooseWebhookScm(headers, payload) {
        return new Promise(resolve => {
            // choose a webhook scm module, or null if there is no suitable one
            async.detect(
                this.scms,
                (scm, cb) => {
                    scm.canHandleWebhook(headers, payload)
                        .then(result => {
                            cb(result === false ? null : scm);
                        })
                        .catch(err => {
                            logger.error(err);
                            cb(null);
                        });
                },
                ret => resolve(ret)
            );
        });
    }

    /**
     * choose scm module
     * @async  chooseScm
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        scm object
     */
    async chooseScm(config) {
        if (config && typeof config.scmContext === 'string') {
            const scm = this.scms[config.scmContext];

            if (scm) {
                return scm;
            }
        }

        throw new Error('Not implemented');
    }

    /**
     * Higher-order function that maps all scm modules and returns result
     * @async  allScm
     * @param  {function(scm)}     fn      function that maps an scm value
     * @return {Promise}                   the mapped results of all scm values
     */
    async allScm(fn) {
        const map = {};
        const results = await Promise.all(Object.keys(this.scms).map(key => fn(this.scms[key])));

        results.forEach(result => Object.assign(map, result));

        return map;
    }

    /**
     * Adds the Screwdriver webhook to the SCM repository
     * @method _addWebhook
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        Resolves when operation completed without failure
     */
    _addWebhook(config) {
        return this.chooseScm(config).then(scm => scm.addWebhook(config));
    }

    /**
     * Get the webhook events mapping of screwdriver events and scm events
     * @method _getWebhookEventsMapping
     * @return {Object}     Returns a mapping of the events
     */
    _getWebhookEventsMapping(config) {
        return this.scms[config.scmContext].getWebhookEventsMapping();
    }

    /**
     * Returns whether auto deploy key generation is enabled on or not
     * @method autoDeployKeyGenerationEnabled
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Boolean}                        Resolves when operation completed without failure
     */
    autoDeployKeyGenerationEnabled(config) {
        return this.scms[config.scmContext].autoDeployKeyGenerationEnabled();
    }

    /**
     * Generate and add the public deploy key to the specific scm
     * @method _addDeployKey
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _addDeployKey(config) {
        return this.chooseScm(config).then(scm => scm.addDeployKey(config));
    }

    /**
     * Parse the url for a repo for the specific source control
     * @method _parseUrl
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _parseUrl(config) {
        return this.chooseScm(config).then(scm => scm.parseUrl(config));
    }

    /**
     * Parse the webhook for the specific source control
     * @method _parseHook
     * @param  {Object}     headers     The request headers associated with the webhook payload
     * @param  {Object}     payload     The webhook payload received from the SCM service
     * @return {Promise}
     */
    _parseHook(headers, payload) {
        return this.chooseWebhookScm(headers, payload).then(scm => {
            if (!scm) {
                logger.info('Webhook does not match any expected events or actions.');

                const err = new Error(
                    'Cannot parse this webhook. Please ensure that the signature is correct or that this SCM is supported.'
                );

                err.statusCode = 400;

                return Promise.reject(err);
            }

            return scm.parseHook(headers, payload);
        });
    }

    /**
     * Checkout the source code from a repository; resolves as an object with checkout commands
     * @method _getCheckoutCommand
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _getCheckoutCommand(config) {
        return this.chooseScm(config).then(scm => scm.getCheckoutCommand(config));
    }

    /**
     * Decorate the url for the specific source control
     * @method _decorateUrl
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _decorateUrl(config) {
        return this.chooseScm(config).then(scm => scm.decorateUrl(config));
    }

    /**
     * Decorate the commit for the specific source control
     * @method _decorateCommit
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _decorateCommit(config) {
        return this.chooseScm(config).then(scm => scm.decorateCommit(config));
    }

    /**
     * Decorate the author for the specific source control
     * @method _decorateAuthor
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _decorateAuthor(config) {
        return this.chooseScm(config).then(scm => scm.decorateAuthor(config));
    }

    /**
     * Get a users permissions on a repository
     * @method _getPermissions
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _getPermissions(config) {
        return this.chooseScm(config).then(scm => scm.getPermissions(config));
    }

    /**
     * Get a users permissions on an organization
     * @method getOrgPermissions
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _getOrgPermissions(config) {
        return this.chooseScm(config).then(scm => scm.getOrgPermissions(config));
    }

    /**
     * Get a commit sha for a specific repo#branch or pull request
     * @method _getCommitSha
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _getCommitSha(config) {
        return this.chooseScm(config).then(scm => scm.getCommitSha(config));
    }

    /**
     * Get a commit sha from a reference
     * @method _getCommitRefSha
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _getCommitRefSha(config) {
        return this.chooseScm(config).then(scm => scm.getCommitRefSha(config));
    }

    /**
     * Add a comment on a pull request
     * @method _addPrComment
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _addPrComment(config) {
        return this.chooseScm(config).then(scm => scm.addPrComment(config));
    }

    /**
     * Update the commit status for a given repo and sha
     * @method _updateCommitStatus
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}
     */
    _updateCommitStatus(config) {
        return this.chooseScm(config).then(scm => scm.updateCommitStatus(config));
    }

    /**
     * Fetch content of a file from an scm repo
     * @method _getFile
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        content of a scmContext file
     */
    _getFile(config) {
        return this.chooseScm(config).then(scm => scm.getFile(config));
    }

    /**
     * Fetch changed files
     * @method _getChangedFiles
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        Changed files for scmContext
     */
    _getChangedFiles(config) {
        return this.chooseScm(config).then(scm => scm.getChangedFiles(config));
    }

    /**
     * Get list of objects which consists of opened PR names and its ref
     * @method _getOpenedPRs
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        Opened PRs of scmContext
     */
    _getOpenedPRs(config) {
        return this.chooseScm(config).then(scm => scm.getOpenedPRs(config));
    }

    /**
     * Return a valid Bell configuration of all registered modules (for OAuth)
     * @method _getBellConfiguration
     * @return {Promise}
     */
    _getBellConfiguration() {
        return this.allScm(scm => scm.getBellConfiguration());
    }

    /**
     * Resolve a pull request object based on the config
     * @method _getPrInfo
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        PR info of scmContext
     */
    _getPrInfo(config) {
        return this.chooseScm(config).then(scm => scm.getPrInfo(config));
    }

    /**
     * Return statistics on the scm of all registered modules
     * @method stats
     * @return {Object} object           Hash containing metrics for the scm
     */
    stats() {
        let result = {};

        Object.keys(this.scms).forEach(key => {
            result = Object.assign(result, this.scms[key].stats());
        });

        return result;
    }

    /**
     * Get an array of scm contexts (e.g. [github:github.com, gitlab:mygitlab])
     * @method _getScmContexts
     * @return {Array}
     */
    _getScmContexts() {
        return Object.keys(this.scms);
    }

    /**
     * Get an scm context given a hostname (e.g. github:github.com)
     * @method _getScmContext
     * @param  {Object} config
     * @param  {String} [config.hostname]   Hostname for scmContext (e.g. github.com)
     * @return {String}                     Full scmContext (e.g. github:github.com)
     */
    _getScmContext({ hostname }) {
        return Object.keys(this.scms).find(scmContext => scmContext.split(':')[1] === hostname);
    }

    /**
     * Determine a scm module can handle the received webhook
     * @method _canHandleWebhook
     * @param  {Object}     headers     The request headers associated with the webhook payload
     * @param  {Object}     payload     The webhook payload received from the SCM service
     * @return {Promise}
     */
    _canHandleWebhook(headers, payload) {
        return this.chooseWebhookScm(headers, payload)
            .then(scm => Boolean(scm))
            .catch(() => false);
    }

    /**
     * Get display name of scmContext
     * @method getDisplayName
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {String}                         display name of scmContext
     */
    getDisplayName(config) {
        return this.scms[config.scmContext].getDisplayName();
    }

    /**
     * Get read only config
     * @method getReadOnlyInfo
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Object}                         Read only config of scmContext (e.g.: {
     *                                              "enabled": true,
     *                                              "username": 'headless-user',
     *                                              "accessToken": 'token'
     *                                          })
     */
    getReadOnlyInfo(config) {
        return this.scms[config.scmContext].getReadOnlyInfo();
    }

    /**
     * Get branch info of scmContext
     * @method _getBranchList
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {String}                         branch info of scmContext
     */
    _getBranchList(config) {
        return this.chooseScm(config).then(scm => scm.getBranchList(config));
    }

    /**
     * Open a pull request on the repository
     * @method _openPr
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Object}                         Created PR
     */
    _openPr(config) {
        return this.chooseScm(config).then(scm => scm.openPr(config));
    }

    /**
     * Check if user belongs to an enterprise
     * @method _isEnterpriseUser
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Boolean}                        True if user belongs to an enterprise
     */
    _isEnterpriseUser(config) {
        return this.chooseScm(config).then(scm => scm.isEnterpriseUser(config));
    }
}

module.exports = ScmRouter;
