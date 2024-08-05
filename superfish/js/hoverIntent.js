/**
 * hoverIntent is similar to jQuery's built-in "hover" method except that
 * instead of firing the handlerIn function immediately, hoverIntent checks
 * to see if the user's mouse has slowed down (beneath the sensitivity
 * threshold) before firing the event. The handlerOut function is only
 * called after a matching handlerIn.
 *
 * hoverIntent r7 // 2013.03.11 // jQuery 1.9.1+
 * http://cherne.net/brian/resources/jquery.hoverIntent.html
 *
 * You may use hoverIntent under the terms of the MIT license. Basically that
 * means you are free to use hoverIntent as long as this header is left intact.
 * Copyright 2007, 2013 Brian Cherne
 *
 * // basic usage ... just like .hover()
 * .hoverIntent( handlerIn, handlerOut )
 * .hoverIntent( handlerInOut )
 *
 * // basic usage ... with event delegation!
 * .hoverIntent( handlerIn, handlerOut, selector )
 * .hoverIntent( handlerInOut, selector )
 *
 * // using a basic configuration object
 * .hoverIntent( config )
 *
 * @param  handlerIn   function OR configuration object
 * @param  handlerOut  function OR selector for delegation OR undefined
 * @param  selector    selector OR undefined
 * @author Brian Cherne <brian(at)cherne(dot)net>
 **/
class ClickSpark extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.root = document.documentElement;
      this.svg;
    }
  
    get activeEls() {
      return this.getAttribute("active-on");
    }
  
    connectedCallback() {
      this.setupSpark();
  
      this.root.addEventListener("click", (e) => {
        if (this.activeEls && !e.target.matches(this.activeEls)) return;
  
        this.setSparkPosition(e);
        this.animateSpark();
      });
    }
  
    animateSpark() {
      let sparks = [...this.svg.children];
      let size = parseInt(sparks[0].getAttribute("y1"));
      let offset = size / 2 + "px";
  
      let keyframes = (i) => {
        let deg = `calc(${i} * (360deg / ${sparks.length}))`;
  
        return [
          {
            strokeDashoffset: size * 3,
            transform: `rotate(${deg}) translateY(${offset})`
          },
          {
            strokeDashoffset: size,
            transform: `rotate(${deg}) translateY(0)`
          }
        ];
      };
  
      let options = {
        duration: 660,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards"
      };
  
      sparks.forEach((spark, i) => spark.animate(keyframes(i), options));
    }
  
    setSparkPosition(e) {
      let rect = this.root.getBoundingClientRect();
  
      this.svg.style.left =
        e.clientX - rect.left - this.svg.clientWidth / 2 + "px";
      this.svg.style.top =
        e.clientY - rect.top - this.svg.clientHeight / 2 + "px";
    }
  
    setupSpark() {
      let template = `
        <style>
          :host {
            display: contents;
          }
          
          svg {
            pointer-events: none;
            position: absolute;
            rotate: -20deg;
            stroke: var(--click-spark-color, currentcolor);
          }
  
          line {
            stroke-dasharray: 30;
            stroke-dashoffset: 30;
            transform-origin: center;
          }
        </style>
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
          ${Array.from(
            { length: 8 },
            (_) => `<line x1="50" y1="30" x2="50" y2="4"/>`
          ).join("")}
        </svg>
      `;
  
      this.shadowRoot.innerHTML = template;
      this.svg = this.shadowRoot.querySelector("svg");
    }
  }
  
  customElements.define("click-spark", ClickSpark);
  
  /** Demo scripts **/
  
  const spark = document.querySelector("click-spark");
  const colorPicker = document.getElementById("click-spark-color");
  
  colorPicker.addEventListener("change", (e) => {
    spark.style.setProperty("--click-spark-color", e.target.value);
  });






(function($) {
    $.fn.hoverIntent = function(handlerIn,handlerOut,selector) {

        // default configuration values
        var cfg = {
            interval: 100,
            sensitivity: 7,
            timeout: 0
        };

        if ( typeof handlerIn === "object" ) {
            cfg = $.extend(cfg, handlerIn );
        } else if ($.isFunction(handlerOut)) {
            cfg = $.extend(cfg, { over: handlerIn, out: handlerOut, selector: selector } );
        } else {
            cfg = $.extend(cfg, { over: handlerIn, out: handlerIn, selector: handlerOut } );
        }

        // instantiate variables
        // cX, cY = current X and Y position of mouse, updated by mousemove event
        // pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
        var cX, cY, pX, pY;

        // A private function for getting mouse position
        var track = function(ev) {
            cX = ev.pageX;
            cY = ev.pageY;
        };

        // A private function for comparing current and previous mouse position
        var compare = function(ev,ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            // compare mouse positions to see if they've crossed the threshold
            if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
                $(ob).off("mousemove.hoverIntent",track);
                // set hoverIntent state to true (so mouseOut can be called)
                ob.hoverIntent_s = 1;
                return cfg.over.apply(ob,[ev]);
            } else {
                // set previous coordinates for next time
                pX = cX; pY = cY;
                // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
                ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
            }
        };

        // A private function for delaying the mouseOut function
        var delay = function(ev,ob) {
            ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
            ob.hoverIntent_s = 0;
            return cfg.out.apply(ob,[ev]);
        };

        // A private function for handling mouse 'hovering'
        var handleHover = function(e) {
            // copy objects to be passed into t (required for event object to be passed in IE)
            var ev = jQuery.extend({},e);
            var ob = this;

            // cancel hoverIntent timer if it exists
            if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

            // if e.type == "mouseenter"
            if (e.type == "mouseenter") {
                // set "previous" X and Y position based on initial entry point
                pX = ev.pageX; pY = ev.pageY;
                // update "current" X and Y position based on mousemove
                $(ob).on("mousemove.hoverIntent",track);
                // start polling interval (self-calling timeout) to compare mouse coordinates over time
                if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

                // else e.type == "mouseleave"
            } else {
                // unbind expensive mousemove event
                $(ob).off("mousemove.hoverIntent",track);
                // if hoverIntent state is true, then call the mouseOut function after the specified delay
                if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
            }
        };

        // listen for mouseenter and mouseleave
        return this.on({'mouseenter.hoverIntent':handleHover,'mouseleave.hoverIntent':handleHover}, cfg.selector);
    };
})(jQuery);