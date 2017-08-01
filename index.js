'use strict';

const Scm = require('screwdriver-scm-base');
const async = require('async');
const hoek = require('hoek');

process.on('unhandledRejection', console.dir);

class ScmRouter extends Scm {
    /**
     * Constructs a router for different scm strategies
     * @method constructor
     * @param  {Object}         config                             Object with scms and ecosystem
     * @param  {Object}         [config.ecosystem]                 Optional object with ecosystem values
     * @param  {Object}         config.scms                        Array of scms to load or a single scm object
     * @param  {String}         config.scms[x].plugin              Name of the scm NPM module to load
     * @param  {String}         config.scms[x].config              Configuration to construct the module with
     * @param  {String}         config.scms[x].config.displayName  Nickname to displaoy of the scm
     * @return {ScmRouter}
     */
    constructor(config = {}) {
        const ecosystem = config.ecosystem;
        const scmsConfig = config.scms;

        super();

        this.scms = {};

        if (typeof scmsConfig === 'object') {
            if (!(Array.isArray(scmsConfig))) {
                throw new Error('No scm config passed in.');
            }
            scmsConfig.forEach((scm) => {
                if (scm.config.displayName == null || scm.config.displayName.length === 0) {
                    throw new Error(`Display name not specified for ${scm.plugin} scm plugin`);
                }
                const options = hoek.applyToDefaults({ ecosystem },
                    (scm.config || {}));  // Add ecosystem to scm options

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
     * @param  {String}         plugin       load plugin name
     * @param  {Object}         options      settings for scm module
     */
    loadPlugin(plugin, options) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const ScmPlugin = require(`screwdriver-scm-${plugin}`);
        const scmPlugin = new ScmPlugin(options);
        const scmContexts = scmPlugin.getScmContexts();
        const scmContext = scmContexts[0]; // plugins return only one scmContext

        if (scmContext == null || scmContext.length === 0) {
            console.warn(`Illegal scmContext for ${plugin} scm plugin`);

            return;
        }

        if (typeof this.scms[scmContext] === 'object') {
            console.warn(`Duplicate scm config for ${scmContext}`);
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
        return new Promise((resolve, reject) => {
            // choose a webhook scm module, or null if there is no suitable one
            async.detectSeries(this.scms, (scm, cb) => {
                scm.canHandleWebhook(headers, payload)
                .then((result) => {
                    cb(result === false ? null : scm);
                }).catch(() => {
                    cb(null);
                });
            }, (ret) => {
                if (ret == null) {
                    reject('there is no suitable webhook module');
                }

                resolve(ret);
            });
        });
    }

    /**
     * choose scm module
     * @method chooseScm
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {Promise}                        scm object
     */
    chooseScm(config) {
        return new Promise((resolve, reject) => {
            if (config.scmContext == null || config.scmContext.length === 0) {
                reject('Not implemented');
            }

            const scm = this.scms[config.scmContext];

            if (typeof scm !== 'object') {
                reject('Not implemented');
            }

            resolve(scm);
        });
    }

    /**
     * Process by all scm module
     * @method allScm
     * @param  {Function}   callback            {Map} fn(scm)
     * @return {Promise}                        combined callback results
     */
    allScm(callback) {
        return new Promise((resolve, reject) => {
            async.mapSeries(Object.keys(this.scms), (key, cb) => {
                const scm = this.scms[key];

                callback(scm)
                .then((ret) => {
                    cb(null, ret);
                }, err => cb(err));
            }, (err, results) => {
                let map = {};

                if (err) {
                    reject(err);
                }

                results.forEach((result) => {
                    map = Object.assign(map, result);
                });

                resolve(map);
            });
        });
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
        return this.chooseWebhookScm(headers, payload).then(scm => scm.parseHook(headers, payload));
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

        Object.keys(this.scms).forEach((key) => {
            result = Object.assign(result, this.scms[key].stats());
        });

        return result;
    }

    /**
     * Get an array of scm context (e.g. [github.com, mygitlab_gitlab])
     * @method _getScmContexts
     * @return {Array}
     */
    _getScmContexts() {
        return Object.keys(this.scms);
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
            .then(scm => scm.canHandleWebhook(headers, payload));
    }

    /**
     * Get display name of scmContext
     * @method getDisplayName
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @return {String}                         display name of scmContext
     */
    getDisplayName(config) {
        if (typeof this.scms[config.scmContext] !== 'object') {
            return '';
        }

        return this.scms[config.scmContext].getDisplayName(config);
    }
}

module.exports = ScmRouter;
