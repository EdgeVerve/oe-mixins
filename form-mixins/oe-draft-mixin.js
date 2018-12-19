/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from "@polymer/polymer/lib/utils/mixin.js";
import { OEModelHandlerMixin } from "./oe-model-handler.js";

/**
 * `OEDraftFormMixin` mixin is intended to perform all the drafing related to draftData 
 * Model responsibilities, like save, load and delete.
 * 
 * When 'draftId' property of the current element changes , The mixin
 * Loads the respective draftData Model record and sets the current Model's instance
 * and the elements properties.
 * 
 * To save data into draftData model 'saveDraft' function needs to be called with 
 *   1)componentData - key-value pair of current element's properties ex:currentStep.
 *                     In case the parameter is not provided It is generated from the '_draftConfig.componentProps' property
 *                     To get the properties to be saved.
 * 
 *   2)options       - key-value pair to be saved in the draftData model used primarily for fetching the record.
 * 
 *   3)next          - callback function to be called after data is drafted.
 * 
 * Once the form is submitted using modelHandler mixin's doSave or doSubmit the corresponding draftData is deleted.
 * 
 * 
 * @polymer
 * @mixinFunction
 */
const DraftForm = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends OEModelHandlerMixin(BaseClass) {

        static get properties() {
            return {
                /**
                 * Draft Id unique to this draft record
                 */
                draftId: {
                    type: String,
                    observer: '_draftIdChanged'
                },

                /**
                 * Configuration of content to be drafted
                 */
                _draftConfig: {
                    type: Object,
                    value: function () {
                        return {
                            componentProps: [],
                            options: {}
                        };
                    }
                }
            };
        }


        connectedCallback() {
            super.connectedCallback();
            this.use('postInsert', this.deleteDraft);
        }

        /**
         * When the draft Id changes loads the new data from DraftData Model
         * @param {string} oldVal 
         * @param {string} newVal 
         */
        _draftIdChanged(oldVal, newVal) {
            if (this.draftId) {
                this.loadDraft(this.draftId);
            }
        }

        /**
         * Fetches the data from DraftData model based on draft Id
         * @param {string} id draft Id to fetch data
         * @param {Function} next optional callback function to be called after data is loaded
         */
        loadDraft(id, next) {
            var modelAlias = this.modelAlias;
            this.makeAjaxCall('api/DraftData/' + id, 'GET', null, null, null, null, function (err, resp) {
                if (err) {
                    this.resolveError(err);
                } else {
                    this.draftInstance = resp;
                    this.set(modelAlias, resp.modelData);
                    if (!this.isObjectEmpty(resp.componentData)) {
                        Object.keys(resp.componentData).forEach(function (key) {
                            this.set(key, resp.componentData[key]);
                        }.bind(this));
                    }
                    this.fire('oe-show-success', 'Draft loaded saved successfully.');
                    if (next && typeof next === "function") {
                        next();
                    }
                }
            }.bind(this));
        }

        /**
         * Fetches the component data to be drafted based on the _draftConfig.
         * @return {Object} data to be drafted
         */
        _getComponentData() {
            if (this._draftConfig && this._draftConfig.componentProps && Array.isArray(this._draftConfig.componentProps)) {
                var obj = {};
                this._draftConfig.componentProps.forEach(function (prop) {
                    obj[prop] = this[prop];
                }.bind(this));
                return obj;
            } else {
                return {};
            }
        }

        /**
         * Fetches the draft options
         * @return {Object} draft options object
         */
        _getDraftOptions() {
            if (this._draftConfig && this._draftConfig.options) {
                return this._draftConfig.options;
            } else {
                return {};
            }
        }

        /**
         * Saves the draft into DraftData Model.
         * @param {Object} componentData data to be drafted
         * @param {Object} options additonal options to be drafted
         * @param {Function} next optional callback function
         */
        saveDraft(componentData, options, next) {
            componentData = componentData || this._getComponentData();
            options = options || this._getDraftOptions();
            var modelAlias = this.modelAlias;
            var instance = this[modelAlias];
            var body = {
                "formName": this.is,
                "modelData": instance,
                "componentData": componentData,
                "options": options
            };

            if (this.draftInstance && !this.isObjectEmpty(this.draftInstance)) {
                body.id = this.draftInstance.id;
                body._version = this.draftInstance._version;
            }
            var method = this.draftInstance && this.draftInstance.id ? 'PUT' : 'POST';

            this.makeAjaxCall('api/DraftData', method, body, null, null, null, function (err, resp) {
                if (err) {
                    this.resolveError(err);
                } else {
                    this.fire('oe-draft-saved');
                    this.set('draftInstance', resp);
                    if (next) {
                        next();
                    }
                }
            }.bind(this));
        }

        /**
         * Deletes the draft data after the actual data is posted into the model.
         * Used as a middleware by the OEModelHandler Mixin.
         * @param {Object} response 
         * @param {Object} instance 
         * @param {Function} next 
         */
        deleteDraft(response, instance, next) {
            if (this.draftInstance && !this.isObjectEmpty(this.draftInstance)) {
                var url = 'api/DraftData/' + this.draftInstance.id;
                this.makeAjaxCall(url, 'delete', null, null, null, null, function (err, resp) {
                    if (err) {
                        this.resolveError(err);
                    } else {
                        this.fire('oe-draft-deleted');
                        delete this.draftInstance;
                    }
                }.bind(this));
            }
            next(null, response);
        }

        /**
         * Checks if the provided argument is empty , i.e. contains no properties.
         * @param {Object} obj Object to check
         * @return {boolean} flag to denote that object is empty.
         */
        isObjectEmpty(obj) {
            return Object.keys(obj).length === 0 && this.obj.constructor === Object;
        }
    };
};

export const OEDraftFormMixin = dedupingMixin(DraftForm);
