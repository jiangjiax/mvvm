// 监听器 Observer

function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    constructor: Observer,
    walk: function(data) {
        var me = this;
        // JavaScript中的所有对象都来自 Object，所有对象从Object.prototype继承方法和属性，Object 原型对象的更改将传播到所有对象。
        // Object.keys() 将返回一个包含所有给定对象自身可枚举属性名称的数组。
        Object.keys(data).forEach(function(key) {
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        // 通过dep添加订阅者watcher
        var dep = new Dep();
        var childObj = observe(val);

        // Object.defineProperty() 给对象添加一个属性并指定该属性的配置。
        // Object.defineProperty(要在其上定义属性的对象, 要定义或修改的属性的名称, 将被定义或修改的属性描述符)
        Object.defineProperty(data, key, {
            // enumerable 定义了对象的属性是否可以在 for...in 循环和 Object.keys() 中被枚举。
            enumerable: true, // 可枚举
            // configurable 特性表示对象的属性是否可以被删除和修改
            configurable: false, // 不能再define
            // 目标属性获取值的方法
            get: function() {
                // 通过Dep定义一个全局target属性，暂存watcher
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            // 当属性值修改时，触发执行该方法。该方法将接受唯一参数，即该属性新的参数值。
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }

    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },

    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        this.subs.forEach(function(sub) {
            // 调用订阅者的update方法
            sub.update();
        });
    }
};

Dep.target = null;