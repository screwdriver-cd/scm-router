'use strict';

const ScmBase = require('screwdriver-scm-base');

module.exports = (stubsMap) => {
    /**
     * Generic scm class for testing
     * @type {Class}
     */
    const TestScmClass = class TestScm extends ScmBase {
        constructor(options) {
            super();

            this.options = options;

            Object.keys(stubsMap).forEach((key) => {
                this[key] = stubsMap[key];
            });
        }

        get constructorParams() {
            return this.options;
        }
    };

    return TestScmClass;
};
