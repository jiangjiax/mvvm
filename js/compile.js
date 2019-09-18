// 解析器 Compile

function Compile(el, vm) {
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    constructor: Compile,
    node2Fragment: function(el) {
        // createDocumentFragment() 创建一个新的空白的文档片段( DocumentFragment)。
        // DocumentFragments 是DOM节点。它们不是主DOM树的一部分。通常的用例是创建文档片段，将元素附加到文档片段，然后将文档片段附加到DOM树。
        // 因为文档片段存在于内存中，并不在DOM树中，所以将子元素插入到文档片段时不会引起页面回流（对元素位置和几何上的计算）。因此，使用文档片段通常会带来更好的性能。
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment
        // 这里将根节点的el转换成文档碎片fragment进行解析编译操作，解析完成，再将fragment添加回原来的真实dom节点中
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    },

    init: function() {
        this.compileElement(this.$fragment);
    },

    // compileElement方法将遍历所有节点及其子节点，进行扫描解析编译，调用对应的指令渲染函数进行数据渲染
    compileElement: function(el) {
        var childNodes = el.childNodes;
        var me = this;

        // slice.call(arguments)将具有length属性的对象转成数组,然后forEach遍历
        // [].slice.call(childNodes)相当于Array.prototype.slice.call(childNodes)，他的作用是将类数组childNodes转成数组
        // 类数组和数组的区别在于，类数组有length属性，而且不能用数组的方法
        // 其实这里childNodes.forEach()代替[].slice.call(childNodes).forEach()也是一样的
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;

            // 元素节点
            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                // {{}} 内容
                me.compileText(node, RegExp.$1.trim());
            }

            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node) {
        var nodeAttrs = node.attributes;
        var me = this;

        [].slice.call(nodeAttrs).forEach(function(attr) {
            // attr.name 得到属性名
            var attrName = attr.name;
            // isDirective 方法将判断属性是否为'v-'开头
            if (me.isDirective(attrName)) {
                var exp = attr.value;
                // substring(2) 切割字符串方法
                var dir = attrName.substring(2);
                // 事件指令
                // isEventDirective 判断是否为on事件
                if (me.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                    // 普通指令
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function(node, exp) {
        // 这里的text()是compileUtil定义的一个方法
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function(node) {
        // nodeType 属性返回以数字值返回指定节点的节点类型
        // 如果节点是元素节点，则 nodeType 属性将返回 1
        // 如果节点是属性节点，则 nodeType 属性将返回 2
        return node.nodeType == 1;
    },

    isTextNode: function(node) {
        return node.nodeType == 3;
    }
};

// 指令处理集合
var compileUtil = {
    text: function(node, vm, exp) {
        // 调用下面的bind方法
        this.bind(node, vm, exp, 'text');
    },

    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model: function(node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    bind: function(node, vm, exp, dir) {
        // 调用下面的updater方法
        var updaterFn = updater[dir + 'Updater'];

        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    eventHandler: function(node, vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal: function(vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};


var updater = {
    textUpdater: function(node, value) {
        // textContent 修改元素的文本内容
        // typeof 返回一个字串，是value的类型。如果是 'undefined' 就显示空。
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};