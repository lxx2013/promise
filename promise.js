Promise.pid = 0;

var asap = (fn) => setTimeout(fn,0)
function noop() {}

var LAST_ERROR = null;
var IS_ERROR = {};

function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCall(fn, ...rest) {
  try {
    return fn(...rest);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function Promise(fn) {
  this.pid = Promise.pid++;
  this.status = "pending" || "fulfilled" || "rejected"; // 规范2.1 一个 promise 有且只有一个状态（pending，fulfilled，rejected 其中之一）
  this.onResolvedCallbacks = []; //定义存放成功的回调的数组
  this.onRejectedCallbacks = []; //定义存放失败回调的数组

  const resolve = value => {
    if (this.status === "pending") {
      this.status = "fulfilled";
      this.value = value;
      this.onResolvedCallbacks.forEach(cb => cb(this.value));
    }
  };

  const reject = reason => {
    if (this.status === "pending") {
      this.status = "rejected";
      this.reason = reason;
      this.onRejectedCallbacks.forEach(cb => cb(reason));
    }
  };

  try {
    fn(resolve, reject);
  } catch (err) {
    reject(err);
  }
}

//在 Chrome 控制台检查 Promise生成的对象可以发现 then, catch, finally 三个函数是在 prototype 上实现的
Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.finally = function(fn) {
  return this.then(
    value => {
      fn();
      return value;
    },
    reason => {
      fn();
      throw reason;
    }
  );
};
Promise.prototype.then = function(onFulfilled, onRejected) {
  //处理输入函数 // 规范2.2.1 onFulfilled 和 onRejected 都是可选参数, 若不是函数则忽略
  if (this.status === "pending") {
    typeof onFulfilled === "function" &&
      this.onResolvedCallbacks.push(onFulfilled);
    typeof onRejected === "function" &&
      this.onRejectedCallbacks.push(onRejected);
  } else if (this.status === "fulfilled") {
    typeof onFulfilled === "function" && onFulfilled(this.value);
  } else {
    typeof onRejected === "function" && onRejected(this.reason);
  }

  //构造返回值 // 规范2.2.7 then 必须返回一个promise
  return new Promise((resolve, reject) => {
    if (this.status === "pending") {
      this.onResolvedCallbacks.push(resolve);
      this.onRejectedCallbacks.push(reject);
    } else {
      try {
        if (this.status === "fulfilled") {
          resolve(this.value);
        } else if (this.status === "rejected") {
          reject(this.reason);
        }
      } catch (reason) {
        reject(reason);
      }
    }
  });
};

//实现静态方法 resolve, reject, race, all
Promise.reject = x =>
  new Promise((_, reject) => {
    reject(x);
  });
Promise.race = (...promises) =>
  new Promise((resolve, reject) => {
    promises.forEach(pro => Promise.resolve(pro).then(resolve, reject));
  });
Promise.all = (...promises) => {
  let count = promises.length;
  let values = [];
  return new Promise((r, f) => {
    promises.forEach((p, idx) => {
      p.then(v => {
        values[idx] = v;
        --count === 0 && r(values);
      }).catch(err => f(err));
    });
  });
};

Promise._noop = function noop() {};

function valuePromise(value) {
  var p = new Promise(Promise._noop);
  p.status = 'fulfilled';
  p.value = value;
  return p;
}
Promise.resolve = function(value) {
  if (value instanceof Promise) return value;

  var basicValues = [null,undefined,true,false,0,""]
  if (basicValues.includes(value)) return value;

  if (typeof value === "object" || typeof value === "function") {
    try {
      var then = value.then;
      if (typeof then === "function") {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function(resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

//设置 toStringTag, 导出 Promise
Promise[Symbol.toStringTag] = "Promise"; // Promise.resolve().toString() "[object Promise]"

module.exports = Promise;
