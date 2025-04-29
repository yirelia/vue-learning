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

