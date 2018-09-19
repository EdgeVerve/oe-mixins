/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { OECommonMixin } from "../oe-common-mixin";
import 'oe-ajax/oe-ajax.js';

/**
 *`ModelHandler` mixin is intended to perform all the model handling
 * responsibilities, like fetch, save, reset, refresh etc.
 * 
 * On-Attached, the behavior scans through the shadow-dom for all the elements
 * having oe-action attribute.
 * 
 *     <paper-button oe-action="save">Save</paper-button>
 * 
 * Possible values for oe-action are:
 *     save
 *     new
 *     delete
 *     reset
 *     refresh
 *     add
 *     cancel
 * 
 * For workflow support, it also scans for elements having oe-workflow-action="..." attribute
 * 
 *     <paper-button oe-workflow-action="approve">Approve</paper-button>
 *     <paper-button oe-workflow-action="reject">Reject</paper-button>
 * 
 * 
 * @polymer
 * @mixinFunction
 */
const ModelHandler = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {

                /**
                 *  unique key/ record-id to fetch the record
                 */
                modelId: {
                    type: String,
                    notify: true,
                    observer: 'modelIdChanged'
                },

                /**
                 * (For temporary backward compatibility) unique key/ record-id to fetch the record 
                 */
                datakey: {
                    type: String,
                    notify: true,
                    observer: 'datakeyChanged'
                },

                /**
                 * QueryString to fetch the record
                 */
                querystring: {
                    type: String,
                    notify: true,
                    observer: 'doFetch'
                },

                /**
                 * Event to emit instead of doing save action
                 */
                emitOnSave: {
                    type: String
                },
                
                /**
                 *  if disableAutoFetch is true, modelHandler will not fetch the model, and caller can set model itself or set model 
                 */
                disableAutoFetch: {
                    type: 'boolean'
                },

                model: {
                    type: 'object'
                },

                idField: {
                    type: String,
                    value: 'id'
                },

                _middlewares: {
                    type: Object
                },

                /**
                 * Fired when the form data is fetched from the server
                 *  
                 * @event oe-formdata-loaded
                 * @param {Object} detail contains the fieldId of the element
                 */

                /**
                 * Fired when the form data 'PUT' call is success
                 * 
                 * @event oe-formdata-updated
                 * @param {Object} detail contains response/error of the put Ajax call.
                 */

                /**
                 * Fired when the form data 'POST' call is success
                 * 
                 * @event oe-formdata-inserted
                 * @param {Object} detail contains response/error of the post Ajax call.
                 */

                /**
                 * Fired when the form data 'DELETE' call is success
                 * 
                 * @event oe-formdata-deleted
                 * @param {Object} detail contains old data and new Data.
                 */
                /**
                 * Fired when the form data custom request call is success
                 * 
                 * @event oe-ajax-action-completed
                 * @param {Object} detail contains response of the request call.
                 */

                /**
                 * Fired when the workflow task API call succeeds
                 * 
                 * @event oe-workflow-action-completed
                 * @param {Object} detail contains the response from server.
                 */

                /**
                 * Fired when the workflow task API call fails with error
                 * 
                 * @event oe-workflow-action-failed
                 * @param {Object} error contains the error details.
                 */

            }
        }

        constructor() {
            super();
            this._middlewares = {
                preInsert: [],
                postInsert: [],
                preUpdate: [],
                postUpdate: [],
                preDelete: [],
                postDelete: []
            };
        }

        /**
         * Registers a function to be invoked along with the stage name.
         * @param {String} when Keyword for when to execute the function like 'preInsert','postUpdate',etc.
         * @param {Function} fn Function to be invoked during the the execution phase speicifed in 'when'
         */
        use(when, fn) {
            this._middlewares[when].push(fn);
        }

        /**
         * Executes a list of middleware functions
         * @param {Array} middlewares Array of functions to be invoked.
         */
        _executeMiddlewares(middlewares) {
            var n = -1;

            function executor(err) {
                n++;
                //console.warn(n,middlewares.length, arguments);
                var argsArray = Array.prototype.slice.call(arguments);
                //remove err from argsArray
                argsArray.shift();
                //add self-callback to arguments
                argsArray.push(executor);

                if (n < middlewares.length && !err) {
                    middlewares[n].apply(this, argsArray);
                } else {
                    //may be err or not either way callback's first argument (err) would be set correctly
                    callback && callback.apply(this, arguments);
                }
            }

            var args = Array.prototype.slice.call(arguments);
            //remove middlewares
            args.shift();

            var callback;
            if (args.length > 0) {
                callback = args[args.length - 1];
                //the last argument is our callback.
                if (callback && typeof (callback) === 'function') {
                    args.pop();
                } else {
                    callback = undefined;
                }
            }
            //prefix error argument
            args.unshift(undefined);
            executor.apply(this, args);
        }

        /**
         * Observes the 'dataKey' property. The property is deprecated and instead 'modelId' property should be used ,
         * to specify the primary property of the model.
         */
        datakeyChanged() {
            console.warn('datakey is depricated and will be removed in future release. Use modelId property instead.');
            this.set('modelId', this.datakey);
        }

        /**
         * Converts queryString into a object of key-value pair
         * @return {Object} result 
         */
        _queryStringAsObject() {
            var result = {};
            if (this.querystring) {
                var pairs = this.querystring.split('&');
                pairs.forEach(function (pair) {
                    pair = pair.split('=');
                    var name = pair[0];
                    var value = pair[1];
                    if (name.length) {
                        if (result[name] !== undefined) {
                            if (!result[name].push) {
                                result[name] = [result[name]];
                            }
                            result[name].push(value || '');
                        } else {
                            result[name] = value || '';
                        }
                    }
                });
            }
            return (result);
        }

        /**
         * Computes the url used for fetching data.
         * @return {String} Url used for fetching data.
         */
        _getURLForFetch() {
            var retUrl;
            if (this.geturl) {
                var model = {};
                model[this.idField] = this.modelId;
                retUrl = this._concreteUrl(this.geturl, model);
            } else {
                retUrl = this.resturl;
                if (this.modelId) {
                    retUrl += '/' + this.modelId;
                } else {

                    retUrl += '?';
                    var params = this._queryStringAsObject();

                    params && Object.keys(params).forEach(function (criterion) {
                        retUrl += 'filter[where][' + criterion + ']=' + params[criterion] + '&';
                    });

                    //remove ending & or ?
                    retUrl = retUrl.substr(0, retUrl.length - 1);
                }

                if (this.includes && this.includes.length > 0) {
                    var includeFilters = this.includes.split(',');
                    retUrl += '?';
                    includeFilters.forEach(function (filter, index) {
                        retUrl += 'filter[include]=' + filter;
                        if ((index + 1) !== includeFilters.length) {
                            retUrl += '&';
                        }
                    });
                }

            }
            return retUrl;
        }

        /**
         * Fetches the form data from the server 
         */
        _doFetch() { //eslint-disable-line no-unused-vars
            var self = this;
            var ajaxCall = document.createElement('oe-ajax');
            ajaxCall.contentType = 'application/json';
            ajaxCall.handleAs = 'json';
            ajaxCall.url = this._getURLForFetch();
            ajaxCall.method = 'GET';
            ajaxCall.addEventListener('response', function (event) {
                self.set(self.modelAlias, event.detail.response);
                self.fire('oe-formdata-loaded', event.detail.response);
            });
            ajaxCall.addEventListener('error', function (err) {
                self.fire('oe-show-error', OEUtils.extractErrorMessage(err));
            });
            ajaxCall.generateRequest();
        }

        /**
         * Initiates model data fetch based on restutl,modelId,etc.
         * It can also be used as an observer
         * @param {Event} evt 
         */
        doFetch(evt) {
            /*do not use evt as doFetch is used as observer also*/
            if (!this.disableAutoFetch && this.resturl && (this.querystring || this.modelId)) {
                this._doFetch();
            }
        }

        /**
         * Listens for change of modelId and triggers fetch if the modelId is 'new' or -1.
         * @param {Event} evt 
         */
        modelIdChanged(evt) { // eslint-disable-line no-unused-vars
            evt = null;
            if (!this.disableAutoFetch && this.resturl && this.modelId) {
                if (this.modelId !== 'new' && this.modelId !== -1) {
                    this._doFetch();
                }
            }
        }

        /**
         * Fetches the list data based on resturl and calls callback function with the data or undefined
         * @param {Function} callback 
         */
        fetchList(callback) {
            /* Must not call fetchList when url-is-singular */
            if (this.resturl) {
                var ajaxCall = document.createElement('oe-ajax');
                ajaxCall.contentType = 'application/json';
                ajaxCall.handleAs = 'json';
                ajaxCall.url = this.resturl;
                ajaxCall.method = 'GET';
                ajaxCall.addEventListener('response', function (evt) {
                    callback(evt.detail.response);
                });
                ajaxCall.addEventListener('error', function (evt) { // eslint-disable-line no-unused-vars
                    callback(undefined);
                });

                ajaxCall.generateRequest();
            }
        }


        /**
         * Fires specified event passing data-event-details attribute value as details
         * @param {Event} evt 
         */
        doEvent(evt) {
            var btn = evt.currentTarget;
            var eventName = btn.getAttribute('oe-action-event');
            if (eventName) {
                btn.fire(eventName, btn.dataset.eventDetails);
            } else {
                console.warn('Event name not specified under [oe-action-event] attribute');
            }
        }

        /**
         * Triggers validation of the form and and resolves the Promise
         */
        doValidate(evt) {
            var self = this;
            var button = evt.currentTarget;
            self.validateForm().then(function (status) {
                if (status.valid) {
                    // for some strange reason, after introducing "validateForm().then" promise, evt looses currentTarget;
                    //var button = evt.currentTarget;
                    var eventName = button && button.getAttribute('oe-valid-event');
                    eventName && self.fire(eventName, self[self.modelAlias]);
                } else {
                    status.control && status.control.focus();
                    self.fire('oe-show-error', {
                        code: status.message,
                        placeholders: status.control ? status.control.errorPlaceholders : undefined
                    });
                }
            });
        }

        /**
         * Triggers Submit of a form after validation fo the form.
         * @param {Event} evt 
         */
        doSave(evt) {
            var self = this;
            var button = evt ? evt.currentTarget : undefined;
            self.validateForm().then(function (status) {
                if (status.valid) {
                    if (self.emitOnSave) {
                        var modelName = (button && button.getAttribute('oe-action-model')) || self.modelAlias;
                        var model = self[modelName];
                        self.fire(self.emitOnSave, model);
                    } else {
                        self.doSubmit(evt);
                    }
                } else {
                    status.control && status.control.focus();
                    self.fire('oe-show-error', {
                        code: status.message,
                        placeholders: status.control ? status.control.errorPlaceholders : undefined
                    });
                }
            });
        }

        /**
         * Clears the model data bound by overwritting it with defaultVM data.
         */
        doClear(evt) {
            var button = evt ? evt.currentTarget : undefined;
            var modelName = button ? (button.getAttribute('oe-action-model') || this.modelAlias) : this.modelAlias;
            this.fire('oe-reset-errors');
            this.set(modelName, this.defaultVM ? JSON.parse(JSON.stringify(this.defaultVM)) : {});
        }

        /**
         * Copies the content of model by deleting the 'id' and '_version' property.
         * @param {Event} evt 
         */
        doCopy(evt) {
            var button = evt ? evt.currentTarget : undefined;
            var modelName = button ? (button.getAttribute('oe-action-model') || this.modelAlias) : this.modelAlias;
            if (this[modelName]) {
                this[modelName].id = undefined;
                this[modelName]._version = undefined;
                delete this[modelName].id;
                delete this[modelName]._version;
            }
        }

        /**
         * Returns resolved url by Regexp substituion of "version" and "id".
         * @param {String} url URL string for the ajax operations
         * @param {Object} model data present in the form
         * @return {String} Modified URL string
         */
        _concreteUrl(url, model) {
            if (url) {
                url = url.replace(':version', model._version);
                url = url.replace(':id', model[this.idField]);
            }
            return url;
        }

        /**
         * Get Url based on the method type and model data 
         * @param {String} method method type 'get','post','put' and 'delete'.
         * @param {Object} model data present in the form
         * @return {String} Modified URL string
         */
        getUrl(method, model) {
            switch (method) {
                case 'GET':
                case 'get':
                    {
                        this._getURLForFetch();
                        break;
                    }
                case 'POST':
                case 'post':
                    {
                        return this.posturl ? this._concreteUrl(this.posturl, model) : this.resturl;
                        break;
                    }
                case 'PUT':
                case 'put':
                    {
                        return this.puturl ? this._concreteUrl(this.puturl, model) : this.resturl;
                        break;
                    }
                case 'DELETE':
                case 'delete':
                    {
                        if (this.deleteurl) {
                            return this._concreteUrl(this.deleteurl, model)
                        } else {
                            var returl = this.resturl + '/' + model[this.idField];
                            // If version is applicable, then do a delete on the right endpoint
                            if (model._version) {
                                returl = returl + '/' + model._version;
                            }
                            return returl;
                        }
                        break;
                    }
            }
        }

        /**
         * Submits the model data of the form based on URL provided after executing the middleWares
         * 
         * @param {Event} evt 
         */
        doSubmit(evt) {
            var self = this;
            var button = evt ? evt.currentTarget : undefined;
            var modelName = button ? (button.getAttribute('oe-action-model') || this.modelAlias) : this.modelAlias;

            var model = self[modelName];
            var isUpdate = false;

            if (model[self.idField]) {
                isUpdate = true;
                model._newVersion = OEUtils.UUID.generate();
            }

            var headers = {};
            self._executeMiddlewares((isUpdate ? self._middlewares.preUpdate : self._middlewares.preInsert), headers,
                model,
                function (err) {
                    var ajaxMethod = isUpdate ? 'PUT' : 'POST';
                    var ajaxUrl = self.getUrl(ajaxMethod, model);

                    if (!ajaxUrl) {
                        self.fire('oe-show-error', 'rest url must be set before submit');
                        return;
                    }
                    if (!err) {
                        var ajaxCall = document.createElement('oe-ajax');
                        ajaxCall.contentType = 'application/json';
                        ajaxCall.handleAs = 'json';
                        ajaxCall.url = ajaxUrl;

                        ajaxCall.method = isUpdate ? 'PUT' : 'POST';

                        ajaxCall.headers = ajaxCall.headers || {};
                        Object.assign(ajaxCall.headers, headers);

                        ajaxCall.body = model;
                        ajaxCall.addEventListener('response', function (event) {
                            var response = event.detail ? event.detail.response : undefined;
                            self._executeMiddlewares((isUpdate ? self._middlewares.postUpdate : self._middlewares.postInsert),
                                response, (isUpdate ? model : undefined),
                                function (err, response, old) { // eslint-disable-line no-unused-vars
                                    if (!err) {
                                        var oldData = model;
                                        self.set(modelName, response);
                                        self.fire((isUpdate ? 'oe-formdata-updated' : 'oe-formdata-inserted'), {
                                            data: response,
                                            oldData: (isUpdate ? oldData : undefined)
                                        });
                                    }
                                });
                        });
                        ajaxCall.addEventListener('error', function (err) {
                            self.fire('oe-show-error', OEUtils.extractErrorMessage(err));
                        });

                        ajaxCall.generateRequest();
                    }
                });
        }

        /**
         * Deletes the model data of the form based on URL provided after executing the middleWares
         * 
         * @param {Event} evt 
         */
        doDelete(evt) {
            var self = this;
            var button = evt.currentTarget;
            var modelName = button.getAttribute('oe-action-model') || self.modelAlias;
            var model = self[modelName];
            if (model && model[self.idField]) {
                var headers = {};
                self._executeMiddlewares(self._middlewares.preDelete, headers, model, function (err) {
                    if (!err) {
                        var ajaxCall = document.createElement('oe-ajax');
                        ajaxCall.contentType = 'application/json';
                        ajaxCall.handleAs = 'json';
                        ajaxCall.url = self.getUrl('DELETE', model);
                        ajaxCall.method = 'DELETE';
                        ajaxCall.body = model;

                        ajaxCall.headers = ajaxCall.headers || {};
                        Object.assign(ajaxCall.headers, headers);

                        ajaxCall.addEventListener('response', function (evt) { // eslint-disable-line no-unused-vars
                            self._executeMiddlewares(self._middlewares.postDelete, model, function (err) { // eslint-disable-line no-unused-vars
                                self.fire('oe-formdata-deleted', {
                                    data: model,
                                    oldData: model
                                });
                                self.set(modelName, self.defaultVM ? JSON.parse(JSON.stringify(self.defaultVM)) : {});
                            });
                        });
                        ajaxCall.addEventListener('error', function (err) {
                            self.fire('oe-show-error', OEUtils.extractErrorMessage(err));
                        });

                        ajaxCall.generateRequest();
                    }
                });

            } else {
                self.fire('oe-show-message', 'Can not delete a new record.');
            }
        }

        /**
         * Generates custom request from any button based on the attributes of button clicked.
         * 'oe-action-model' - model to be used for request
         * 'request-url' - Url to make the request
         * 'http-type' - HTTP type of the call
         * 'response-to' - Property to set the result of the request.
         * 
         * @param {Event} evt 
         */
        doRequest(evt) {

            var btn = evt.currentTarget;
            var modelName = btn.getAttribute('oe-action-model') || this.modelAlias;
            var requestUrl = btn.getAttribute('request-url');
            var httpType = btn.getAttribute('http-type');
            var responseTo = btn.getAttribute('response-to');

            var self = this;
            var ajaxCall = document.createElement('oe-ajax');
            ajaxCall.contentType = 'application/json';
            ajaxCall.handleAs = 'json';
            ajaxCall.url = requestUrl;
            ajaxCall.method = httpType ? httpType : 'GET';
            ajaxCall.body = self[modelName];
            ajaxCall.addEventListener('response', function (event) {
                self.set(responseTo, event.detail.response);
                self.fire('oe-ajax-action-completed', event.detail.response);
            });
            ajaxCall.addEventListener('error', function (err) {
                self.set(responseTo, undefined);
                self.fire('oe-show-error', OEUtils.extractErrorMessage(err));
            });
            ajaxCall.generateRequest();
        }

        /**
         * Completes workflow tasks based on the parameters
         * @param {String} processId processId of the workflow task
         * @param {String} processName name of the process
         * @param {Object} processData Data of the current process
         */
        _executeWorkflowAction(processId, processName, processData) {
            var self = this;
            var ajaxCall = document.createElement('oe-ajax');
            ajaxCall.contentType = 'application/json';
            ajaxCall.handleAs = 'json';

            var restApiRoot = (window.OEUtils && window.OEUtils.restApiRoot) ? window.OEUtils.restApiRoot : '/api';
            var wfurl = restApiRoot + '/TaskManager/complete';
            //TODO - Arrive at appropriate URL, METHOD and BODY
            ajaxCall.url = wfurl;
            ajaxCall.method = 'POST';

            //Sample Data
            //  {
            //      "processId":"575bcf68b9602774192e11f1",
            //      "name":"ApprovalDesk",
            //      "data":{
            //          "status":"approved"
            //      }
            //  }
            ajaxCall.body = {
                'processId': processId,
                'name': processName,
                'data': processData
            };
            ajaxCall.addEventListener('response', function (event) {
                self.fire('oe-workflow-action-completed', event.detail.response);
            });
            ajaxCall.addEventListener('error', function (err) {
                self.fire('oe-workflow-action-failed', OEUtils.extractErrorMessage(err));
            });

            ajaxCall.generateRequest();
        }

        /**
         * Attaches event listeners to the buttons present in the DOM.
         */
        connectedCallback() {
            super.connectedCallback();
            var self = this;
            self.modelAlias = self.modelAlias || 'vm';
            var actionButtons = self.querySelectorAll('[oe-action]');
            for (var i = 0; i < actionButtons.length; i++) {

                var button = actionButtons[i];
                var action = button.getAttribute('oe-action');
                var modelName = button.getAttribute('oe-action-model') || this.modelAlias;

                switch (action) {
                    case 'event':
                        {
                            console.warn('Depricated [oe-action=event]. Use on-tap=doEvent instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doEvent.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'new':
                        {
                            console.warn('Depricated [oe-action=new]. Use on-tap=doClear instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doClear.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'copy':
                        {
                            console.warn('Depricated [oe-action=copy]. Use on-tap=doCopy instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doCopy.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'save':
                        {
                            console.warn('Depricated [oe-action=save]. Use on-tap=doSave instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doSave.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'submit':
                        {
                            console.warn('Depricated [oe-action=submit]. Use on-tap=doSubmit instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doSubmit.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'validate':
                        {
                            console.warn('Depricated [oe-action=validate]. Use on-tap=doValidate instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doValidate.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'delete':
                        {
                            console.warn('Depricated [oe-action=delete]. Use on-tap=doDelete instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doDelete.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'reset':
                    case 'refresh':
                        {
                            console.warn('Depricated [oe-action=reset/refresh]. Use on-tap=doFetch instead.');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doFetch.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'add':
                        {
                            console.warn(
                                'Depricated [oe-action=add]. Use on-tap=doValidate oe-valid-event="oe-model-add" instead.');
                            button.setAttribute('oe-valid-event', 'oe-model-add');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doValidate.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'cancel':
                        {
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func, no-unused-vars
                                self.fire('oe-model-cancel', self[modelName]);
                                self.set(modelName, self.defaultVM ? JSON.parse(JSON.stringify(self.defaultVM)) : {});
                            });
                            break;
                        }

                    case 'update':
                        {
                            console.warn(
                                'Depricated [oe-action=update]. Use on-tap=doValidate oe-valid-event="oe-model-update" instead.');
                            button.setAttribute('oe-valid-event', 'oe-model-update');
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doValidate.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    case 'request-response':
                        {
                            button.addEventListener('tap', function (evt) { // eslint-disable-line no-loop-func
                                self.doRequest.call(self, evt); // eslint-disable-line no-useless-call
                            });
                            break;
                        }
                    default:
                        break;
                }
            }


            var workflowButtons = this.querySelectorAll('[oe-workflow-action]');

            for (i = 0; i < workflowButtons.length; i++) {
                var wfButton = workflowButtons[i];
                wfButton.addEventListener('tap', function (evt) {
                    var btn = evt.target;

                    var processId = btn.dataset.processId;
                    var processName = btn.dataset.processName;
                    var processData = btn.dataset.processData;

                    if (!(processData instanceof Object)) {
                        processData = JSON.parse(processData);
                    }

                    var action = evt.target.getAttribute('oe-workflow-action'); // eslint-disable-line no-unused-vars
                    self._executeWorkflowAction(processId, processName, processData);
                });
            }
        }
    }
}

export default dedupingMixin(OECommonMixin(ModelHandler));
