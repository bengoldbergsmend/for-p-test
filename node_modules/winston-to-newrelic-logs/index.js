'use strict';

const TransportStream = require('winston-transport');
const axios = require('axios');
const { LEVEL, MESSAGE } = require('triple-beam');

/**
 * Transport for reporting errors to newrelic.
 * @type {Newrelic}
 * @extends {TransportStream}
 */
module.exports = class Newrelic extends TransportStream {
    /**
     * Constructor function for the Console transport object responsible for
     * persisting log messages and metadata to a terminal or TTY.
     * @param {!Object} [options={}] - Options for this instance.
     */
    constructor(options = { licenseKey: '', apiUrl: '', pluginOptions: {}, }) {
        super(options);
        this.name = 'winston-to-newrelic-logs';
        this.pluginOptions = options.pluginOptions;
        this.info = null;
        this.axiosClient = axios.create({
            baseURL: options.apiUrl,
            timeout: 5000,
            headers: {
                'X-License-Key': options.licenseKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * @param {Object} info
     * @param {function} callback
     */
    log(info, callback) {
        const { customTags = {}, buildId, SITE_NAME } = this.pluginOptions;
        this.info = info
        setImmediate(() => this.emit('logged', info));
        this.axiosClient.post('/log/v1', {
            timestamp: Date.now(),
            message: info[MESSAGE],
            logtype: info[LEVEL],
            buildId,
            siteName: SITE_NAME,
            ...customTags,
        }).catch(err => { //
            if(err != `Error: timeout of 5000ms exceeded`) {
                console.error(`[@] winston-to-newrelic-logs: Error sending log data - ${err}`);
            }
        });

        callback();
    }
};
