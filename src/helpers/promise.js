import { isFunction, isObject } from '@vuikit/util'

/**
 * Promises/A+ polyfill v1.1.4 (https://github.com/bramstein/promis)
 */

const RESOLVED = 0
const REJECTED = 1
const PENDING = 2

const async = 'setImmediate' in window ? setImmediate : setTimeout

export default 'Promise' in window ? window.Promise : Promise

function Promise (executor) {
  this.state = PENDING
  this.value = undefined
  this.deferred = []

  const promise = this

  try {
    executor(function (x) {
      promise.resolve(x)
    }, function (r) {
      promise.reject(r)
    })
  } catch (e) {
    promise.reject(e)
  }
}

Promise.reject = function (r) {
  return new Promise(function (resolve, reject) {
    reject(r)
  })
}

Promise.resolve = function (x) {
  return new Promise(function (resolve, reject) {
    resolve(x)
  })
}

Promise.all = function all (iterable) {
  return new Promise(function (resolve, reject) {
    let count = 0
    const result = []

    if (iterable.length === 0) {
      resolve(result)
    }

    function resolver (i) {
      return function (x) {
        result[i] = x
        count += 1

        if (count === iterable.length) {
          resolve(result)
        }
      }
    }

    for (var i = 0; i < iterable.length; i += 1) {
      Promise.resolve(iterable[i]).then(resolver(i), reject)
    }
  })
}

Promise.race = function race (iterable) {
  return new Promise(function (resolve, reject) {
    for (var i = 0; i < iterable.length; i += 1) {
      Promise.resolve(iterable[i]).then(resolve, reject)
    }
  })
}

const p = Promise.prototype

p.resolve = function resolve (x) {
  var promise = this

  if (promise.state === PENDING) {
    if (x === promise) {
      throw new TypeError('Promise settled with itself.')
    }

    var called = false

    try {
      var then = x && x.then

      if (x !== null && isObject(x) && isFunction(then)) {
        then.call(x, function (x) {
          if (!called) {
            promise.resolve(x)
          }
          called = true

        }, function (r) {
          if (!called) {
            promise.reject(r)
          }
          called = true
        })
        return
      }
    } catch (e) {
      if (!called) {
        promise.reject(e)
      }
      return
    }

    promise.state = RESOLVED
    promise.value = x
    promise.notify()
  }
}

p.reject = function reject (reason) {
  var promise = this

  if (promise.state === PENDING) {
    if (reason === promise) {
      throw new TypeError('Promise settled with itself.')
    }

    promise.state = REJECTED
    promise.value = reason
    promise.notify()
  }
}

p.notify = function notify () {
  async(() => {
    if (this.state !== PENDING) {
      while (this.deferred.length) {
        const deferred = this.deferred.shift()
        const onResolved = deferred[0]
        const onRejected = deferred[1]
        const resolve = deferred[2]
        const reject = deferred[3]

        try {
          if (this.state === RESOLVED) {
            if (isFunction(onResolved)) {
              resolve(onResolved(this.value))
            } else {
              resolve(this.value)
            }
          } else if (this.state === REJECTED) {
            if (isFunction(onRejected)) {
              resolve(onRejected(this.value))
            } else {
              reject(this.value)
            }
          }
        } catch (e) {
          reject(e)
        }
      }
    }
  })
}

p.then = function then (onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    this.deferred.push([onResolved, onRejected, resolve, reject])
    this.notify()
  })
}

p.catch = function (onRejected) {
  return this.then(undefined, onRejected)
}
