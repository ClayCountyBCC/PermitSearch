(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/** @suppress {undefinedVars} */
var globalNS = (function() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
})();

if (!('Promise' in globalNS)) {
  globalNS['Promise'] = Promise;
} else if (!globalNS.Promise.prototype['finally']) {
  globalNS.Promise.prototype['finally'] = finallyConstructor;
}

})));

(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
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

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
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
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
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
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
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
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
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

    if (input instanceof Request) {
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
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
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
    return new Request(this, { body: this._bodyInit })
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

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
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

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false
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
})(typeof self !== 'undefined' ? self : this);

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        // To convert string to integer.
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (August 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var maxCount = str.length * count;
        count = Math.floor(Math.log(count) / Math.log(2));
        while (count) {
            str += str;
            count--;
        }
        str += str.substring(0, maxCount - str.length);
        return str;
    };
}
//# sourceMappingURL=string.js.map
/// <reference path="menuitem.ts" />
var Utilities;
(function (Utilities) {
    function Hide(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("hide");
        e.classList.remove("show");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Hide = Hide;
    function Show(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Show = Show;
    function Show_Inline(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-inline");
        e.classList.remove("hide");
        e.classList.remove("show");
        e.classList.remove("show-flex");
    }
    Utilities.Show_Inline = Show_Inline;
    function Show_Flex(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-flex");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show");
    }
    Utilities.Show_Flex = Show_Flex;
    function Error_Show(e, errorText, timeout) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        if (errorText) {
            //Set_Text(e, errorText);
            Clear_Element(e);
            var notification = document.createElement("div");
            notification.classList.add("notification");
            notification.classList.add("is-danger");
            var deleteButton = document.createElement("button");
            deleteButton.classList.add("delete");
            deleteButton.onclick = function () {
                Hide(e);
            };
            notification.appendChild(deleteButton);
            if (Array.isArray(errorText)) {
                // we're assuming that errorText is an array if we get here.
                var ul_1 = document.createElement("ul");
                errorText.forEach(function (et) {
                    var li = document.createElement("li");
                    li.appendChild(document.createTextNode(et));
                    ul_1.appendChild(li);
                });
                notification.appendChild(ul_1);
            }
            else {
                notification.appendChild(document.createTextNode(errorText));
            }
            e.appendChild(notification);
        }
        Show(e);
        if (timeout == undefined || timeout === true) {
            window.setTimeout(function (j) {
                Hide(e);
            }, 10000);
        }
    }
    Utilities.Error_Show = Error_Show;
    function Clear_Element(node) {
        if (node === null || node === undefined)
            return;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    Utilities.Clear_Element = Clear_Element;
    function Create_Option(value, label, selected) {
        if (selected === void 0) { selected = false; }
        var o = document.createElement("option");
        o.value = value;
        o.text = label;
        o.selected = selected;
        return o;
    }
    Utilities.Create_Option = Create_Option;
    function Get_Value(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        return e.value;
    }
    Utilities.Get_Value = Get_Value;
    function Set_Value(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.value = value;
    }
    Utilities.Set_Value = Set_Value;
    function Set_Text(e, value) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        Clear_Element(e);
        e.appendChild(document.createTextNode(value));
    }
    Utilities.Set_Text = Set_Text;
    function Show_Menu(elementId) {
        //let element = e.srcElement;
        // we expect the element's id to be in a "nav-XXX" name format, where 
        // XXX is the element we want to show 
        var id = elementId.replace("nav-", "");
        var menuItems = document.querySelectorAll("#menuTabs > li > a");
        if (menuItems.length > 0) {
            for (var i = 0; i < menuItems.length; i++) {
                var item = menuItems.item(i);
                if (item.id === elementId) {
                    item.parentElement.classList.add("is-active");
                }
                else {
                    item.parentElement.classList.remove("is-active");
                }
            }
        }
        Show_Hide_Selector("#views > section", id);
    }
    Utilities.Show_Menu = Show_Menu;
    function Handle_Tabs(tabSelector, containerSelector, id) {
        Activate_Inactivate_Selector(tabSelector, "nav-" + id);
        Show_Hide_Selector(containerSelector, id);
    }
    Utilities.Handle_Tabs = Handle_Tabs;
    function Activate_Inactivate_Selector(selector, id) {
        var sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (item.id === id) {
                    item.classList.add("is-active");
                }
                else {
                    item.classList.remove("is-active");
                }
            }
        }
    }
    Utilities.Activate_Inactivate_Selector = Activate_Inactivate_Selector;
    function Show_Hide_Selector(selector, id) {
        var sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (item.id === id) {
                    Show(item);
                }
                else {
                    Hide(item);
                }
            }
        }
    }
    Utilities.Show_Hide_Selector = Show_Hide_Selector;
    function Get(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json" //,"Upgrade-Insecure-Requests": "1"
            },
            cache: "no-cache",
            credentials: "include"
        })
            .then(function (response) {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Get = Get;
    function Post(url, data) {
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(function (response) {
            console.log('Post Response', response);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Post = Post;
    function Format_Amount(amount) {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    Utilities.Format_Amount = Format_Amount;
    function Format_Date(date) {
        if (date instanceof Date) {
            return date.toLocaleDateString('en-us');
        }
        return new Date(date).toLocaleDateString('en-US');
    }
    Utilities.Format_Date = Format_Date;
    function Validate_Text(e, errorElementId, errorText) {
        // this should only be used for required elements.
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var ele = e;
        ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.remove("is-danger") : ele.classList.remove("is-danger");
        var v = Get_Value(ele).trim();
        if (v.length == 0) {
            ele.tagName.toLowerCase() === "select" ? ele.parentElement.classList.add("is-danger") : ele.classList.add("is-danger");
            Error_Show(errorElementId, errorText);
            ele.focus();
            ele.scrollTo();
            return "";
        }
        return v;
    }
    Utilities.Validate_Text = Validate_Text;
    function Toggle_Loading_Button(e, disabled) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        var b = e;
        b.disabled = disabled;
        b.classList.toggle("is-loading", disabled);
    }
    Utilities.Toggle_Loading_Button = Toggle_Loading_Button;
    function Create_Menu_Element(menuItem) {
        var li = document.createElement("li");
        if (menuItem.selected)
            li.classList.add("is-active");
        var a = document.createElement("a");
        a.id = menuItem.id;
        a.onclick = function () {
            Update_Menu(menuItem);
        };
        if (menuItem.icon.length > 0) {
            var span = document.createElement("span");
            span.classList.add("icon");
            span.classList.add("is-medium");
            var i = document.createElement("i");
            var icons = menuItem.icon.split(" ");
            for (var _i = 0, icons_1 = icons; _i < icons_1.length; _i++) {
                var icon = icons_1[_i];
                i.classList.add(icon);
            }
            span.appendChild(i);
            a.appendChild(span);
        }
        a.appendChild(document.createTextNode(menuItem.label));
        li.appendChild(a);
        return li;
    }
    Utilities.Create_Menu_Element = Create_Menu_Element;
    function Update_Menu(menuItem) {
        Set_Text("menuTitle", menuItem.title);
        Set_Text("menuSubTitle", menuItem.subTitle);
        Show_Menu(menuItem.id);
        document.getElementById(menuItem.autofocusId).focus();
        PermitSearch.selected_tab = menuItem.label;
    }
    Utilities.Update_Menu = Update_Menu;
    function Build_Menu_Elements(target, Menus) {
        var menu = document.getElementById(target);
        for (var _i = 0, Menus_1 = Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Utilities.Build_Menu_Elements = Build_Menu_Elements;
    function CheckBrowser() {
        var browser = "";
        if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
            browser = 'Opera';
        }
        else if (navigator.userAgent.indexOf("Chrome") != -1) {
            browser = 'Chrome';
        }
        else if (navigator.userAgent.indexOf("Safari") != -1) {
            browser = 'Safari';
        }
        else if (navigator.userAgent.indexOf("Firefox") != -1) {
            browser = 'Firefox';
        }
        else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.DOCUMENT_NODE == true)) //IF IE > 10
         {
            browser = 'IE';
        }
        else {
            browser = 'unknown';
        }
        return browser;
    }
    Utilities.CheckBrowser = CheckBrowser;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=utilities.js.map
var Utilities;
(function (Utilities) {
    "use strict";
    var MenuItem = /** @class */ (function () {
        function MenuItem() {
        }
        return MenuItem;
    }());
    Utilities.MenuItem = MenuItem;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=menuitem.js.map
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var MasterPermit = /** @class */ (function () {
        function MasterPermit() {
        }
        MasterPermit.Get = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
                .then(function (permit) {
                console.log("master permit", permit);
                PermitSearch.LoadMasterPermit(permit);
            }, function (e) {
                console.log('error getting master permit ' + permit_number, e);
            });
        };
        return MasterPermit;
    }());
    PermitSearch.MasterPermit = MasterPermit;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=MasterPermit.js.map
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var AssociatedPermit = /** @class */ (function () {
        function AssociatedPermit() {
        }
        AssociatedPermit.Get = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
                .then(function (permit) {
                console.log("assoc permit", permit);
                PermitSearch.LoadAssocPermit(permit);
            }, function (e) {
                console.log('error getting assoc permit ' + permit_number, e);
            });
        };
        return AssociatedPermit;
    }());
    PermitSearch.AssociatedPermit = AssociatedPermit;
})(PermitSearch || (PermitSearch = {}));
//public string general_contractor_license_number { get; set; } = "";
//public string general_contractor_name { get; set; } = "";
//public DateTime void_date { get; set; } = DateTime.MinValue;
//public List < string > notes => permit.GetPermitNotes(permit_number);
//public List < hold > outstanding_holds
//public List < charge > permit_fees => charge.GetCharges(int.Parse(permit_number));
//# sourceMappingURL=AssociatedPermit.js.map
/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Permit = /** @class */ (function () {
        function Permit() {
            this.permit_number = 0;
            this.permit_type = "";
            this.days_since_last_passed_inspection = 0;
            this.address = "";
            this.issue_date = new Date();
            this.co_date = new Date();
            this.is_closed = false;
            this.passed_final_inspection = false;
            this.outstanding_hold_count = 0;
            this.total_charges = 0;
            this.paid_charges = 0;
            this.document_count = 0;
            this.has_related_permits = false;
            this.contractor_number = "";
            this.contractor_name = "";
            this.company_name = "";
            this.owner_name = "";
            this.parcel_number = "";
            this.pin_complete = "";
        }
        return Permit;
    }());
    PermitSearch.Permit = Permit;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=permit.js.map
/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Charge = /** @class */ (function () {
        function Charge() {
            this.item_id = -1;
            this.permit_number = -1;
            this.charge_description = "";
            this.narrative = "";
            this.amount = 0;
            this.cashier_id = "";
        }
        Charge.QueryCharges = function (permit_number) {
            Charge.ResetCharges();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Charges?permitnumber=" + permit_number.toString())
                .then(function (charges) {
                console.log("charges", charges);
                PermitSearch.permit_charges = charges;
                if (charges.length === 0) {
                    PermitSearch.CreateMessageRow(Charge.charges_container, 4, "No charges were found for this permit.");
                }
                else {
                    Charge.CreateTable(charges, Charge.charges_container);
                }
            }, function (e) {
                console.log('error getting charges', e);
            });
        };
        Charge.CreateTable = function (charges, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, charges_1 = charges; _i < charges_1.length; _i++) {
                var c = charges_1[_i];
                df.appendChild(Charge.CreateRow(c));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Charge.CreatePrintableViewTable = function (charges, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, charges_2 = charges; _i < charges_2.length; _i++) {
                var c = charges_2[_i];
                df.appendChild(Charge.CreatePrintablePermitRow(c));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Charge.ResetCharges = function () {
            PermitSearch.permit_charges = [];
            PermitSearch.CreateMessageRow(Charge.charges_container, 4, "Loading Charges...");
        };
        Charge.CreateRow = function (c) {
            var tr = document.createElement("tr");
            tr.appendChild(Charge.CreateCell(c.charge_description));
            var narrative = c.narrative !== c.charge_description ? c.narrative : "";
            tr.appendChild(Charge.CreateCell(narrative));
            tr.appendChild(Charge.CreateCell(Utilities.Format_Amount(c.amount), "has-text-right"));
            // need to display the following:
            // If the charge is paid, show Paid with a link to the receipt
            // If unpaid, Unpaid, and a link to claypay for that permit
            if (c.cashier_id.length === 0) {
                var permitLink = "https://public.claycountygov.com/claypay/#permit=" + c.permit_number.toString();
                tr.appendChild(Charge.CreateCellLink("Pay Now", "has-text-centered", permitLink));
            }
            else {
                var receiptLink = "https://public.claycountygov.com/claypay/#cashierid=" + c.cashier_id;
                tr.appendChild(Charge.CreateCellLink("View Receipt", "has-text-centered", receiptLink));
            }
            //tr.appendChild(Charge.CreateCell("View", "has-text-centered"));
            return tr;
        };
        Charge.CreatePrintablePermitRow = function (c) {
            var tr = document.createElement("tr");
            tr.appendChild(Charge.CreateCell(c.permit_number.toString()));
            tr.appendChild(Charge.CreateCell(c.charge_description));
            var narrative = c.narrative !== c.charge_description ? c.narrative : "";
            tr.appendChild(Charge.CreateCell(narrative));
            tr.appendChild(Charge.CreateCell(Utilities.Format_Amount(c.amount), "has-text-right"));
            if (c.cashier_id.length === 0) {
                tr.appendChild(Charge.CreateCell(""));
            }
            else {
                tr.appendChild(Charge.CreateCell(c.cashier_id, "has-text-centered"));
            }
            return tr;
        };
        Charge.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Charge.CreateCellLink = function (value, className, href) {
            if (className === void 0) { className = ""; }
            if (href === void 0) { href = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            var link = document.createElement("a");
            link.classList.add("has-text-link");
            link.target = "_blank";
            link.rel = "noopener";
            link.href = href;
            link.appendChild(document.createTextNode(value));
            link.setAttribute("aria-label", "View on Claypay");
            td.appendChild(link);
            return td;
        };
        Charge.charges_container = "chargeContainer";
        return Charge;
    }());
    PermitSearch.Charge = Charge;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=charge.js.map
/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    var Document = /** @class */ (function () {
        //static download_icon: string = "content/48x48 document-save.png";
        function Document() {
            this.table_number = -1;
            this.object_id = -1;
            this.permit_number = -1;
            this.document_type = "";
            this.page_count = 0;
            this.created_on = new Date();
        }
        Document.CreateDocumentDownloadLink = function (table_number, object_id) {
            return "//publicrecords.claycountygov.com/GetFile?t=" + table_number.toString() + "&o=" + object_id.toString();
        };
        Document.QueryDocuments = function (permit_number) {
            Document.ResetDocuments();
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Documents?permitnumber=" + permit_number.toString())
                .then(function (documents) {
                console.log("documents", documents);
                PermitSearch.permit_documents = documents;
                Document.ResetDocumentTypeFilter();
                if (documents.length === 0) {
                    PermitSearch.CreateMessageRow(Document.documents_container, 4, "No documents were found for this permit.");
                }
                else {
                    Document.CreateDocumentsTable(documents);
                    Document.PopulateDocumentTypeFilter(documents);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(Document.documents_container, 4, "There was an issue retrieving the documents for this permit.  Please try again.");
                console.log('error getting permits', e);
            });
        };
        Document.ResetDocumentTypeFilter = function () {
            var dtf = document.getElementById(Document.document_type_filter);
            Utilities.Clear_Element(dtf);
            dtf.disabled = true;
            var allTypes = document.createElement("option");
            allTypes.text = "Show All";
            allTypes.value = "all";
            allTypes.selected = true;
            dtf.add(allTypes, 0);
        };
        Document.PopulateDocumentTypeFilter = function (documents) {
            var dtf = document.getElementById(Document.document_type_filter);
            dtf.disabled = false;
            var distinct = [];
            for (var _i = 0, documents_1 = documents; _i < documents_1.length; _i++) {
                var d = documents_1[_i];
                if (distinct.indexOf(d.document_type) === -1) {
                    distinct.push(d.document_type);
                }
            }
            distinct.sort();
            for (var _a = 0, distinct_1 = distinct; _a < distinct_1.length; _a++) {
                var d = distinct_1[_a];
                var option = document.createElement("option");
                option.value = d;
                option.text = d;
                dtf.add(option);
            }
        };
        Document.FilterDocuments = function () {
            var documentType = Utilities.Get_Value("documentTypeFilter");
            if (documentType === "all") {
                Document.CreateDocumentsTable(PermitSearch.permit_documents);
            }
            else {
                var filtered = PermitSearch.permit_documents.filter(function (j) { return j.document_type === documentType; });
                Document.CreateDocumentsTable(filtered);
            }
        };
        Document.CreateDocumentsTable = function (documents) {
            var df = document.createDocumentFragment();
            for (var _i = 0, documents_2 = documents; _i < documents_2.length; _i++) {
                var d = documents_2[_i];
                df.appendChild(Document.CreateDocumentsRow(d));
            }
            var tbody = document.getElementById(Document.documents_container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Document.ResetDocuments = function () {
            PermitSearch.permit_documents = [];
            PermitSearch.CreateMessageRow(Document.documents_container, 4, "Loading Documents...");
        };
        Document.CreateDocumentsRow = function (d) {
            var tr = document.createElement("tr");
            var link = Document.CreateDocumentDownloadLink(d.table_number, d.object_id);
            tr.appendChild(Document.CreateDocumentsCellLink("", link));
            tr.appendChild(Document.CreateDocumentsCell(d.document_type));
            tr.appendChild(Document.CreateDocumentsCell(d.page_count.toString(), "has-text-left"));
            tr.appendChild(Document.CreateDocumentsCell(Utilities.Format_Date(d.created_on)));
            return tr;
        };
        Document.CreateDocumentsCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Document.CreateDocumentsCellLink = function (className, href) {
            if (className === void 0) { className = ""; }
            if (href === void 0) { href = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            var link = document.createElement("a");
            var downloadIcon = document.createElement("i");
            downloadIcon.classList.add("show");
            downloadIcon.classList.add("fas");
            downloadIcon.classList.add("fa-download");
            downloadIcon.style.color = "#20bc56";
            link.classList.add("has-text-link");
            link.href = href;
            link.appendChild(downloadIcon);
            link.setAttribute("aria-label", "Download Document");
            link.onclick = function () {
                Utilities.Clear_Element(link);
                var successIcon = document.createElement("i");
                successIcon.classList.add("hide");
                successIcon.classList.add("fas");
                successIcon.classList.add("fa-check-circle");
                successIcon.style.color = "#20bc56";
                link.appendChild(successIcon);
            };
            td.appendChild(link);
            return td;
        };
        Document.documents_container = "documentContainer";
        Document.document_type_filter = "documentTypeFilter";
        return Document;
    }());
    PermitSearch.Document = Document;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=document.js.map
/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    var Hold = /** @class */ (function () {
        function Hold() {
        }
        Hold.QueryHolds = function (permit_number) {
            var path = PermitSearch.GetPath();
            Utilities.Get(path + "API/Permit/Holds?permitnumber=" + permit_number.toString())
                .then(function (holds) {
                console.log("holds", holds);
                PermitSearch.permit_holds = holds;
                if (holds.length === 0) {
                    PermitSearch.CreateMessageRow(Hold.holds_container, 1, "No Holds were found for this permit.");
                }
                else {
                    Hold.CreateDocumentsTable(holds, Hold.holds_container);
                }
            }, function (e) {
                PermitSearch.CreateMessageRow(Hold.holds_container, 4, "There was an issue retrieving the holds for this permit.  Please try again.");
                console.log('error getting holds', e);
            });
        };
        Hold.ResetHolds = function () {
            PermitSearch.permit_holds = [];
            PermitSearch.CreateMessageRow(Hold.holds_container, 4, "Loading Holds...");
        };
        Hold.CreateDocumentsTable = function (holds, container) {
            var df = document.createDocumentFragment();
            for (var _i = 0, holds_1 = holds; _i < holds_1.length; _i++) {
                var h = holds_1[_i];
                df.appendChild(Hold.CreateRow(h));
            }
            var tbody = document.getElementById(container);
            Utilities.Clear_Element(tbody);
            tbody.appendChild(df);
        };
        Hold.CreateRow = function (h) {
            var tr = document.createElement("tr");
            tr.appendChild(Hold.CreateCell(h.description));
            return tr;
        };
        Hold.CreateCell = function (value, className) {
            if (className === void 0) { className = ""; }
            var td = document.createElement("td");
            if (className.length > 0)
                td.classList.add(className);
            td.appendChild(document.createTextNode(value));
            return td;
        };
        Hold.holds_container = "holdContainer";
        return Hold;
    }());
    PermitSearch.Hold = Hold;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=hold.js.map
/// <reference path="app.ts" />
var PermitSearch;
(function (PermitSearch) {
    var LocationHash = /** @class */ (function () {
        function LocationHash(locationHash) {
            this.permit_number = "";
            this.permit_display = "";
            this.permit_status = "all";
            this.contractor_number = "";
            this.contractor_name = "";
            this.company_name = "";
            this.street_number = "";
            this.street_name = "";
            this.parcel_number = "";
            this.owner_name = "";
            this.page = "1";
            this.tab = "";
            this.sort_on = "issuedate";
            this.sort_direction = "D";
            if (locationHash.length > 0) {
                var ha = locationHash.split("&");
                for (var i = 0; i < ha.length; i++) {
                    var k = ha[i].split("=");
                    switch (k[0].toLowerCase()) {
                        case "permitnumber":
                            this.permit_number = k[1];
                            break;
                        case "permitdisplay":
                            this.permit_display = k[1];
                            break;
                        case "status":
                            this.permit_status = k[1];
                            break;
                        case "contractorid":
                            this.contractor_number = k[1];
                            break;
                        case "contractorname":
                            this.contractor_name = k[1];
                            break;
                        case "companyname":
                            this.company_name = k[1];
                            break;
                        case "streetnumber":
                            this.street_number = k[1];
                            break;
                        case "streetname":
                            this.street_name = k[1];
                            break;
                        case "owner":
                            this.owner_name = k[1];
                            break;
                        case "parcel":
                            this.parcel_number = k[1];
                            break;
                        case "page":
                            this.page = k[1];
                            break;
                        case "tab":
                            this.tab = k[1];
                            break;
                        case "sortdirection":
                            this.sort_direction = k[1];
                            break;
                        case "sortfield":
                            this.sort_on = k[1];
                            break;
                    }
                }
                //this.UpdateInputs();
            }
            else {
                this.ReadInputs();
            }
        }
        LocationHash.prototype.UpdateInputs = function () {
            Utilities.Set_Value("permitStatus", this.permit_status);
            Utilities.Set_Value("permitSearch", this.permit_number);
            Utilities.Set_Value("streetNumberSearch", this.street_number);
            Utilities.Set_Value("streetNameSearch", this.street_name);
            Utilities.Set_Value("parcelSearch", this.parcel_number);
            Utilities.Set_Value("ownerSearch", this.owner_name);
            Utilities.Set_Value("contractorNumberSearch", this.contractor_number);
            Utilities.Set_Value("contractorNameSearch", this.contractor_name);
            Utilities.Set_Value("companyNameSearch", this.company_name);
        };
        LocationHash.prototype.ReadInputs = function () {
            this.permit_status = Utilities.Get_Value("permitStatus").trim();
            this.permit_number = Utilities.Get_Value("permitSearch").trim();
            //if (this.permit_number.length > 0) this.permit_display = this.permit_number;
            this.street_number = Utilities.Get_Value("streetNumberSearch").trim();
            this.street_name = Utilities.Get_Value("streetNameSearch").trim();
            this.parcel_number = Utilities.Get_Value("parcelSearch").trim();
            this.owner_name = Utilities.Get_Value("ownerSearch").trim();
            this.contractor_number = Utilities.Get_Value("contractorNumberSearch").trim();
            this.contractor_name = Utilities.Get_Value("contractorNameSearch").trim();
            this.company_name = Utilities.Get_Value("companyNameSearch").trim();
        };
        LocationHash.prototype.ReadyToSearch = function () {
            switch (this.tab.toLowerCase()) {
                case "permit":
                    return (this.permit_number.length > 0);
                case "address":
                    return (this.street_number.length > 0) ||
                        (this.street_name.length > 0);
                case "contractor":
                    return (this.contractor_number.length > 0) ||
                        (this.contractor_name.length > 0) ||
                        (this.company_name.length > 0);
                case "owner":
                    return (this.owner_name.length > 0);
                case "parcel":
                    return (this.parcel_number.length > 0);
                case "":
                    break;
            }
        };
        LocationHash.prototype.ToHash = function () {
            var h = "";
            h += LocationHash.AddToHash(this.tab, "tab");
            h += LocationHash.AddToHash(this.permit_display, "permitdisplay");
            h += LocationHash.AddToHash(this.sort_on, "sortfield");
            h += LocationHash.AddToHash(this.sort_direction, "sortdirection");
            switch (this.tab.toLowerCase()) {
                case "permit":
                    h += LocationHash.AddToHash(this.permit_number, "permitnumber");
                    break;
                case "address":
                    h += LocationHash.AddToHash(this.street_number, "streetnumber");
                    h += LocationHash.AddToHash(this.street_name, "streetname");
                    break;
                case "contractor":
                    h += LocationHash.AddToHash(this.contractor_number, "contractorid");
                    h += LocationHash.AddToHash(this.contractor_name, "contractorname");
                    h += LocationHash.AddToHash(this.company_name, "companyname");
                    break;
                case "owner":
                    h += LocationHash.AddToHash(this.owner_name, "owner");
                    break;
                case "parcel":
                    h += LocationHash.AddToHash(this.parcel_number, "parcel");
                    break;
            }
            if (h.length === 0)
                return "";
            h += LocationHash.AddToHash(this.permit_status, "status");
            h += LocationHash.AddToHash(this.page, "page");
            if (h.length > 0) {
                h = "#" + h.substring(1) + "&v=" + new Date().getMilliseconds().toString();
            }
            return h;
        };
        LocationHash.prototype.ReadyToTogglePermit = function (oldHash) {
            // This function simply checks to see if the old search
            // is identical to the new search with the exception of the permit_display
            // argument.  If it is, then we just toggle display of the permit detail,
            // and we don't actually hit the database again.
            if (oldHash === null)
                return false;
            if ((this.permit_display.length > 0 && oldHash.permit_display.length === 0)
                || this.permit_display.length === 0 && oldHash.permit_display.length > 0) {
                return this.permit_number === oldHash.permit_number &&
                    this.company_name === oldHash.company_name &&
                    this.contractor_name === oldHash.contractor_name &&
                    this.contractor_number === oldHash.contractor_number &&
                    this.owner_name === oldHash.owner_name &&
                    this.page === oldHash.page &&
                    this.parcel_number === oldHash.parcel_number &&
                    this.permit_status === oldHash.permit_status &&
                    this.street_name === oldHash.street_name &&
                    this.street_number === oldHash.street_number;
            }
            return false;
        };
        LocationHash.AddToHash = function (field, arg) {
            if (field.length > 0)
                return "&" + arg + "=" + field;
            return "";
        };
        return LocationHash;
    }());
    PermitSearch.LocationHash = LocationHash;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=locationhash.js.map
/// <reference path="../utilities/menuitem.ts" />
/// <reference path="../utilities/utilities.ts" />
/// <reference path="locationhash.ts" />
/// <reference path="permit.ts" />
var PermitSearch;
(function (PermitSearch) {
    "use strict";
    PermitSearch.permit_count = 0;
    PermitSearch.search_results = [];
    PermitSearch.permit_documents = [];
    PermitSearch.permit_holds = [];
    PermitSearch.permit_charges = [];
    PermitSearch.selected_tab = "permit";
    PermitSearch.Menus = [
        {
            id: "nav-permitSearchOptions",
            title: "Search by Permit Number",
            subTitle: "Searching by Permit number will show you all of the information for that specific permit.",
            icon: "fas fa-file",
            label: "Permit",
            selected: true,
            autofocusId: "permitSearch"
        },
        {
            id: "nav-addressSearchOptions",
            title: "Search by Street Address",
            subTitle: "Search for permits by any combination of Street Number and Street Name.  Partial street names are allowed. ",
            icon: "fas fa-home",
            label: "Address",
            selected: false,
            autofocusId: "streetNumberSearch"
        },
        {
            id: "nav-contractorSearchOptions",
            title: "Search by Contractor",
            subTitle: "Search for permits by Contractor Name, Company Name, or Contractor ID.  Enter any combination of Name, Number, or Company Name.",
            icon: "fas fa-users",
            label: "Contractor",
            selected: false,
            autofocusId: "contractorNumberSearch"
        },
        {
            id: "nav-ownerSearchOptions",
            title: "Search by Owner Name",
            subTitle: "Search for permits by Owner Name.  Partial owner names are permitted.",
            icon: "fas fa-user",
            label: "Owner",
            selected: false,
            autofocusId: "ownerSearch"
        },
        {
            id: "nav-parcelSearchOptions",
            title: "Search by Parcel Number",
            subTitle: "Search for permits by parcel number.",
            icon: "fas fa-map",
            label: "Parcel",
            selected: false,
            autofocusId: "parcelSearch"
        },
    ];
    function Start() {
        Utilities.Build_Menu_Elements("menuTabs", PermitSearch.Menus);
        window.onhashchange = HandleHash;
        if (location.hash.length > 1) {
            HandleHash(null);
        }
        GetDateUpdated();
        setInterval(function () { GetDateUpdated(); }, 60000);
        HandleInputs();
        HandleResetButtons();
    }
    PermitSearch.Start = Start;
    function HandleInputs() {
        var sections = document.querySelectorAll("#views > section input");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                item.onkeydown = function (event) {
                    var e = event || window.event;
                    if (event.keyCode == 13) {
                        Search();
                    }
                };
            }
        }
    }
    function HandleResetButtons() {
        var sections = document.querySelectorAll("#searchButtons button.is-reset");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                item.onclick = function () { return ResetSearch(); };
            }
        }
    }
    function GetDateUpdated() {
        var path = GetPath();
        Utilities.Get(path + "API/Timing")
            .then(function (dateUpdated) {
            PermitSearch.date_updated = dateUpdated;
            var timeContainer = document.getElementById("updateTimeContainer");
            var time = document.getElementById("updateTime");
            Utilities.Clear_Element(time);
            time.appendChild(document.createTextNode(new Date(PermitSearch.date_updated).toLocaleString('en-us')));
            Utilities.Show(timeContainer);
        }, function (e) {
            console.log('error getting date updated', e);
        });
    }
    function Search() {
        Toggle_Loading_Search_Buttons(true);
        var newHash = new PermitSearch.LocationHash("");
        newHash.tab = PermitSearch.selected_tab;
        location.hash = newHash.ToHash();
    }
    PermitSearch.Search = Search;
    function CreatePrintPermitPreview() {
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var permit_number = parseInt(currentHash.permit_display);
        console.log('permit number we want to print', permit_number);
        var path = GetPath();
        if ((permit_number > 10000 && permit_number < 20000000 /* LOWEST PERMITNUMBER FOUND is 00010001 */) ||
            (permit_number > 89999999 && permit_number < 100000000)) {
            console.log('getting master permit');
            //Utilities.Get<MasterPermit>(path + "API/Permit/PrintPermit?permit_number=" + permit_number);
            PermitSearch.MasterPermit.Get(permit_number.toString());
        }
        else {
            console.log('getting assoc permit');
            PermitSearch.AssociatedPermit.Get(permit_number.toString());
        }
    }
    PermitSearch.CreatePrintPermitPreview = CreatePrintPermitPreview;
    function LoadMasterPermit(permit) {
        // don't forget to do something with flood data
        Toggle_Master_Permit_Only(true);
        Toggle_Assoc_Permit_Only(false);
        var permitTitle = "Building Permit # " + permit.permit_number;
        if (new Date(permit.void_date).getFullYear() !== 1)
            permitTitle += " VOIDED";
        Utilities.Set_Text("printablePermitTitle", permitTitle);
        Utilities.Set_Text("printablePermitIssueDate", Utilities.Format_Date(permit.issue_date));
        Utilities.Set_Text("printablePermitParcel", permit.parcel_number);
        Utilities.Set_Text("printablePermitProposedUse", permit.proposed_use);
        Utilities.Set_Text("printablePermitValuation", Utilities.Format_Amount(permit.valuation));
        Utilities.Set_Text("printablePermitLegal", permit.legal);
        Utilities.Set_Text("printablePermitProjectAddress", permit.project_address);
        Utilities.Set_Text("printablePermitOwner", permit.owner_name);
        Utilities.Set_Text("printablePermitOwnerAddress", permit.owner_address);
        Utilities.Set_Text("printablePermitContractor1", permit.contractor_data_line1);
        Utilities.Set_Text("printablePermitContractor2", permit.contractor_data_line2);
        Utilities.Set_Text("printablePermitContractor3", permit.contractor_data_line3);
        var info = document.getElementById("printablePermitInformation");
        Utilities.Clear_Element(info);
        for (var _i = 0, _a = permit.notes; _i < _a.length; _i++) {
            var n = _a[_i];
            var p = document.createElement("p");
            p.appendChild(document.createTextNode(n));
            info.appendChild(p);
        }
        if (permit.outstanding_holds.length === 0) {
            PermitSearch.CreateMessageRow("printablePermitHoldContainer", 1, "No outstanding holds were found for this permit.");
        }
        else {
            PermitSearch.Hold.CreateDocumentsTable(permit.outstanding_holds, "printablePermitHoldContainer");
        }
        if (permit.permit_fees.length === 0) {
            PermitSearch.CreateMessageRow("printablePermitFeeContainer", 4, "No charges were found for this permit.");
        }
        else {
            PermitSearch.Charge.CreatePrintableViewTable(permit.permit_fees, "printablePermitFeeContainer");
        }
        FinalizePrintablePermit();
    }
    PermitSearch.LoadMasterPermit = LoadMasterPermit;
    function LoadAssocPermit(permit) {
        // don't forget to do something with flood data
        Toggle_Master_Permit_Only(false);
        Toggle_Assoc_Permit_Only(true);
        var permitTitle = permit.permit_type_string + " Permit # " + permit.permit_number;
        if (new Date(permit.void_date).getFullYear() !== 1)
            permitTitle += " VOIDED";
        Utilities.Set_Text("printablePermitTitle", permitTitle);
        Utilities.Set_Text("printablePermitIssueDate", Utilities.Format_Date(permit.issue_date));
        Utilities.Set_Text("printablePermitParcel", permit.parcel_number);
        var propuse = "N/A";
        if (permit.proposed_use.trim().length > 0)
            propuse = permit.proposed_use.trim();
        Utilities.Set_Text("printablePermitProposedUse", propuse);
        Utilities.Set_Text("printablePermitValuation", Utilities.Format_Amount(permit.valuation));
        var legal = "N/A";
        if (permit.legal.length > 0)
            legal = permit.legal;
        Utilities.Set_Text("printablePermitLegal", legal);
        Utilities.Set_Text("printablePermitProjectAddress", permit.project_address);
        Utilities.Set_Text("printablePermitOwner", permit.owner_name);
        Utilities.Set_Text("printablePermitOwnerAddress", permit.owner_address);
        Utilities.Set_Text("printablePermitContractor1", permit.contractor_data_line1);
        Utilities.Set_Text("printablePermitContractor2", permit.contractor_data_line2);
        Utilities.Set_Text("printablePermitContractor3", permit.contractor_data_line3);
        if (permit.master_permit_number.length === 0) {
            Utilities.Set_Text("printablePermitMasterPermitNumber", "");
            Utilities.Set_Text("printablePermitMasterContractorNumber", "");
            Utilities.Set_Text("printablePermitMasterContractorName", "");
            Utilities.Set_Text("printablePermitMasterPermitTitle", "");
            Utilities.Hide("master-permit-container");
            Utilities.Hide("printablePermitMasterPermitTitle");
        }
        else {
            Utilities.Show("master-permit-container");
            Utilities.Show("printablePermitMasterPermitTitle");
            Utilities.Set_Text("printablePermitMasterPermitTitle", "Master Permit # " + permit.master_permit_number);
            Utilities.Set_Text("printablePermitMasterPermitNumber", permit.master_permit_number);
            Utilities.Set_Text("printablePermitMasterContractorNumber", permit.general_contractor_license_number);
            Utilities.Set_Text("printablePermitMasterContractorName", permit.general_contractor_name);
        }
        var info = document.getElementById("printablePermitInformation");
        Utilities.Clear_Element(info);
        for (var _i = 0, _a = permit.notes; _i < _a.length; _i++) {
            var n = _a[_i];
            var p = document.createElement("p");
            p.appendChild(document.createTextNode(n));
            info.appendChild(p);
        }
        if (permit.outstanding_holds.length === 0) {
            PermitSearch.CreateMessageRow("printablePermitHoldContainer", 1, "No outstanding holds were found for this permit.");
        }
        else {
            PermitSearch.Hold.CreateDocumentsTable(permit.outstanding_holds, "printablePermitHoldContainer");
        }
        if (permit.permit_fees.length === 0) {
            PermitSearch.CreateMessageRow("printablePermitFeeContainer", 4, "No charges were found for this permit.");
        }
        else {
            PermitSearch.Charge.CreatePrintableViewTable(permit.permit_fees, "printablePermitFeeContainer");
        }
        FinalizePrintablePermit();
    }
    PermitSearch.LoadAssocPermit = LoadAssocPermit;
    function FinalizePrintablePermit() {
        PermitSearch.CloseModals();
        Utilities.Hide("views");
        Utilities.Show("printablePermit");
    }
    function Toggle_Loading_Search_Buttons(disabled) {
        var sections = document.querySelectorAll("#views > section button");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                Utilities.Toggle_Loading_Button(item, disabled);
            }
        }
    }
    function Toggle_Master_Permit_Only(show) {
        var sections = document.querySelectorAll("#printablePermit .master-permit-only");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                if (show) {
                    Utilities.Show(sections.item(i));
                }
                else {
                    Utilities.Hide(sections.item(i));
                }
            }
        }
    }
    function Toggle_Assoc_Permit_Only(show) {
        var sections = document.querySelectorAll("#printablePermit .assoc-permit-only");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                if (show) {
                    Utilities.Show(sections.item(i));
                }
                else {
                    Utilities.Hide(sections.item(i));
                }
            }
        }
    }
    function HandleHash(event) {
        Utilities.Clear_Element(document.getElementById("permitSearchError"));
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var newHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var oldHash = null;
        // if the event is null, we're loading this off of the initial
        // page load.  
        if (event !== null) {
            var hash = event.oldURL.split("#");
            if (hash.length === 2) {
                oldHash = new PermitSearch.LocationHash(hash[1]);
            }
        }
        else {
            currentHash.UpdateInputs();
        }
        if (newHash.ReadyToTogglePermit(oldHash)) {
            TogglePermitDisplay(newHash.permit_display);
            Toggle_Loading_Search_Buttons(false);
        }
        else {
            if (currentHash.ReadyToSearch()) {
                Query(currentHash);
            }
            else {
                Toggle_Loading_Search_Buttons(false);
            }
        }
    }
    PermitSearch.HandleHash = HandleHash;
    function TogglePermitDisplay(permit_number) {
        // this function will either hide or show the the permit modals
        // based on if the permit number has a length or not.
        var permitModal = document.getElementById("selectedPermit");
        var permitErrorModal = document.getElementById("selectedPermitError");
        if (permit_number.length === 0) {
            permitErrorModal.classList.remove("is-active");
            permitModal.classList.remove("is-active");
            return;
        }
        var permit = PermitSearch.search_results.filter(function (j) {
            return j.permit_number.toString() === permit_number;
        });
        if (permit.length > 0) {
            ViewPermitDetail(permit[0]);
            permitModal.classList.add("is-active");
        }
        else {
            Utilities.Set_Text("permitNumberError", permit_number);
            permitErrorModal.classList.add("is-active");
        }
    }
    function Query(currentHash) {
        var path = GetPath();
        var newHash = currentHash.ToHash();
        var searchHash = "?" + newHash.substring(1);
        console.log('hash', newHash);
        // Get the list of permits for this search
        Utilities.Get(path + "API/Search/Permit" + searchHash)
            .then(function (permits) {
            console.log("permits", permits);
            PermitSearch.search_results = permits;
            if (PermitSearch.search_results.length > 0) {
                console.log('permits found');
                Utilities.Show("searchResults");
                CreateResultsTable(PermitSearch.search_results);
                if (currentHash.permit_display.length > 0) {
                    TogglePermitDisplay(currentHash.permit_display);
                }
            }
            else {
                console.log('no permits found');
                Utilities.Hide("searchResults");
                Utilities.Error_Show("permitSearchError", "No permits found for this search.", true);
                // Show that we got no search results
            }
            Toggle_Loading_Search_Buttons(false);
        }, function (e) {
            console.log('error getting permits', e);
            Toggle_Loading_Search_Buttons(false);
        });
        // Get the number of permits returned for this search to be used by 
        // our pagination system.
        Utilities.Get(path + "API/Search/Count" + searchHash)
            .then(function (permitCount) {
            PermitSearch.permit_count = permitCount;
            HandlePagination(PermitSearch.permit_count, parseInt(currentHash.page), 20, currentHash);
            // update pagination here
            console.log("count", permitCount, new Date());
        }, function (e) {
            console.log('error getting permit count', e);
        });
    }
    function CreateResultsTable(permits) {
        // The table and headers will already exist, we'll just
        // clear and populate the table body with table rows.
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var df = document.createDocumentFragment();
        CreateResultsHeaderRow(currentHash.tab);
        for (var _i = 0, permits_1 = permits; _i < permits_1.length; _i++) {
            var p = permits_1[_i];
            df.appendChild(CreateResultsRow(p, currentHash));
        }
        var tbody = document.getElementById("resultsBody");
        Utilities.Clear_Element(tbody);
        tbody.appendChild(df);
        var results = document.getElementById("searchResults");
        results.scrollIntoView();
    }
    function CreateResultsHeaderRow(rowType) {
        var df = document.createDocumentFragment();
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsHeaderCell("Permit", "", "8.5%", "permit"));
        tr.appendChild(CreateResultsHeaderCell("Status", "", "9%", "status"));
        tr.appendChild(CreateResultsHeaderCell("Issued", "", "7.5%", "issuedate"));
        tr.appendChild(CreateResultsHeaderCell("Address", "has-text-left", "30%", "address"));
        switch (rowType.toLowerCase()) {
            case "contractor":
                tr.appendChild(CreateResultsHeaderCell("Contractor", "", "12%", "contractorname"));
                tr.appendChild(CreateResultsHeaderCell("Company", "", "15%", "company"));
                tr.appendChild(CreateResultsHeaderCell("Age", "has-text-right", "8%", "age"));
                break;
            case "owner":
                tr.appendChild(CreateResultsHeaderCell("Owner Name", "", "15%", "owner"));
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                break;
            case "parcel":
                tr.appendChild(CreateResultsHeaderCell("Parcel #", "", "15%", "parcel"));
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                break;
            case "permit":
            case "address":
            default:
                // we want permit / address to be the default
                tr.appendChild(CreateResultsHeaderCell("Unpaid Charges", "has-text-right", "20%", "charges"));
                tr.appendChild(CreateResultsHeaderCell("Documents", "", "15%", "documents"));
        }
        tr.appendChild(CreateResultsHeaderCell("Inspections", "", "10%", ""));
        df.appendChild(tr);
        var head = document.getElementById("resultsHead");
        Utilities.Clear_Element(head);
        head.appendChild(df);
    }
    function CreateResultsRow(p, currentHash) {
        currentHash.permit_display = p.permit_number.toString();
        var inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + p.permit_number.toString();
        var tr = document.createElement("tr");
        tr.appendChild(CreateResultsCellLink(p.permit_number.toString().padStart(8, "0"), "", currentHash.ToHash()));
        tr.appendChild(CreateResultsCell(p.is_closed ? "Closed" : "Open"));
        if (new Date(p.issue_date).getFullYear() !== 1) {
            tr.appendChild(CreateResultsCell(Utilities.Format_Date(p.issue_date)));
        }
        else {
            tr.appendChild(CreateResultsCell("Not Issued"));
        }
        tr.appendChild(CreateResultsCell(p.address, "has-text-left"));
        switch (currentHash.tab.toLowerCase()) {
            case "contractor":
                tr.appendChild(CreateResultsCell(p.contractor_name));
                tr.appendChild(CreateResultsCell(p.company_name));
                tr.appendChild(CreateResultsCell(p.days_since_last_passed_inspection.toString()));
                break;
            case "owner":
                tr.appendChild(CreateResultsCell(p.owner_name));
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                break;
            case "parcel":
                tr.appendChild(CreateResultsCell(p.parcel_number));
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                break;
            case "permit":
            case "address":
            default:
                tr.appendChild(CreateResultsCell(Utilities.Format_Amount(p.total_charges - p.paid_charges), "has-text-right"));
                tr.appendChild(CreateResultsCell(p.document_count.toString()));
        }
        tr.appendChild(CreateResultsCellLink(p.passed_final_inspection ? "Completed" : "View", "", inspectionLink, true));
        return tr;
    }
    function CreateResultsHeaderCell(heading, className, width, field) {
        if (className === void 0) { className = ""; }
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        var th = document.createElement("th");
        th.style.width = width;
        if (className.length > 0)
            th.classList.add(className);
        if (field.length > 0) {
            var link = document.createElement("a");
            currentHash.sort_on = field;
            currentHash.sort_direction = currentHash.sort_direction == "A" ? "D" : "A";
            currentHash.page = "1";
            link.href = currentHash.ToHash();
            link.classList.add("has-text-link");
            link.appendChild(document.createTextNode(heading));
            var icon = document.createElement("span");
            icon.classList.add("icon");
            var i = document.createElement("i");
            i.classList.add("fas");
            i.classList.add("fa-sort");
            icon.appendChild(i);
            link.appendChild(icon);
            th.appendChild(link);
        }
        else {
            th.appendChild(document.createTextNode(heading));
        }
        return th;
    }
    function CreateResultsCell(value, className) {
        if (className === void 0) { className = ""; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        td.appendChild(document.createTextNode(value));
        return td;
    }
    function CreateResultsCellLink(value, className, href, newTab) {
        if (className === void 0) { className = ""; }
        if (href === void 0) { href = ""; }
        if (newTab === void 0) { newTab = false; }
        var td = document.createElement("td");
        if (className.length > 0)
            td.classList.add(className);
        var link = document.createElement("a");
        link.classList.add("has-text-link");
        if (newTab) {
            link.rel = "noopener";
            link.target = "_blank";
        }
        link.href = href;
        link.appendChild(document.createTextNode(value));
        td.appendChild(link);
        return td;
    }
    function HandlePagination(totalCount, currentPage, pageSize, currentHash) {
        // we'll need to enable/disable the previous / next buttons based on 
        // if we're on the first/last page
        var totalPages = Math.ceil(totalCount / pageSize);
        // Handle next/previous pages
        var previousPage = document.getElementById("resultsPreviousPage");
        var nextPage = document.getElementById("resultsNextPage");
        if (currentPage === 1) {
            previousPage.setAttribute("disabled", "");
            previousPage.href = "";
        }
        else {
            previousPage.removeAttribute("disabled");
            currentHash.page = (currentPage - 1).toString();
            previousPage.href = currentHash.ToHash();
        }
        if (currentPage === totalPages) {
            nextPage.href = "";
            nextPage.setAttribute("disabled", "");
        }
        else {
            nextPage.removeAttribute("disabled");
            currentHash.page = (currentPage + 1).toString();
            nextPage.href = currentHash.ToHash();
        }
        // now that we've handled the next/previous buttons, let's reset the current page in the hash.
        currentHash.page = currentPage.toString();
        var pageList = document.getElementById("resultsPaginationList");
        Utilities.Clear_Element(pageList);
        pageList.appendChild(CreatePaginationLinks(totalPages, currentPage, currentHash));
    }
    function CreatePaginationLinks(totalPages, currentPage, currentHash) {
        // Scenarios
        // if the number of pages is 7 or less
        //    create a link for every page
        //    nothing else to worry about
        // if the number of pages is > 7 
        //    if the current page is 2 or less or total pages - 2 or more
        //      show pages 1 through 3 an ellipsis, and then last page - 3 to last page
        //    if the current page is 3 or total pages - 3 
        //      show pages 1 through 4 an ellipsis, and then last page - 2 to last page
        // Otherwise
        //    show page 1 then an ellipsis then currentpage - 1 through current page + 1 then last page
        var df = document.createDocumentFragment();
        if (currentPage < 1)
            currentPage = 1;
        if (currentPage > totalPages)
            currentPage = totalPages;
        if (totalPages < 8) {
            // add a link to every page
            for (var i = 1; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage === 3) {
            for (var i = 1; i <= 4; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 1; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage === (totalPages - 2)) {
            for (var i = 1; i <= 2; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 3; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        if (currentPage < 3 || currentPage > totalPages - 3) {
            // add links to the first 3 pages and last 3 pages
            for (var i = 1; i <= 3; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            df.appendChild(CreatePaginationEllipsis());
            for (var i = totalPages - 2; i <= totalPages; i++) {
                df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
            }
            return df;
        }
        // add links to the first page, currentpage -1 through currentpage + 1, and last page
        df.appendChild(CreatePaginationLink(1, false, currentHash));
        df.appendChild(CreatePaginationEllipsis());
        for (var i = currentPage - 1; i <= currentPage + 1; i++) {
            df.appendChild(CreatePaginationLink(i, i === currentPage, currentHash));
        }
        df.appendChild(CreatePaginationEllipsis());
        df.appendChild(CreatePaginationLink(totalPages, false, currentHash));
        return df;
    }
    function CreatePaginationLink(page, isSelected, currentHash) {
        // scroll back up to the top when a page is clicked
        currentHash.page = page.toString();
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.classList.add("pagination-link");
        a.setAttribute("aria-label", "Goto page " + currentHash.page);
        a.href = currentHash.ToHash();
        if (isSelected) {
            a.classList.add("is-current");
            a.setAttribute("aria-current", "page");
        }
        a.appendChild(document.createTextNode(currentHash.page));
        li.appendChild(a);
        return li;
    }
    function CreatePaginationEllipsis() {
        var li = document.createElement("li");
        var span = document.createElement("span");
        span.classList.add("pagination-ellipsis");
        span.innerHTML = "&hellip;";
        li.appendChild(span);
        return li;
    }
    function CloseModals() {
        var modals = document.querySelectorAll(".modal");
        if (modals.length > 0) {
            for (var i = 0; i < modals.length; i++) {
                var modal = modals.item(i);
                modal.classList.remove("is-active");
            }
        }
    }
    PermitSearch.CloseModals = CloseModals;
    function ClosePermitModal() {
        var currentHash = new PermitSearch.LocationHash(location.hash.substring(1));
        currentHash.permit_display = "";
        location.hash = currentHash.ToHash();
    }
    PermitSearch.ClosePermitModal = ClosePermitModal;
    function ViewPermitDetail(permit) {
        PopulatePermitHeading(permit);
        PopulatePermitInformation(permit);
        PermitSearch.Document.QueryDocuments(permit.permit_number);
        PermitSearch.Hold.QueryHolds(permit.permit_number);
        PermitSearch.Charge.QueryCharges(permit.permit_number);
    }
    function PopulatePermitHeading(permit) {
        var permitHeading = document.getElementById("permitHeading");
        Utilities.Clear_Element(permitHeading);
        var permitNumberContainer = CreateLevelItem("PERMIT #", permit.permit_number.toString().padStart(8, "0"));
        permitNumberContainer.style.flexGrow = "2";
        permitHeading.appendChild(permitNumberContainer);
        if (permit.permit_type.length > 0) {
            permitHeading.appendChild(CreateLevelItem("PERMIT TYPE", permit.permit_type));
        }
        if (new Date(permit.issue_date).getFullYear() !== 1) {
            // permit is issued
            permitHeading.appendChild(CreateLevelItem("ISSUE DATE", Utilities.Format_Date(permit.issue_date)));
            Utilities.Show("PermitPrintButton");
        }
        else {
            permitHeading.appendChild(CreateLevelItem("ISSUE DATE", "Not Issued"));
            Utilities.Hide("PermitPrintButton");
        }
        if (new Date(permit.void_date).getFullYear() !== 1) {
            // permit is voided
            permitHeading.appendChild(CreateLevelItem("VOID DATE", Utilities.Format_Date(permit.void_date)));
        }
        else {
            if (new Date(permit.co_date).getFullYear() !== 1) {
                permitHeading.appendChild(CreateLevelItem("CO DATE", Utilities.Format_Date(permit.co_date)));
            }
        }
    }
    function PopulatePermitInformation(permit) {
        Utilities.Set_Value("permitCompleted", permit.is_closed ? "Yes" : "No");
        Utilities.Set_Value("permitFinalInspection", permit.passed_final_inspection ? "Yes" : "No");
        var permitInspectionButton = document.getElementById("permitInspectionSchedulerLink");
        var inspectionLink = "https://public.claycountygov.com/inspectionscheduler/#permit=" + permit.permit_number.toString();
        permitInspectionButton.href = inspectionLink;
        Build_Property_Information_Display(permit);
        Build_Contractor_Information_Display(permit);
    }
    function Build_Property_Information_Display(permit) {
        var propertyContainer = document.getElementById("propertyFieldset");
        var df = document.createDocumentFragment();
        var legend = document.createElement("legend");
        legend.classList.add("label");
        legend.appendChild(document.createTextNode("Property Information"));
        df.appendChild(legend);
        if (permit.address.length > 0)
            df.appendChild(Create_Field("Address", permit.address));
        if (permit.owner_name.length > 0)
            df.appendChild(Create_Field("Owner", permit.owner_name));
        if (permit.parcel_number.length > 0) {
            if (permit.pin_complete.length > 0) {
                var link = "https://qpublic.schneidercorp.com/Application.aspx?AppID=830&LayerID=15008&PageTypeID=4&KeyValue=" + permit.pin_complete;
                df.appendChild(Create_Field_Link("Parcel Number", permit.parcel_number, "View on CCPAO", link));
            }
            else {
                df.appendChild(Create_Field("Parcel Number", permit.parcel_number));
            }
        }
        Utilities.Clear_Element(propertyContainer);
        propertyContainer.appendChild(df);
    }
    function Build_Contractor_Information_Display(permit) {
        var contractorContainer = document.getElementById("contractorFieldset");
        Utilities.Clear_Element(contractorContainer);
        var df = document.createDocumentFragment();
        var legend = document.createElement("legend");
        legend.classList.add("label");
        legend.appendChild(document.createTextNode("Contractor Information"));
        df.appendChild(legend);
        if (permit.contractor_name.length === 0 &&
            permit.contractor_number.length === 0 &&
            permit.company_name.length === 0) {
            var p = document.createElement("p");
            p.appendChild(document.createTextNode("No Contractor Information found."));
            df.appendChild(p);
        }
        else {
            if (permit.contractor_number.length > 0) {
                df.appendChild(Create_Field("Contractor Number", permit.contractor_number));
                df.appendChild(Create_Field("Days Since Last Passed Inspection", permit.days_since_last_passed_inspection.toString()));
            }
            if (permit.contractor_name.length > 0)
                df.appendChild(Create_Field("Contractor Name", permit.contractor_name));
            if (permit.company_name.length > 0)
                df.appendChild(Create_Field("Company Name", permit.company_name));
        }
        contractorContainer.appendChild(df);
    }
    function Create_Field(label, value) {
        var field = document.createElement("div");
        field.classList.add("field");
        var fieldLabel = document.createElement("label");
        fieldLabel.classList.add("label");
        fieldLabel.classList.add("is-medium");
        fieldLabel.appendChild(document.createTextNode(label));
        field.appendChild(fieldLabel);
        var control = document.createElement("div");
        control.classList.add("control");
        var input = document.createElement("input");
        input.classList.add("input");
        input.classList.add("is-medium");
        input.readOnly = true;
        input.type = "text";
        input.value = value;
        control.appendChild(input);
        field.appendChild(control);
        return field;
        //<div class="field" >
        //  <label class="label is-medium" > Contractor Number < /label>
        //    < div class="control" >
        //      <input id="permitContractorNumber"
        //class="input is-medium" type = "text" disabled value = "" />
        //  </div>
        //  < /div>
    }
    function Create_Field_Link(label, value, buttonLabel, link) {
        var field = document.createElement("div");
        field.classList.add("field");
        var fieldLabel = document.createElement("label");
        fieldLabel.classList.add("label");
        fieldLabel.classList.add("is-medium");
        fieldLabel.appendChild(document.createTextNode(label));
        field.appendChild(fieldLabel);
        var innerField = document.createElement("div");
        innerField.classList.add("field");
        innerField.classList.add("is-grouped");
        var inputControl = document.createElement("div");
        inputControl.classList.add("control");
        var buttonControl = document.createElement("div");
        buttonControl.classList.add("control");
        var input = document.createElement("input");
        input.classList.add("input");
        input.classList.add("is-medium");
        input.readOnly = true;
        input.type = "text";
        input.value = value;
        var button = document.createElement("a");
        button.classList.add("button");
        button.classList.add("is-medium");
        button.classList.add("is-primary");
        button.href = link;
        button.target = "_blank";
        button.rel = "noopener";
        button.appendChild(document.createTextNode(buttonLabel));
        inputControl.appendChild(input);
        buttonControl.appendChild(button);
        innerField.appendChild(inputControl);
        innerField.appendChild(buttonControl);
        field.appendChild(innerField);
        return field;
    }
    function CreateLevelItem(label, value) {
        var container = document.createElement("div");
        container.classList.add("level-item");
        container.classList.add("has-text-centered");
        var div = document.createElement("div");
        var heading = document.createElement("p");
        heading.classList.add("heading");
        heading.appendChild(document.createTextNode(label));
        var title = document.createElement("p");
        title.classList.add("title");
        title.appendChild(document.createTextNode(value));
        div.appendChild(heading);
        div.appendChild(title);
        container.appendChild(div);
        return container;
    }
    function GetPath() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/permitsearch");
        if (i == 0) {
            path = "/permitsearch/";
        }
        return path;
    }
    PermitSearch.GetPath = GetPath;
    function CreateMessageRow(container_id, colspan, message) {
        var container = document.getElementById(container_id);
        Utilities.Clear_Element(container);
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = colspan;
        td.appendChild(document.createTextNode(message));
        tr.appendChild(td);
        container.appendChild(tr);
    }
    PermitSearch.CreateMessageRow = CreateMessageRow;
    function ResetSearch() {
        // this function is going to empty the search form inputs and the search results.
        Utilities.Hide(document.getElementById("searchResults"));
        Utilities.Clear_Element(document.getElementById("resultsbody"));
        Utilities.Set_Value("permitStatus", "all");
        Utilities.Set_Value("permitSearch", "");
        Utilities.Set_Value("streetNumberSearch", "");
        Utilities.Set_Value("streetNameSearch", "");
        Utilities.Set_Value("parcelSearch", "");
        Utilities.Set_Value("ownerSearch", "");
        Utilities.Set_Value("contractorNumberSearch", "");
        Utilities.Set_Value("contractorNameSearch", "");
        Utilities.Set_Value("companyNameSearch", "");
        location.hash = "";
    }
    PermitSearch.ResetSearch = ResetSearch;
})(PermitSearch || (PermitSearch = {}));
//# sourceMappingURL=app.js.map