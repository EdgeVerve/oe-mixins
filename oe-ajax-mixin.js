/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { OECommonMixin } from "../oe-common-mixin";
import 'oe-ajax/oe-ajax.js';


var OEUtils = window.OEUtils || {};
/**
 *`AjaxMixin` provides prebuilt methods to make Ajax calls with oe-ajax component
 * 
 *  
 * @polymer
 * @mixinFunction
 */
const AjaxMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        /**
         * Generates a oe-ajax call based on the parameter and calls the callback function with error or response.
         * @param {String} url url to make the ajax call
         * @param {String} method method for ajax call ,'get','put','post' or 'delete'
         * @param {Object} body Content to pass as body of the call
         * @param {Object} header Headers set on the request
         * @param {Object} params Query parameters like filter etc.
         * @param {Object} ajaxProps Properties to set on ajax like contentType and handleAs.
         * @param {Function} cb Function called with Error and response.
         */
        makeAjaxCall(url, method, body, header, params, ajaxProps, cb) {

            ajaxProps = ajaxProps || {};
            if (!cb && typeof ajaxProps === 'function') {
                cb = ajaxProps;
                ajaxProps = {};
            }

            var ajax = document.createElement('oe-ajax');
            ajax.contentType = ajaxProps.contentType || 'application/json';
            ajax.handleAs = ajaxProps.handleAs || 'json';
            ajax.url = url;
            ajax.method = method.toUpperCase();
            if (ajax.method == 'GET') {
                params = params || {};
                params.filter = params.filter || {};
                params.filter.scope = {};
            }
            if (params) {
                if (params.filter) {
                    params.filter = JSON.stringify(params.filter);
                }
                ajax.params = params;
            }
            if (body) {
                delete body._scope;
                delete body.score;
                ajax.body = JSON.stringify(body);
            }

            if (header) {
                Object.keys(header).forEach(function (k) {
                    var val = header[k];
                    if (Array.isArray(val)) {
                        ajax.headers[k] = val[0]
                    } else {
                        ajax.headers[k] = val
                    }

                })
            }

            ajax.addEventListener('response', function (event) {
                if (cb) {
                    cb(null, event.detail.response);
                }
            }.bind(this));
            ajax.addEventListener('error', function (err) {
                if (cb) {
                    cb(err);
                }
            }.bind(this));
            ajax.generateRequest();
        }

        /**
         * Generates a Vanilla JS XHR call based on the arguments
         * @param {String} url url to make the xhr call
         * @param {String} method method for xhr call ,'get','put','post' or 'delete'
         * @param {Object} body Content to pass as body of the call
         * @param {Object} header Headers set on the request
         * @param {Function} cb Function called with Error and response.
         */
        makeXhrCall(url, method, body, header, cb) {
            var self = this;
            method = method.toLowerCase();
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.status === 200 && xhr.readyState == 4 && xhr.response.length > 0) {
                    cb(null, xhr.response)
                }
            }
            xhr.onerror = function () {
                cb(err)
            };
            if (header) {
                Object.keys(header).forEach(function (k) {
                    var val = header[k];
                    if (Array.isArray(val)) {
                        xhr.setRequestHeader(k, val[0]);
                    } else {
                        xhr.setRequestHeader(k, val);
                    }
                })
            }
            xhr.open(method, url);
            if (method === 'get') {
                xhr.send()
            } else {
                xhr.setRequestHeader("content-type", "application/json");
                xhr.send(JSON.stringify(body));
            }
        }

        /**
         * Resolves the error from server into error message
         * @param {Error} err Error from server call
         * @return {String} error message
         */
        resolveError(err) {
            var errObj = OEUtils.extractErrorMessage(err);
            this.fire('oe-show-error', errObj);
            return errObj.code || errObj.message;
        }

        /**
         * Resolves multiple errors from server into error message
         * @param {Error} err Error from server call
         * @return {String|Object} error message or errors array
         */
        resolveErrors(err) {
            function contructError(messages, codes) {
                var fields = Object.keys(messages);
                var messageArr = [];
                fields.forEach(function (d) {
                    messages[d].forEach(function (e, j) {
                        var messageObj = {
                            message: d + ' ' + e,
                            code: codes[d][j],
                            field: d
                        }
                        messageArr.push(messageObj);
                    });
                });
                return messageArr;
            }

            var extractErr = function (err) {
                var retErrorMsg;
                if (err && err.detail && err.detail.request && err.detail.request.response) {
                    var errorObj = err.detail.request.response.error;
                    var errorMessages = [];

                    if (!errorObj) {
                        retErrorMsg = {
                            code: 'UNKNOWN_SERVER_ERROR',
                            message: 'Unknown server error'
                        };
                    } else if (errorObj.details) {
                        if (Array.isArray(errorObj.details)) {
                            errorMessages = errorObj.details.map(function (d) {
                                if (d && d.details && d.details.messages) {
                                    return contructError(d.details.messages, d.details.codes);
                                } else {
                                    return d;
                                }
                            }).filter(function (d) {
                                return d !== undefined;
                            });
                        } else {
                            errorMessages.push(contructError(errorObj.details.messages, errorObj.details.codes));
                        }
                        // flattening array of arrays to single array.
                        errorMessages = [].concat.apply([], errorMessages);
                        retErrorMsg = errorMessages;
                    } else if (errorObj.details && errorObj.details.messages && errorObj.details.messages.errs && errorObj.details
                        .messages.errs.length > 0) {
                        retErrorMsg = errorObj.details.messages.errs;
                    } else if (errorObj.errors && errorObj.errors.length > 0) {
                        retErrorMsg = errorObj.errors;
                    } else if (errorObj.message) {
                        retErrorMsg = {
                            code: errorObj.code || errorObj.message,
                            message: errorObj.message
                        };
                    } else if (errorObj.errmsg) {
                        retErrorMsg = {
                            code: errorObj.errmsg,
                            message: errorObj.errmsg
                        };
                    } else {
                        retErrorMsg = {
                            code: 'UNKNOWN_SERVER_ERROR',
                            message: 'Unknown server error'
                        };
                    }
                } else {
                    retErrorMsg = {
                        code: 'NO_RESPONSE_FROM_SERVER',
                        message: 'No response from server'
                    };
                }

                if (!Array.isArray(err)) {
                    if (!retErrorMsg.code && retErrorMsg.errCode) {
                        retErrorMsg.code = retErrorMsg.errCode;
                    }
                    if (!retErrorMsg.message && retErrorMsg.errMessage) {
                        retErrorMsg.message = retErrorMsg.errMessage;
                    }
                }
                return retErrorMsg;
            };
            var errObj = extractErr(err);
            if (Array.isArray(errObj)) {
                this.fire('oe-show-error', errObj.map(function (e) {
                    return e.message || e.code
                }).join(' , '));
                return errObj;
            }
            this.fire('oe-show-error', errObj);
            return errObj.code || errObj.message;
        }

        /**
         * Computes valid path based on restApiRoot
         * @param {String} path 
         */
        _getRestApiUrl(path) {
            var restApiRoot = (window.OEUtils && window.OEUtils.restApiRoot) ? window.OEUtils.restApiRoot : '/api';
            return restApiRoot + path;
        }

    }
}

export default dedupingMixin(OECommonMixin(AjaxMixin));
