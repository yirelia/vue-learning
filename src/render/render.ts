export function createRender(option) {
    const {createElement, setElementText, insert} = option
    function render(vnode, container) {
        if(vnode) {
            patch(container._vnode, vnode, container)
        } else {
            if(container._vnode) {
                container.innerHTML = ''
            }
           
        }
        container._vnode = vnode
    }

    function hydrate() {}


    function patch(n1, n2, container){
        if(!n1) {
            mountElement(n2, container)
        }
    }

    function mountElement(vnode, container) {
        const el = createElement(vnode.type)
        if(typeof vnode.children === 'string') {
            setElementText(el, vnode.children)
        } else if(Array.isArray(vnode.children)) {
            vnode.children.forEach((child) => {
                patch(null, child, el)
            })
        }
        insert(el, container)
    }

    function patchChildren(n1, n2, container) {}

    return {
        render,
        hydrate
    }

}


export const renderer  = createRender({
    createElement(tag) {
        console.log(`创建了 ${tag} 元素`)
        return {tag}
    },
    setElementText(el:any, text) {
        console.log(`设置${JSON.stringify(el)} 内容为 ${text}`)
        el.textContent = text
    },
    insert(el, parent, anchor=null) {
        console.log(`将元素插入到对一个的${JSON.stringify(el)} => ${JSON.stringify(parent)}`)
        parent.children = el
    }
})



export function render(domString, container: Element) {
    container.innerHTML = domString
}


