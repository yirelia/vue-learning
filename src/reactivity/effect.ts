
/*
 * @Author: yang 17368465776@163.com
 * @Date: 2023-07-30 10:09:33
 * @LastEditors: yang 17368465776@163.com
 * @LastEditTime: 2023-07-30 11:58:46
 * @FilePath: /mini-vue-reactive/src/reactivity/effect.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export let activeEffect
const bucket  = new WeakMap()

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
    console.log('副作用函数 依赖收集', deps)
    activeEffect.deps.push(deps)
}

function trigger(target, key) {
    const depsMap = bucket.get(target)
    if(!depsMap) {
        return 
    }
    const effects = depsMap.get(key)
    const effectToRun = new Set(effects)

   effectToRun.forEach(effectFn => {
    effectFn()
    })
}

const obj = {
    name: 'simtek'
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
export function effect(fn) {
    const effectFn = () => {
        activeEffect = effectFn
        cleanup(effectFn)
        fn()
    }
    effectFn.deps = []
    console.log('effectfn...', effectFn.deps)
    effectFn()
}

function cleanup(effectFn) {
    for(let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        console.log('delete effectFn', deps)
        deps.delete(effectFn)
        console.log('deleted... effectFn', deps)
    }
    effectFn.deps.length = 0
}

effect(() => {
    console.log('effect run')
    document.body.innerText = proxyObj.name ==='' ? 'tttt' : proxyObj.h
})


setTimeout(() => {
    proxyObj.h = `1111`
    console.log(bucket)
}, 3000);

effect(() => {
    
    proxyObj.name
})



