function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

var _toString = Object.prototype.toString;

function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

function isValidArrayIndex(val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

function remove(arr, item) {
  if (arr.length) {
    var idx = arr.indexOf(item);
    if (idx > -1) {
      return arr.splice(idx, 1)
    }
  }
}

var nextTick = wx.nextTick ? wx.nextTick : setTimeout;

var uid = 0;

var Dep = function Dep() {
  this.id = ++uid;
  this.subs = [];
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.notify = function notify () {
  var subs = this.subs.slice();
  subs.forEach(function (sub) { return sub.update(); });
};

Dep.target = null;

var targetStack = [];

function pushTarget(_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget() {
  Dep.target = targetStack.pop();
}

// https://github.com/vuejs/vue/blob/dev/src/core/observer/array.js

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    ob.dep.notify();
    return result
  });
});

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

function copyAugment(target, src, keys) {
  keys.forEach(function (key) {
    def(target, key, src[key]);
  });
}

var Observer = function Observer(value) {
  this.value = value;
  this.dep = new Dep;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    copyAugment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

Observer.prototype.walk = function walk (obj) {
  Object.keys(obj).forEach(function (key) {
    defineReactive(obj, key);
  });
};

Observer.prototype.observeArray = function observeArray (items) {
  items.forEach(function (item) { return observe(item); });
};

function observe(data) {
  if (!data || typeof data !== 'object') { return }
  var ob;
  if (hasOwn(data, '__ob__') && data.__ob__ instanceof Observer) {
    ob = data.__ob__;
  } else if (
    (Array.isArray(data) || isPlainObject(data)) &&
    Object.isExtensible(data)
  ) {
    ob = new Observer(data);
  }
  return ob
}

function defineReactive(data, key) {
  var dep = new Dep;
  var val = data[key];
  var childOb = observe(val);
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: false,
    get: function get() {
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(val)) {
            dependArray(val);
          }
        }
      }
      return val
    },
    set: function set(newValue) {
      if (val === newValue) { return }
      val = newValue;
      childOb = observe(val);
      dep.notify();
    }
  });
}

function dependArray(value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

function set(target, key, val) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }

  var ob = target.__ob__;
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

function del(target, key) {
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  if (hasOwn(target, key)) { return }
  var ob = target.__ob__;
  delete target[key];
  if (!ob) { return }
  ob.dep.notify();
}

var watcherQueue = [];
var has = {};
var pageMap = {};

function flushSchedulerQueue() {
  Object.keys(pageMap).forEach(function (route) {
    var map = pageMap[route];
    var data = map.expQueue.reduce(function (ret, cur) {
      ret[cur.key] = cur.exp(getApp());
      return ret
    }, {});
    map.ctx.setData(data);
  });
  has = {};
  watcherQueue.length = 0;
}

function queueWatcher(watcher) {
  var id = watcher.id;
  if (has[id]) { return }
  has[id] = true;
  var ctx = watcher.ctx;
  var exp = watcher.exp;
  var key = watcher.key;
  var route = ctx.route;
  pageMap[route] = pageMap[route] || {
    ctx: ctx,
    expQueue: []
  };
  pageMap[route].expQueue.push({ exp: exp, key: key });
  if (watcherQueue.push(watcher) === 1) {
    nextTick(flushSchedulerQueue);
  }
}

var uid$1 = 0;

var Watcher = function Watcher(ctx, fn, options) {
  this.ctx = ctx;
  ctx.$watchers = (ctx.$watchers || []).concat(this);
  this.getter = fn;
  this.id = ++uid$1;
  this.deps = [];
  this.depIds = new Set();
  this.value = this.get();
  if (options) {
    this.isMapStateWatcher = !!options.isMapStateWatcher;
    this.exp = options.exp;
    this.key = options.key;
  } else {
    throw new Error('小程序环境 watcher 必须提供 options')
  }
};
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value = this.getter();
  popTarget();
  return value
};

Watcher.prototype.update = function update () {
  queueWatcher(this);
};

Watcher.prototype.run = function run () {
  // 小程序环境因为要合并 watcher 队列中的 data 一次性执行 setData，因为不再逐一调用 watcher 的 run
};

Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.depIds.has(id)) {
    this.depIds.add(id);
    this.deps.push(dep);
    dep.addSub(this);
  }
};

Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].removeSub(this$1);
  }
};

//      
// An event handler can take an optional event argument
// and should not return a value
                                          
                                                               

// An array of all currently registered event handlers for a type
                                            
                                                            
// A map of event types and their corresponding event handlers.
                        
                                 
                                   
  

/** Mitt: Tiny (~200b) functional event emitter / pubsub.
 *  @name mitt
 *  @returns {Mitt}
 */
function mitt(all                 ) {
	all = all || Object.create(null);

	return {
		/**
		 * Register an event handler for the given type.
		 *
		 * @param  {String} type	Type of event to listen for, or `"*"` for all events
		 * @param  {Function} handler Function to call in response to given event
		 * @memberOf mitt
		 */
		on: function on(type        , handler              ) {
			(all[type] || (all[type] = [])).push(handler);
		},

		/**
		 * Remove an event handler for the given type.
		 *
		 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
		 * @param  {Function} handler Handler function to remove
		 * @memberOf mitt
		 */
		off: function off(type        , handler              ) {
			if (all[type]) {
				all[type].splice(all[type].indexOf(handler) >>> 0, 1);
			}
		},

		/**
		 * Invoke all handlers for the given type.
		 * If present, `"*"` handlers are invoked after type-matched handlers.
		 *
		 * @param {String} type  The event type to invoke
		 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
		 * @memberOf mitt
		 */
		emit: function emit(type        , evt     ) {
			(all[type] || []).slice().map(function (handler) { handler(evt); });
			(all['*'] || []).slice().map(function (handler) { handler(type, evt); });
		}
	};
}

function page(config) {
  var originalOnload = config.onLoad;
  var originalOnUnload = config.onUnload;
  var mapState = config.mapState;
  config.onLoad = function onLoad(onLoadOptions) {
    var this$1 = this;

    var pages = getCurrentPages();
    this.$prevPage = pages[pages.length - 2];
    if (this.$prevPage) {
      onLoadOptions.params = this.$prevPage.$nextPageParams;
      delete this.$prevPage.$nextPageParams;
    }
    if (mapState) {
      Object.keys(mapState).forEach(function (key) {
        var fn = mapState[key];
        new Watcher(this$1, function (_) {
          var obj;

          var ret = fn(getApp());
          this$1.setData(( obj = {}, obj[key] = ret, obj ));
          return ret
        }, { isMapStateWatcher: true, exp: fn, key: key });
      });
    }
    if (originalOnload) { originalOnload.call(this, onLoadOptions); }
  };
  config.$navTo = function (ref) {
    var url = ref.url;
    var params = ref.params;

    this.__params = params;
    wx.navigateTo({ url: url });
  };

  config.$set = set;
  config.$del = del;
  config.$bus = mitt();

  config.onUnload = function () {
    if (Array.isArray(this.$watchers)) {
      this.$watchers.forEach(function (watcher) {
        watcher.teardown();
      });
    }
    delete this.$watchers;
    if (originalOnUnload) { originalOnUnload.call(this); }
  };
  return Page(config)
}

var onAndSyncApis = {
  onSocketOpen: true,
  onSocketError: true,
  onSocketMessage: true,
  onSocketClose: true,
  onBackgroundAudioPlay: true,
  onBackgroundAudioPause: true,
  onBackgroundAudioStop: true,
  onNetworkStatusChange: true,
  onAccelerometerChange: true,
  onCompassChange: true,
  onBluetoothAdapterStateChange: true,
  onBluetoothDeviceFound: true,
  onBLEConnectionStateChange: true,
  onBLECharacteristicValueChange: true,
  onBeaconUpdate: true,
  onBeaconServiceChange: true,
  onUserCaptureScreen: true,
  onHCEMessage: true,
  onGetWifiList: true,
  onWifiConnected: true,
  setStorageSync: true,
  getStorageSync: true,
  getStorageInfoSync: true,
  removeStorageSync: true,
  clearStorageSync: true,
  getSystemInfoSync: true,
  getExtConfigSync: true,
  getLogManager: true,
};
var noPromiseApis = {
  // 媒体
  stopRecord: true,
  getRecorderManager: true,
  pauseVoice: true,
  stopVoice: true,
  pauseBackgroundAudio: true,
  stopBackgroundAudio: true,
  getBackgroundAudioManager: true,
  createAudioContext: true,
  createInnerAudioContext: true,
  createVideoContext: true,
  createCameraContext: true,
  createLivePlayerContext: true,
  createLivePusherContext: true,

  // 位置
  createMapContext: true,

  // 设备
  canIUse: true,
  startAccelerometer: true,
  stopAccelerometer: true,
  startCompass: true,
  stopCompass: true,

  // 界面
  hideToast: true,
  hideLoading: true,
  showNavigationBarLoading: true,
  hideNavigationBarLoading: true,
  createAnimation: true,
  pageScrollTo: true,
  createSelectorQuery: true,
  createCanvasContext: true,
  createContext: true,
  drawCanvas: true,
  hideKeyboard: true,
  stopPullDownRefresh: true,
  createIntersectionObserver: true,

  // 拓展接口
  arrayBufferToBase64: true,
  base64ToArrayBuffer: true,

  getUpdateManager: true,
  createWorker: true,
};
var otherApis = {
  // 网络
  uploadFile: true,
  downloadFile: true,
  connectSocket: true,
  sendSocketMessage: true,
  closeSocket: true,

  // 媒体
  chooseImage: true,
  previewImage: true,
  getImageInfo: true,
  saveImageToPhotosAlbum: true,
  startRecord: true,
  playVoice: true,
  getBackgroundAudioPlayerState: true,
  playBackgroundAudio: true,
  seekBackgroundAudio: true,
  chooseVideo: true,
  saveVideoToPhotosAlbum: true,
  loadFontFace: true,

  // 文件
  saveFile: true,
  getFileInfo: true,
  getSavedFileList: true,
  getSavedFileInfo: true,
  removeSavedFile: true,
  openDocument: true,

  // 数据缓存
  setStorage: true,
  getStorage: true,
  getStorageInfo: true,
  removeStorage: true,
  clearStorage: true,

  // 导航
  navigateBack: true,
  navigateTo: true,
  redirectTo: true,
  switchTab: true,
  reLaunch: true,

  // 位置
  getLocation: true,
  chooseLocation: true,
  openLocation: true,

  // 设备
  getSystemInfo: true,
  getNetworkType: true,
  makePhoneCall: true,
  scanCode: true,
  setClipboardData: true,
  getClipboardData: true,
  openBluetoothAdapter: true,
  closeBluetoothAdapter: true,
  getBluetoothAdapterState: true,
  startBluetoothDevicesDiscovery: true,
  stopBluetoothDevicesDiscovery: true,
  getBluetoothDevices: true,
  getConnectedBluetoothDevices: true,
  createBLEConnection: true,
  closeBLEConnection: true,
  getBLEDeviceServices: true,
  getBLEDeviceCharacteristics: true,
  readBLECharacteristicValue: true,
  writeBLECharacteristicValue: true,
  notifyBLECharacteristicValueChange: true,
  startBeaconDiscovery: true,
  stopBeaconDiscovery: true,
  getBeacons: true,
  setScreenBrightness: true,
  getScreenBrightness: true,
  setKeepScreenOn: true,
  vibrateLong: true,
  vibrateShort: true,
  addPhoneContact: true,
  getHCEState: true,
  startHCE: true,
  stopHCE: true,
  sendHCEMessage: true,
  startWifi: true,
  stopWifi: true,
  connectWifi: true,
  getWifiList: true,
  setWifiList: true,
  getConnectedWifi: true,

  // 界面
  showToast: true,
  showLoading: true,
  showModal: true,
  showActionSheet: true,
  setNavigationBarTitle: true,
  setNavigationBarColor: true,
  setTabBarBadge: true,
  removeTabBarBadge: true,
  showTabBarRedDot: true,
  hideTabBarRedDot: true,
  setTabBarStyle: true,
  setTabBarItem: true,
  showTabBar: true,
  hideTabBar: true,
  setTopBarText: true,
  startPullDownRefresh: true,
  canvasToTempFilePath: true,
  canvasGetImageData: true,
  canvasPutImageData: true,

  // 第三方平台
  getExtConfig: true,

  // 开放接口
  login: true,
  checkSession: true,
  authorize: true,
  getUserInfo: true,
  checkIsSupportFacialRecognition: true,
  startFacialRecognitionVerify: true,
  startFacialRecognitionVerifyAndUploadVideo: true,
  requestPayment: true,
  showShareMenu: true,
  hideShareMenu: true,
  updateShareMenu: true,
  getShareInfo: true,
  chooseAddress: true,
  addCard: true,
  openCard: true,
  openSetting: true,
  getSetting: true,
  getWeRunData: true,
  navigateToMiniProgram: true,
  navigateBackMiniProgram: true,
  chooseInvoiceTitle: true,
  checkIsSupportSoterAuthentication: true,
  startSoterAuthentication: true,
  checkIsSoterEnrolledInDevice: true,
  //
};

function processApis(ctx) {
  var wxApi = Object.assign({}, onAndSyncApis, noPromiseApis, otherApis);
  Object.keys(wxApi).forEach(function (key) {
    if (!onAndSyncApis[key] && !noPromiseApis[key]) {
      ctx[key] = function (options) {
        options = options || {};
        var task = null;
        var obj = Object.assign({}, options);
        if (typeof options === 'string') {
          return wx[key](options)
        }
        var p = new Promise(function (resolve, reject) {
          ['fail', 'success', 'complete'].forEach(function (k) {
            obj[k] = function (res) {
              if (options[k]) {
                options[k](res);
              }
              if (k === 'success') {
                resolve(res);
              } else if (k === 'fail') {
                reject(res);
              }
            };
          });
          task = wx[key](obj);
        });
        if (key === 'uploadFile' || key === 'downloadFile') {
          p.progress = function (cb) {
            task.onProgressUpdate(cb);
            return p
          };
          p.abort = function (cb) {
            if (cb) { cb(); }
            task.abort();
            return p
          };
        }
        return p
      };
    } else {
      ctx[key] = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        return wx[key].apply(wx, args);
      }; // eslint-disable-line
    }
  });
}

function wxApp(config) {
  var originalOnLauch = config.onLaunch;
  config.onLaunch = function() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    processApis(this);
    this.globalData = this.globalData || {};
    observe(this.globalData);
    if (originalOnLauch) { originalOnLauch.bind(this).apply(void 0, args); }
  };

  config.bus = mitt();

  config.set = set;

  config.del = del;

  return App(config)
}

export { page, wxApp as app };
