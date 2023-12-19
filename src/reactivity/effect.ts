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
function trigger(target, key) {
    const depsMap = bucket.get(target)
    if(!depsMap) {
        return 
    }
    const effects = depsMap.get(key)
    const effectToRun = new Set()
    effects && effects.forEach(effectFn => {
        // trigger 触发执行的副作用函数与当前正在执行的副作用函数形同，则不出发执行
        if(effectFn !== activeEffect) {
        effectToRun.add(effectFn)
        }
    })
   effectToRun.forEach(effectFn => {
    // 运行调度器
    if(effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
    } else {
        effectFn()
    }
    })
}

const obj = {
    name: 'simtek',
    foo: 1,
    bar: 2
}
export const proxyObj = new Proxy(obj, {
    get(target, key) {
        track(target, key)
        return target[key]
    },
    set(target, key, newVal) {
        target[key] = newVal
        trigger(target, key)
        return true
    }

})
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

effect(() => {
    console.log(proxyObj.foo)
}, {scheduler(fn) {
    console.log('add fn to jobQueue')
    jobQueue.add(fn)
    flushJob()
}})



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

watch(proxyObj, async (newValue, oldValue, onInvalidate) => {
    // 过期标识
    let expired = false
    onInvalidate(() => 
    {   
        expired = true

    })
    const res = await new Promise((resolve, rejcet) => {
        
        if(newValue.bar === 3) {
            setTimeout(() => resolve('first value'),  4 * 1000)
            
        } else {
            resolve(value++)
        }
    })
    console.log(`res is ${res}`)
    if(!expired) {
        console.log(`set Res ${res}`)
        finalData = res
    }

})


