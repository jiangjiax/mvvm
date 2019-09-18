# mvvm
仿造一个简易版vue（其实就是一个支持双向绑定的mvvm框架）

思路：

总共有四个步骤，分别是监听器Observer，解析器Compile，订阅者Watcher，入口函数

1. 制作一个监听器Observer，监听所有数据对象，如果数据有变动，就把变动值传给订阅者。
2. 制作一个解析器Compile，对所有元素进行解析，根据不同的指令渲染模板数据和绑定函数。
3. 制作一个订阅者Watcher，通过监听器Observer订阅并收到每个属性变动的通知，再执行解析器Compile进行更新。
4. 定义入口函数，整合以上，并在页面使用。

![思路图](https://github.com/jiangjiax/mvvm/blob/master/img/%E6%80%9D%E8%B7%AF%E5%9B%BE.png?raw=true)
