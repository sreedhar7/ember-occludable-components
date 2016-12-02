import Ember from 'ember';
import layout from '../templates/components/occludable-area';
import { scheduleWork } from 'spaniel';

/**
 * A shared component which allows culling its contents if
 * it is outside the viewport. It uses spaniel to register for
 * inViewPort events and detects if the element is in the viewport.
 *
 * Usage:
 *
 * {{#occludable-area hintClassName="my-section" occlusionEnabled=true}}
 *    some content
 * {{/occludable-area}}
 *
 * The culling happens based on the min-height of the component set via
 * the CSS class "my-section".
 */

export default Ember.Component.extend({
  layout,
  tagName: '',  // To avoid creating extra markup when the occlusion is disabled
  shouldUseLazyRendering: false,
  shouldRender: true,
  occlusionEnabled: false,
  hintClassName: '',
  viewport: Ember.inject.service(),

  unregisterEvents() {},

  init() {
    this.shouldUseLazyRendering = this.get('occlusionEnabled');

    if (this.shouldUseLazyRendering) {
      this.set('shouldRender', false);
      this.set('tagName', 'div');
    }

    // Needs to be called after set('tagName') to create valid element
    this._super();
  },

  didInsertElement() {
    if (this.shouldUseLazyRendering) {
      if (!this.isRendered) {
        this.$().addClass(this.get('hintClassName'));
      }

      this.unregisterEvents = this.get('viewport').onInViewportOnce(this.get('element'), () => {
        if (!this.get('shouldRender')) {  // avoid unnecessary rerenders if no change
          // Render the occludable area in the next animation frame.
          // This will make sure that the current frame is painted
          // without waiting for the occludable area to be rendered.
          scheduleWork(() => {
            scheduleWork(() => {
              Ember.run.join(() => {
                this.set('shouldRender', true);
                this.isRendered = true;
              });
            });
          });
        }
      }, this._getViewportOptions());
    }
  },

  didRender(...args) {
    this._super(...args);
    if (this.isRendered) {
      this.$().removeClass(this.get('hintClassName'));
    }
  },

  willDestroy() {
    this.unregisterEvents();
  },

  _getViewportOptions() {
    if (this.get('rootMarginBottomBuffer')) {
      return {
        rootMargin: {
          top: 0,
          left: 0,
          right: 0,
          bottom:  -1 * this.get('rootMarginBottomBuffer')
        }
      };
    } else {
      return undefined;
    }
  }
});
