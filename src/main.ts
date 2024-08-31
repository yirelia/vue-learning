/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2023-07-30 09:24:14
 * @LastEditors: yang 17368465776@163.com
 * @LastEditTime: 2023-07-30 17:29:21
 * @FilePath: /mini-vue-reactive/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */


import {effect, ref} from '@vue/reactivity'
import { render, renderer } from './render/render'

const dom = document.querySelector('#app')
const count = ref(1)

const vnode = {
    type: 'div',
    children: [
        {
            type: 'p',
            children: 'hello'
        }
    ]
}


effect(() => {
    renderer.render(vnode, {type: 'root'})
    // render(`<h1> hello ${count.value}</h1>`, dom)
})

// setTimeout(() => count.value = 2, 1000)

