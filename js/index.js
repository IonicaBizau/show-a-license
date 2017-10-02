(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Dependencies
var $ = require("elm-select")
  , _fetch = require("whatwg-fetch")
  , sameTime = require("same-time")
  , barbe = require("barbe")
  , Err = require("err")
  , yearRange = require("year-range")
  ;

// Constants
var HASH_PREFIX = "#license-";

// Get the elements
var licenseTable = $(".license-view table")[0]
  , tableTbody = $("tbody", licenseTable)[0]
  , viewExplanationsEl = $("tfoot", licenseTable)[0]
  , searchLicenseEl = $("input.awesomplete")[0]
  ;

searchLicenseEl.setAttribute("data-list", _licenses.join(","));
searchLicenseEl.addEventListener("awesomplete-selectcomplete", function () {
    location.hash = "license-" + this.value;
});

// Config
var showExplanations;

function checkExplanationState() {
    showExplanations = Url.queryString("hide_explanations") !== "true";
    if (showExplanations) {
        $(".text", viewExplanationsEl)[0].innerHTML = "Hide explanations";
    } else {
        $(".text", viewExplanationsEl)[0].innerHTML = "Show explanations";
    }
}

// Handle the view explanation url
viewExplanationsEl.addEventListener("click", function (e) {
    e.preventDefault();
    Url.updateSearchParam("hide_explanations", showExplanations ? "true" : undefined);
    location.reload()
});

function showNormalView() {
    $(".license-view", function (elm) {
        elm.classList.add("hide");
    });
    $(".main-view", function (elm) {
        elm.classList.remove("hide");
    });
    searchLicenseEl.focus();

}

function renderInfo(c) {
    var data = {}
      , startYear = parseInt(Url.queryString("year"))
      ;

    data.year = startYear;
    data.fullname = Url.queryString("fullname");

    if (!data.fullname) {
        delete data.fullname;
    }

    if (data.year) {
        data.year = yearRange(data.year);
    } else {
        delete data.year;
    }

    return barbe(c, ["[", "]"], data).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function doRequest(url) {
    return function (done) {
        fetch(url).then(function (res) {
            if (res.status === 404) {
                throw new Err("Not found: " + url, 404);
            }
            if (res.status >= 400) {
                throw new Err("Failed to fetch the url: " + url, res.status);
            }
            return res.text();
        }).then(function (text) {
            done(null, renderInfo(text));
        }).catch(done);
    };
}

function getLicense(license, fn) {
    sameTime([
        doRequest("/licenses/" + license + ".txt")
      , doRequest("/explanations/" + license + ".txt")
    ], function (err, data) {
        if (err) { return fn(err); }
        data = data.map(function (c) {
            return c.split("\n\n");
        });
        fn(null, {
            license: data[0]
          , explanation: data[1]
        });
    });
}

function showError(err) {
    err = err[0] || err;
    var sweetErr = {
        title: "Oops..."
      , text: err.toString()
      , type: "error"
      , html: true
    };

    // License not found
    if (err.code === 404) {
        sweetErr.text = "Cannot find such a licence. Feel free to <a href='https://github.com/IonicaBizau/showalicense.com#adding-a-new-license'>add it</a>.";
        location.hash = "";
    } else if (err.code === "EXPLANATION_DOES_NOT_EXIST") {
        sweetErr.type = "warning";
        sweetErr.text = "This license doesn't have any explanation. Feel free to <a href='https://github.com/IonicaBizau/showalicense.com#explaining-a-license'>add it</a>.";
    }

    // Show the error
    sweetAlert(sweetErr);
}

function renderLicense(err, data) {

    if (err) {
        return showError(err);
    }

    if (showExplanations) {
        if (!data.explanation.join("")) {
            showError(new Err("Explanation doesn't exist. You can add it ", "EXPLANATION_DOES_NOT_EXIST"));
            showExplanations = false;
            Url.updateSearchParam("hide_explanations", true);
            checkExplanationState();
        } else {
            licenseTable.classList.remove("shadow");
        }
    }

    var html = "";
    data.license.forEach(function (c, i) {
        html += "<tr>";
        if (showExplanations) {
            html += "<td class='explanation'>" + data.explanation[i] + "</td>";
        }
        html += "<td><pre>" + c + "</pre></td>";
        html += "</tr>";
    });

    tableTbody.innerHTML = html;
}

function showLicenseView(license) {
    getLicense(license, renderLicense);
    $(".main-view", function (elm) {
        elm.classList.add("hide");
    });
    $(".license-view", function (elm) {
        elm.classList.remove("hide");
    });
}

function checkHash() {
    var hash = location.hash;
    if (hash.indexOf(HASH_PREFIX) !== 0) { return showNormalView(); }
    var license = hash.substring(HASH_PREFIX.length).toLowerCase();
    showLicenseView(license);
    checkExplanationState();
}

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", checkHash);

},{"barbe":2,"elm-select":5,"err":6,"same-time":11,"whatwg-fetch":13,"year-range":14}],2:[function(require,module,exports){
// Dependencies
var RegexEscape = require("regex-escape");

/**
 * Barbe
 * Renders the input template including the data.
 *
 * @name Barbe
 * @function
 * @param {String} text The template text.
 * @param {Array} arr An array of two elements: the first one being the start snippet (default: `"{"`) and the second one being the end snippet (default: `"}"`).
 * @param {Object} data The template data.
 * @return {String} The rendered template.
 */
function Barbe(text, arr, data) {
    if (!Array.isArray(arr)) {
        data = arr;
        arr = ["{", "}"];
    }

    if (!data || data.constructor !== Object) {
        return text;
    }

    arr = arr.map(RegexEscape);

    var value = null
      , splits = []
      , i = 0
      ;

    function deep(obj, path) {
        Object.keys(obj).forEach(function (c) {
            value = obj[c];
            path.push(c);
            if (typeof value === "object") {
                return deep(value, path);
            }
            text = text.replace(new RegExp(arr[0] + path.join(".") + arr[1], "g"), value);
            path.pop();
        });
    }

    deep(data, []);

    return text;
}

module.exports = Barbe;

},{"regex-escape":10}],3:[function(require,module,exports){
"use strict";

/**
 * currentYear
 * Get the current year.
 *
 * @name currentYear
 * @function
 * @param {Boolean} str If `true`, the result will be stringified.
 * @param {Date} d An optional date to get the year from.
 * @returns {String|Number} The current year.
 */

module.exports = function currentYear(str, d) {
    if (str && str.constructor === Date) {
        d = str;
        str = false;
    }
    if (str) {
        return currentYear(false, d).toString();
    }
    return (d || new Date()).getFullYear();
};
},{}],4:[function(require,module,exports){
// Dependencies
var Typpy = require("typpy");

/**
 * Deffy
 * Computes a final value by providing the input and default values.
 *
 * @name Deffy
 * @function
 * @param {Anything} input The input value.
 * @param {Anything|Function} def The default value or a function getting the
 * input value as first argument.
 * @param {Object|Boolean} options The `empty` value or an object containing
 * the following fields:
 *
 *  - `empty` (Boolean): Handles the input value as empty field (`input || default`). Default is `false`.
 *
 * @return {Anything} The computed value.
 */
function Deffy(input, def, options) {

    // Default is a function
    if (typeof def === "function") {
        return def(input);
    }

    options = Typpy(options) === "boolean" ? {
        empty: options
    } : {
        empty: false
    };

    // Handle empty
    if (options.empty) {
        return input || def;
    }

    // Return input
    if (Typpy(input) === Typpy(def)) {
        return input;
    }

    // Return the default
    return def;
}

module.exports = Deffy;

},{"typpy":12}],5:[function(require,module,exports){
"use strict";

var typpy = require("typpy");

/**
 * elmSelect
 * Select DOM elements and optionally call a function.
 *
 * @name elmSelect
 * @function
 * @param {String|Element|NodeList} elm A stringified query selector, an element or a node list.
 * @param {Function} fn If this function is provided, it will be called with the current element and additional arguments passed in `args`.
 * @param {Array} args An array of arguments used in the `fn` function call (default: `[]`).
 * @param {String|Element} parent The parent element where to search the elements (default: `document`). This makes sense only when a query selector is used.
 * @return {NodeList} A node list containing the selected elements.
 */
function elmSelect(elm, fn, args, parent) {

    // Handle the query selectors
    if (typeof elm === "string") {
        parent = parent || document;
        parent = typeof parent === "string" ? elmSelect(parent, null, null, document)[0] : parent;
        if (!parent) throw new Error("Cannot find the parent element.");
        elm = parent.querySelectorAll(elm);
    }

    // Check if the input is a nodelist
    if (!typpy(elm, NodeList) && !typpy(elm, HTMLCollection)) {
        elm = [elm];
    }

    // Handle the function call
    if (typeof fn === "function") {
        if (!Array.isArray(args)) {
            args = [args];
        }
        for (var i = 0; i < elm.length; ++i) {
            var _args = [elm[i]].concat(args);
            fn.apply(this, _args);
        }
    }

    return elm;
}

module.exports = elmSelect;
},{"typpy":12}],6:[function(require,module,exports){
// Dependencies
var typpy = require("typpy");

/**
 * Err
 * Create a custom error object.
 *
 * @name Err
 * @function
 * @param {String|Error} error The error message or an existing `Error` instance.
 * @param {String|Object} code The error code or the data object.
 * @param {Object} data The data object (its fields will be appended to the `Error` object).
 * @return {Error} The custom `Error` instance.
 */
function Err(error, code, data) {

    // Create the error
    if (!typpy(error, Error)) {
        error = new Error(error);
    }

    // Err(message, code, data);
    // Err(message, data);
    if (typpy(data, Object)) {
        data.code = code;
    } else if (typpy(code, Object)) {
        data = code;
        code = undefined;
    } else if (!typpy(code, undefined)) {
        data = { code: code };
    }

    if (data) {
        Object.keys(data).forEach(function (c) {
            error[c] = data[c];
        });
    }

    return error;
}

module.exports = Err;

},{"typpy":12}],7:[function(require,module,exports){
"use strict";

var noop6 = require("noop6");

(function () {
    var NAME_FIELD = "name";

    if (typeof noop6.name === "string") {
        return;
    }

    try {
        Object.defineProperty(Function.prototype, NAME_FIELD, {
            get: function get() {
                var name = this.toString().trim().match(/^function\s*([^\s(]+)/)[1];
                Object.defineProperty(this, NAME_FIELD, { value: name });
                return name;
            }
        });
    } catch (e) {}
})();

/**
 * functionName
 * Get the function name.
 *
 * @name functionName
 * @function
 * @param {Function} input The input function.
 * @returns {String} The function name.
 */
module.exports = function functionName(input) {
    return input.name;
};
},{"noop6":8}],8:[function(require,module,exports){
"use strict";

module.exports = function () {};
},{}],9:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
"use strict";

/**
 * RegexEscape
 * Escapes a string for using it in a regular expression.
 *
 * @name RegexEscape
 * @function
 * @param {String} input The string that must be escaped.
 * @return {String} The escaped string.
 */
function RegexEscape(input) {
  return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
 * proto
 * Adds the `RegexEscape` function to `RegExp` class.
 *
 * @name proto
 * @function
 * @return {Function} The `RegexEscape` function.
 */
RegexEscape.proto = function () {
  RegExp.escape = RegexEscape;
  return RegexEscape;
};

module.exports = RegexEscape;
},{}],11:[function(require,module,exports){
(function (process){
"use strict";

var deffy = require("deffy");

/**
 * sameTime
 * Calls functions in parallel and stores the results.
 *
 * @name sameTime
 * @function
 * @param {Array} arr An array of functions getting the callback parameter in the first argument.
 * @param {Function} cb The callback function called with:
 *
 *  - first parameter: `null` if there were no errors or an array containing the error values
 *  - `1 ... n` parameters: arrays containing the callback results
 *
 * @param {Array} store An optional array to store the data in. If `null`, data won't be stored.
 * @return {sameTime} The `sameTime` function.
 */
module.exports = function sameTime(arr, cb, store) {

    var result = store,
        complete = 0,
        length = arr.length;

    if (cb) {
        if (result === undefined) {
            result = [];
        }
    } else {
        result = null;
    }

    if (!arr.length) {
        return process.nextTick(cb.bind(null, null, []));
    }

    // Run functions
    arr.forEach(function (c, index) {
        var _done = false;

        // Call the current function
        c(function () {

            if (_done) {
                return;
            }
            _done = true;

            var args = [].slice.call(arguments),
                cRes = null,
                i = 0;

            if (result) {
                // Prepare the result data
                for (; i < args.length; ++i) {
                    cRes = result[i] = deffy(result[i], []);
                    cRes[index] = args[i];
                }
            }

            // Check if all functions send the responses
            if (++complete !== length) {
                return;
            }
            if (result) {
                if (!deffy(result[0], []).filter(Boolean).length) {
                    result[0] = null;
                }
            }
            cb && cb.apply(null, result);
        });
    });
};
}).call(this,require('_process'))
},{"_process":9,"deffy":4}],12:[function(require,module,exports){
"use strict";

require("function.name");

/**
 * Typpy
 * Gets the type of the input value or compares it
 * with a provided type.
 *
 * Usage:
 *
 * ```js
 * Typpy({}) // => "object"
 * Typpy(42, Number); // => true
 * Typpy.get([], "array"); => true
 * ```
 *
 * @name Typpy
 * @function
 * @param {Anything} input The input value.
 * @param {Constructor|String} target The target type.
 * It could be a string (e.g. `"array"`) or a
 * constructor (e.g. `Array`).
 * @return {String|Boolean} It returns `true` if the
 * input has the provided type `target` (if was provided),
 * `false` if the input type does *not* have the provided type
 * `target` or the stringified type of the input (always lowercase).
 */
function Typpy(input, target) {
    if (arguments.length === 2) {
        return Typpy.is(input, target);
    }
    return Typpy.get(input, true);
}

/**
 * Typpy.is
 * Checks if the input value has a specified type.
 *
 * @name Typpy.is
 * @function
 * @param {Anything} input The input value.
 * @param {Constructor|String} target The target type.
 * It could be a string (e.g. `"array"`) or a
 * constructor (e.g. `Array`).
 * @return {Boolean} `true`, if the input has the same
 * type with the target or `false` otherwise.
 */
Typpy.is = function (input, target) {
    return Typpy.get(input, typeof target === "string") === target;
};

/**
 * Typpy.get
 * Gets the type of the input value. This is used internally.
 *
 * @name Typpy.get
 * @function
 * @param {Anything} input The input value.
 * @param {Boolean} str A flag to indicate if the return value
 * should be a string or not.
 * @return {Constructor|String} The input value constructor
 * (if any) or the stringified type (always lowercase).
 */
Typpy.get = function (input, str) {

    if (typeof input === "string") {
        return str ? "string" : String;
    }

    if (null === input) {
        return str ? "null" : null;
    }

    if (undefined === input) {
        return str ? "undefined" : undefined;
    }

    if (input !== input) {
        return str ? "nan" : NaN;
    }

    return str ? input.constructor.name.toLowerCase() : input.constructor;
};

module.exports = Typpy;
},{"function.name":7}],13:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}],14:[function(require,module,exports){
"use strict";

var year = require("current-year");

/**
 * yearRange
 * Get a human-readable year range.
 *
 * @name yearRange
 * @function
 * @param {Number|Date} date1 The first date or the year.
 * @param {Number|Date} date2 The second date or the year.
 * @returns {String} The year range.
 */
module.exports = function yearRange(date1, date2) {
    var getY = function getY(x) {
        return typeof x === "number" ? x.toString() : year(true, x);
    },
        y1 = getY(date1),
        y2 = getY(date2);

    if (y1 === y2) {
        return y1;
    }

    var p1 = y1.slice(0, -2),
        p2 = y2.slice(0, -2);

    if (p1 === p2) {
        return y1 + "-" + y2.substr(2);
    }

    return y1 + "-" + y2;
};
},{"current-year":3}]},{},[1]);
