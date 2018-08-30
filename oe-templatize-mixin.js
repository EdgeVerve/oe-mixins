/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
/**
 * This is the Mixin that takes care of default validation of oe-ui input components
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
         * Replaces the target's __ctor TemplateInstance with new TemplateInstance from
         * source and binds the methodHost to current component.
         * @param {HTMLTemplate} target HTML template element for dom-if/dom-bind/dom-repeat
         * @param {HTMLTemplate} source HTML template element to stamp (from lightdom)
         */
        __customTemplatize(target,source) {
            /* 
                dom-repeats __ctor contains a TemplateInstance class for previous template,
                We are creating a new TemplateInstance class with the options but changing the template to user defined.
            */
            var prevInstance = target.__ctor.prototype.__templatizeOptions;
            childTemplate.__dataHost = this;
            this._methodHost = this;
            target.__ctor = templatize(source, this, prevInstance);
            target.__ensureTemplatized();
        }
    }
}

export default dedupingMixin(TemplatizeMixin);