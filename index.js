'use strict';

const Scm = require('screwdriver-scm-base');
const async = require('async');
const hoek = require('hoek');

process.on('unhandledRejection', console.dir);

class ScmRouter extends Scm {
    /**
     * Constructs a router for different scm strategies. At least one of Single-SCM and Multi-SCM is necessarily required.
     * @method constructor
     * @param  {Object}         config                             Object with executor and ecosystem
     * @param  {Object}         [config.ecosystem]                 Optional object with ecosystem values
     * @param  {Object}         config.scm                         Single-SCM. scm to load or a single scm object
     * @param  {String}         config.scm.plugin                  Single-SCM. Name of the scm NPM module to load
     * @param  {String}         config.scm.config                  Single-SCM. Configuration to construct the module with
     * @param  {Array|Object}   config.scms                        Multi-SCM. Array of scms to load or a single scm object
     * @param  {String}         config.scms[x].plugin              Multi-SCM. Name of the scm NPM module to load
     * @param  {String}         config.scms[x].config              Multi-SCM. Configuration to construct the module with
     * @param  {String}         config.scms[x].config.displayName  Multi-SCM. Nickname to displaoy of the scm
     * @return {ScmRouter}
     */
    constructor(config = {}) {
        const ecosystem = config.ecosystem;
        const scmConfig = config.scm;
        const scmsConfig = config.scms;

        super();

        this.scms = {};

        if (typeof scmConfig === 'object') {
            const options = hoek.applyToDefaults({ ecosystem },
                (scmConfig[scmConfig.plugin] || {})); // Add ecosystem to scm options

            this.loadPlugin(scmConfig.plugin, options);
        }

        if (typeof scmsConfig === 'object') {
            if (!(Array.isArray(scmsConfig))) {
                throw new Error('No scm config passed in.');
            }
            scmsConfig.forEach((scm) => {
                if (scm.config.displayName == null || scm.config.displayName.length === 0) {
                    throw new Error('No scm config passed in.');
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

    loadPlugin(plugin, options) {
        let ScmPlugin;

        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            ScmPlugin = require(`screwdriver-scm-${plugin}`);
        } catch (err) {
            console.warn(err);

            return;
        }

        const scmPlugin = new ScmPlugin(options);
        const scmContexts = scmPlugin.getScmContexts();
        const scmContext = scmContexts[0]; // plugins return only one scmContext

        if (scmContext == null || scmContext.length === 0) {
            console.warn('Illegal scmContext plugin.');

            return;
        }

        if (typeof this.scms[scmContext] === 'object') {
            console.warn('Duplicate scm config.');
        }

        this.scms[scmContext] = scmPlugin;
    }

    /**
     * Process by choosen webhook scm module
     * @method chooseScm
     * @param  {Object}     headers          The request headers associated with the webhook payload
     * @param  {Object}     payload          The webhook payload received from the SCM service
     * @param  {Function}   callback         fn(scm)
     * @return {Promise}                     callback result
     */
    chooseWebhookScm(headers, payload, callback) {
        return new Promise((resolve, reject) => {
            // choose a webhook scm module, or undefined if there is no suitable one
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

                resolve(callback(ret));
            });
        });
    }

    /**
     * Process by choosen scm module
     * @method chooseScm
     * @param  {Object}     config              Configuration
     * @param  {String}     config.scmContext   Name of scm context
     * @param  {Function}   callback            fn(scm)
     * @return {Promise}                        callback result
     */
    chooseScm(config, callback) {
        return new Promise((resolve, reject) => {
            if (config.scmContext == null || config.scmContext.length === 0) {
                reject('Not implemented');
            }

            const scm = this.scms[config.scmContext];

            if (typeof scm !== 'object') {
                reject('Not implemented');
            }

            resolve(callback(scm));
        });
    }

    /**
     * Process by all scm module
     * @method allScm
     * @param  {Function}   callback            {Map} fn(scm)
     * @return {Map}                            combined callback results
     */
    allScm(callback) {
        let result = {};

        return new Promise((resolve, reject) => {
            async.eachSeries(Object.values(this.scms), (scm, cb) => {
                callback(scm)
                .then((ret) => {
                    result = Object.assign(result, ret);
                    cb(null);
                }, err => cb(err));
            }, (err) => {
                if (err) {
                    reject(err);
                }

                resolve(result);
            });
        });
    }

    _addWebhook(config) {
        return this.chooseScm(config, scm => scm.addWebhook(config));
    }

    _parseUrl(config) {
        return this.chooseScm(config, scm => scm.parseUrl(config));
    }

    _parseHook(headers, payload) {
        return this.chooseWebhookScm(headers, payload, scm => scm.parseHook(headers, payload));
    }

    _getCheckoutCommand(config) {
        return this.chooseScm(config, scm => scm.getCheckoutCommand(config));
    }

    _decorateUrl(config) {
        return this.chooseScm(config, scm => scm.decorateUrl(config));
    }

    _decorateCommit(config) {
        return this.chooseScm(config, scm => scm.decorateCommit(config));
    }

    _decorateAuthor(config) {
        return this.chooseScm(config, scm => scm.decorateAuthor(config));
    }

    _getPermissions(config) {
        return this.chooseScm(config, scm => scm.getPermissions(config));
    }

    _getCommitSha(config) {
        return this.chooseScm(config, scm => scm.getCommitSha(config));
    }

    _updateCommitStatus(config) {
        return this.chooseScm(config, scm => scm.updateCommitStatus(config));
    }

    _getFile(config) {
        return this.chooseScm(config, scm => scm.getFile(config));
    }

    _getOpenedPRs(config) {
        return this.chooseScm(config, scm => scm.getOpenedPRs(config));
    }

    _getBellConfiguration() {
        return this.allScm(scm => scm.getBellConfiguration());
    }

    _getPrInfo(config) {
        return this.chooseScm(config, scm => scm.getPrInfo(config));
    }

    _getScmContexts() {
        return Promise.resolve(Object.keys(this.scms));
    }

    _canHandleWebhook(headers, payload) {
        return this.chooseWebhookScm(headers, payload,
            scm => scm.canHandleWebhook(headers, payload));
    }

    _getDisplayName(config) {
        if (typeof this.scms[config.scmContext] !== 'object') {
            return '';
        }

        return this.scms[config.scmContext].getDisplayName(config);
    }
}

module.exports = ScmRouter;
