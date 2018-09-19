/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { OECommonMixin } from "../oe-common-mixin";
import 'oe-ajax/oe-ajax.js';

/**
 *`FormMessages` mixin is intended to fire predefined events on form status changes like,
 * Data insertion/updation/deletion and data load.
 * 
 *  
 * @polymer
 * @mixinFunction
 */
const FormMessages = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {

                /**
                 * Default message to show on delete success
                 */
                deleteSuccessMessage: {
                    type: String,
                    value: 'record-deleted'
                },

                /**
                 * Default message to show on insert success
                 */
                insertSuccessMessage: {
                    type: String,
                    value: 'record-created'
                },

                /**
                 * Default message to show on update success
                 */
                updateSuccessMessage: {
                    type: String,
                    value: 'record-updated'
                },

                /**
                 * Default message to show on load success
                 */
                loadSuccessMessage: {
                    type: String,
                    value: 'record-loaded'
                }
            }
        }

        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('oe-formdata-inserted', this._showInsertSuccess.bind(this));
            this.addEventListener('oe-formdata-updated', this._showUpdateSuccess.bind(this));
            this.addEventListener('oe-formdata-deleted', this._showDeleteSuccess.bind(this));
            this.addEventListener('oe-formdata-loaded', this._showLoadSuccess.bind(this));
        }

        /**
         * Fires event on successfull data insert.
         */
        _showInsertSuccess() {
            this.fire('oe-show-success', this.insertSuccessMessage || 'Data inserted succesfully');
        }

        /**
         * Fires event on successfull data update.
         */
        _showUpdateSuccess() {
            this.fire('oe-show-success', this.updateSuccessMessage || 'Data updated succesfully');
        }

        /**
         * Fires event on successfull data delete.
         */
        _showDeleteSuccess() {
            this.fire('oe-show-warning', this.deleteSuccessMessage || 'Data deleted');
        }

        /**
         * Fires event on successfull data load.
         */
        _showLoadSuccess() {
            this.fire('oe-show-message', this.loadSuccessMessage || 'Data loaded');
        }
    }
}

export default dedupingMixin(OECommonMixin(FormMessages));
