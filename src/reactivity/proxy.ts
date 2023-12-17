/*
 * @Author: yang 17368465776@163.com
 * @Date: 2023-07-30 12:09:29
 * @LastEditors: yang 17368465776@163.com
 * @LastEditTime: 2023-07-30 17:33:58
 * @FilePath: /mini-vue-reactive/src/reactivity/proxy.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const target = {
    name: 'simtek'
}

const proxy = new Proxy(target, {})

console.log(proxy.name)
console.log(target.name)

proxy.name = 'nj-sitmek'
console.log(proxy.name)


