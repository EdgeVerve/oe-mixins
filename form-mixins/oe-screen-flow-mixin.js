/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { OEAjaxMixin } from '../oe-ajax-mixin';
import { OECommonMixin } from '../oe-common-mixin';

var OEUtils = window.OEUtils || {};
/**
 * `ScreenFlow` mixin is intended to help in the transition/flow from one screen to another. 
 * It supports both conditional as well as plain routing(transition/flow from one screen to another).
 *  
 * @polymer
 * @mixinFunction
 */
const ScreenFlow = function (BaseClass) {

    /**
     * @polymer
     * @mixinClass
     */
    return class extends BaseClass {

    /**
     * This method is used to execute the bussiness rule
     * @param {String} ruleName Name of the rule to be executed
     * @param {Object} ruleInput The payload/context with which the rule should be executed
     * @param {Function} cb callback implemented by the caller
     */
    _executeRule(ruleName, ruleInput, cb){
        var restApiRoot = (window.OEUtils && window.OEUtils.restApiRoot) ? window.OEUtils.restApiRoot : '/api';
        var ruleURL = restApiRoot + '/DecisionTables/exec/'+ruleName;
        this.makeAjaxCall(ruleURL, 'POST', ruleInput, null, null, function(err, resp){
          cb(err, resp);
        }.bind(this));
      }

      /**
       * This method returns a state object used for navigation to another screen.
       * @param {Event} evt the event for which doConditionalNavigate/doNavigate is used as an handler
       * @return state object with target as key and source as data.
       */
      _getState(evt){
        var targetName = (evt.currentTarget.dataset.stateTarget || this.modelAlias);
        var state = {};
        state[targetName] = this[evt.currentTarget.dataset.stateSource || this.modelAlias];
        return state;
      }
    
      /**
       * This methods executes a bussiness rule and get backs a route/path to which the screen should navigate next, and navigates to that path.
       * @param {Event} evt the event for which it is used as an handler
       */
      doConditionalNavigate(evt) {
        var self = this;
        var ruleName = evt.currentTarget.dataset.ruleName;//data-rule-name
        var ruleInput = this[evt.currentTarget.dataset.ruleInput || this.modelAlias];//data-rule-input
        var state = this._getState(evt);
          self.validateForm().then(function(status){
            if(status.valid){
              self._executeRule(ruleName, ruleInput, function(err, resp){
                if(err){
                  self.resolveError(err);
                  return;              
                }
                window.oe_navigate_to(resp.URL, state);
              });
            } else {
              self.fire('oe-show-error', {
                code: status.message,
                placeholders: status.control ? status.control.errorPlaceholders : undefined
              });
            }
          });
      }

      /**
       * This method navigates to another screen with the required state object.
       * @param {Event} evt the event for which it is used as an handler
       */
      doNavigate(evt) {
        var path = evt.currentTarget.dataset.url;
        var state = this._getState(evt);
        window.oe_navigate_to(path, state);
      }
    }
}

export const OEScreenFlowMixin = dedupingMixin(OECommonMixin(OEAjaxMixin(ScreenFlow)));
