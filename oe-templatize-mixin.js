/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from "@polymer/polymer/lib/utils/mixin.js";
import { templatize } from "@polymer/polymer/lib/utils/templatize.js";
/**
 * `OETemplatizeMixin`
 * This is the Mixin that provides a wrapper function for templatizing a Polymer component.
 * 
 * @polymer
 * @mixinFunction
 */
const TemplatizeMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

        /**
         * Replaces template from dom-if,dom-repeat or dom-bind with source template.
         * If the target is not a dom-if,dom-repeat or dom-bind , creates a new templateInstance ,
         * attahces a stamped node and returns the instance.
         * If the target is not provided it returns a templateInstance class
         * @public
         * @param {HTMLTemplate} target HTML template element for dom-if/dom-bind/dom-repeat
         * @param {HTMLTemplate} source HTML template element to stamp (from lightdom)
         * @param {Object} options options to stamp (from lightdom)
         * @return {TemplateInstanceClass|HTMLTemplate} Generated class bound to the source template or stamped instance.
         */
        __customTemplatize(target, source, options) {
            const domElement = {
                "DOM-REPEAT": true,
                "DOM-IF": true,
                "DOM-BIND": true
            };
            options = options || {};
            this._methodHost = options.methodHost || this;
            source.__dataHost = this;
            var __templatizeOptions = {
                parentModel: options.parentModel || true,
                instanceProps: options.instanceProps || {},
                forwardHostProp: options.forwardHostProp || function (prop, value) {
                    if (this.instance) {
                        this.instance.forwardHostProp(prop, value);
                    }
                },
                notifyInstanceProp: options.notifyInstanceProp || function (inst, prop, value) {
                    this.notifyPath(prop, value);
                }
            };
            if (!target) {
                return templatize(source, this, __templatizeOptions);
            } else {
                if (domElement[target.tagName]) {
                    /* 
                     * dom-repeat and dom-if stamp the content based on the templateInstance stored in __ctor
                     * __ctor is created based on the template present when the element is attached , so we replace the template
                     * and remove existing templateInstance and make the element create a new Instance for this template.
                     * dom-bind stores the stamped Instance in this.root and this.__childern;
                     */
                    var prevTemplate = target.querySelector('template');
                    prevTemplate.parentElement.replaceChild(source, prevTemplate);
                    if (target.tagName == "DOM-BIND") {
                        delete target.__childern;
                    } else {
                        delete target.__ctor;
                    }
                    target.render();
                } else {
                    var tempClass = templatize(source, this, __templatizeOptions);
                    var instance = new tempClass();
                    target.appendChild(instance.root);
                    return instance;
                }
            }
        }
    };
};

export const OETemplatizeMixin = dedupingMixin(TemplatizeMixin);