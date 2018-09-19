/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';


var OEUtils = window.OEUtils || {};
/**
 *`UtilityMixin` contains commonly used functions
 * 
 *  
 * @polymer
 * @mixinFunction
 */
const UtilityMixin = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {
        /**
         * Checks if the list is empty list
         * @param {Array} list 
         * @return {Boolean}
         */
        _isEmpty(list) {
            return !list || list.length === 0;
        }

        /**
         * Checks if the list is not empty
         * @param {Array} list 
         * @return {Boolean}
         */
        _isNotEmpty(list) {
            return list && list.length > 0;
        }

        /**
         * Checks if the arguments are equal
         * @param {Any} lhs 
         * @param {Any} rhs 
         * @return {Boolean}
         */
        _isEqual(lhs, rhs) {
            return lhs === rhs;
        }

        /**
         * Provides a URL computed based on uibaseroute
         * @param {String} url 
         * @return {String} computed URL for ui component
         */
        uiurl(url) {
            var pre = OEUtils.uibaseroute || '';
            var post = url || '';
            if (!pre.endsWith('/')) {
                pre += '/';
            }
            if (post.startsWith('/')) {
                post = post.substr(1);
            }
            return pre + post;
        }
    }
}

export const OEUtilityMixin = dedupingMixin(UtilityMixin);
