

/*
 * @Author: yang 17368465776@163.com
 * @Date: 2023-07-30 10:09:33
 * @LastEditors: yang 17368465776@163.com
 * @LastEditTime: 2023-07-30 11:58:46
 * @FilePath: /mini-vue-reactive/src/reactivity/effect.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export let activeEffect
const effectStack = []
const bucket  = new WeakMap()
const reactiveMap = new Map()

enum TriggerType  {
    SET =  'set',
    ADD =  'add',
    DELETE = 'delete'
}
/**
 * @description: 依赖追踪
 * @param {*} target
 * @param {*} key
 * @return {*}
 */
function track(target, key) {
    if(!activeEffect) {
        return
    }
    let depsMap = bucket.get(target)
    if(!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if(!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

/**
 * @description: 触发依赖重新执行
 * @param {*} target
 * @param {*} key
 * @return {*}
 */
function trigger(target, key, type?, newVal?) {
    const depsMap = bucket.get(target)
    if(!depsMap) {
        return 
    }
    const effects = depsMap.get(key)
    console.log('key is',key,effects)
    const effectToRun = new Set()
    effects && effects.forEach(effectFn => {
        // trigger 触发执行的副作用函数与当前正在执行的副作用函数形同，则不出发执行
        if(effectFn !== activeEffect) {
        effectToRun.add(effectFn)
        }
    })
    if(type === TriggerType.ADD || type === TriggerType.DELETE) {
        const iterateEffects = depsMap.get(ITERATE_KEY)
            // 触发 
        iterateEffects && iterateEffects.forEach(effectFn => {
        // trigger 触发执行的副作用函数与当前正在执行的副作用函数形同，则不出发执行
        if(effectFn !== activeEffect) {
        effectToRun.add(effectFn)
        } else {
            console.log('effecFn is Same')
        }
    })
    }
    if(type === TriggerType.ADD && Array.isArray(target)) {
        const lengthEffects = depsMap.get('length')
        lengthEffects && lengthEffects.forEach(effectFn => {
            if(effectFn !== activeEffect) {
                effectToRun.add(effectFn)
            }
        })
    }

    if(Array.isArray(target) && key === 'length') {
        depsMap.forEach((effects, key) => {
            if(key >= newVal) {
                effects.forEach(effectFn => {
                    if(effectFn !== activeEffect) {
                        effectToRun.add(effectFn)
                    }
                })
            }
        })
    }




   effectToRun.forEach(effectFn => {
    // 运行调度器
    if(effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
    } else {
        effectFn()
    }
    })
}
const ITERATE_KEY = Symbol()

const applyInstrumentations = {
    includes: function() {}
}


export function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        ownKeys(target) {

            track(target, Array.isArray(target) ? 'length' :  ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        get(target, key, receiver) {
            console.log('get', key)
            // 获取原数据
            if(key === 'raw') {
                return target
            }
            if(Array.isArray(target) && applyInstrumentations.hasOwnProperty(key)) {
                return Reflect.get(applyInstrumentations, key, receiver)

            }

            if(!isReadonly && typeof key !== 'symbol') {
                // 收集依赖
                track(target, key)
            }

            const res = Reflect.get(target, key, receiver)
            if(isShallow) {
                return res
            }
            if(typeof res === 'object' && res !==null) {
                return isReadonly ? readonly(res) : reactive(res)
            }
            return res
        },
        has(target, key) {
            track(target, key)
            return Reflect.has(target, key)
        },
        set(target, key, newVal, receiver) {
            if(isReadonly) {
                return true
            }
            const oldValue = target[key]
            const type = Array.isArray(target) ? Number(key) < target.length ?  TriggerType.SET : TriggerType.ADD  : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'
            const res = Reflect.set(target, key, newVal, receiver)
            
            if(target === receiver.raw) {
                if(oldValue !== newVal && (oldValue === oldValue || newVal === newVal)) {
                    trigger(target, key, type, newVal)
                }
            }

            return res
        },
        deleteProperty(target, key) {
            if(isReadonly) {
                return true
            }
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            const res = Reflect.deleteProperty(target,key)
            if(res && hadKey) {
                trigger(target, key, TriggerType.DELETE)
            }
            return res
        }
    
    })
}

export function reactive(obj) {
    const exisitionProxy = reactiveMap.get(obj)
    if(exisitionProxy) {
        return exisitionProxy
    }
    const proxy = createReactive(obj)
    reactiveMap.set(obj, proxy)
    return proxy
}

export function shallowReactive(obj) {
    return createReactive(obj, true)
}

export function readonly(obj) {
    return createReactive(obj, false, true)
}


export function effect(fn, options = {}) {
    const effectFn = () => {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        const res = fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length  -1]
        return res
    }
    effectFn.options = options
    effectFn.deps = []
    if(!options.lazy) {
        return effectFn()
    }
   return effectFn
}

export function ref(val) {
    const wrapper = {
        value: val
    }

    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })
    return reactive(wrapper)
}

function cleanup(effectFn) {
    for(let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}
const jobQueue = new Set()
const p = Promise.resolve()
let isFlushing = false

function flushJob() {
    if(isFlushing) {
        return 
    }
    isFlushing = true
    p.then(() => {
        console.log('flus json', jobQueue)
        jobQueue.forEach(job => job())
    }).finally(() => {
        isFlushing = false
    })

}



function computed(getter) {
    let value
    // 脏数据的标志值
    let dirty = true
    // 获取effectFn
    const effectFn  = effect(getter, {lazy: true, scheduler() {
        dirty = true
        trigger(obj, 'value')
    }})
    const obj = {
        get value() {
            if(dirty) {
                value = effectFn()
                dirty = false               
            }
            track(target, 'value')
            return value
        }
    }
    return obj
}

const sumRes = computed(() => proxyObj.bar + proxyObj.foo)



function watch(source, cb, options = {}) {
    let getter
    let newValue, oldValue
    if(typeof source === 'function') {
        getter = source
    } else {
        getter = () => traverse(source)
    }
    // 处理过期回调
    let cleanup
    function onInvalidate(fn) {
        cleanup = fn
    }
    console.log('cleanup =====> ', cleanup)
    const job = () => {
        newValue = effectFn()
        // 先执行过期回调
        if(cleanup) {
            cleanup()
        }
        cb(newValue, oldValue, onInvalidate)
        oldValue = newValue
    }
    // lazy 返回effetFn, job 调度器
    const effectFn = effect(getter, { lazy: true, scheduler: job})
    if(options.immedinate) {
        job()
    } else {
        // 初始化oldValue
        oldValue = effectFn()
    }
   
}

function traverse(value, seen = new Set()) {
    // 基础类型不处理
    if(typeof value !== 'object' || typeof value == null || seen.has(value)) {
        return 
    }
    seen.add(value)
    for(const k in value) {
        traverse(value[k], seen)
    }
    return value
}

let finalData




const a = reactive(['foo'])

effect(() => {
   for(const i in a) {
    console.log(`====>`,i)
   }
})

a[1] = 'bar'

a.length = 0

