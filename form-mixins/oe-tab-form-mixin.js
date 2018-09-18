/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';


var OEUtils = window.OEUtils || {};
/**
 * `TabForm` provides prebuilt methods to navigate through tabs in a template .
 * To be used along with the 'tabbed-form' or 'tabbed-draft-form' templates.
 *  
 * @polymer
 * @mixinFunction
 */
const TabForm = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        static get properties() {
            return {
                selectedStep: {
                    type: Number,
                    value: 0
                }
            }
        }

        static get observers() {
            return [
                '_computeSteps(meta.container.steps)'
            ]
        }

        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('oe-formdata-inserted', this._gotoFirstPage.bind(this));
            this.addEventListener('oe-formdata-deleted', this._gotoFirstPage.bind(this));
            this.addEventListener('oe-formdata-updated', this._gotoFirstPage.bind(this));
        }
        /**
         * Navigates to first step
         */
        _gotoFirstPage() {
            this.set('selectedStep', 0);
        }

        /**
         * Navigates to previous step
         */
        _goPrev() {
            if (this.selectedStep > 0) {
                this.set('selectedStep', this.selectedStep - 1);
            }
        }

        /**
         * Navigates to the next step
         */
        _goNext() {
            if (this.stepperSteps.length > (this.selectedStep + 1)) {
                this.set('selectedStep', this.selectedStep + 1);
            }
        }

        /**
         * Computes the text to be displayed on next/save button.
         * @param {Array} steps array of steps
         * @param {Number} curStep current step index
         * @return {String} button text , "save" or "next".
         */
        _computeBtnText(steps, curStep) {
            return curStep === (steps.length - 1) ? "Save" : "Next";
        }

        /**
         * Computes the icon to be displayed on next/save button.
         * @param {Array} steps array of steps
         * @param {Number} curStep current step index
         * @return {String} icon name "save" or "chevron-right"
         */
        _computeBtnIcon(steps, curStep) {
            return curStep === (steps.length - 1) ? "save" : "chevron-right";
        }

        /**
         * Computes the 'stepperSteps' to be used by oe-stepper component.
         * @param {Array} steps steps from UIComponent entry
         * @param {Boolean} isVerticalLayout flag denoting vertical layout
         */
        _computeSteps(steps, isVerticalLayout) {
            var stepperSteps = steps.map(function (step) {
                return {
                    "label": step.label,
                    "isDisabled": false,
                    "hasError": false,
                    "isCompleted": false
                }
            });
            this.set('stepperSteps', stepperSteps);
            this._gotoFirstPage();
        }
    }
}

export default dedupingMixin(TabForm);
