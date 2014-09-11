# fetchproxy

### 2014.9.11

这是一个从[pachong.org][1]网站抓免费代理地址的程序

是因为之前写爬虫的时候需要代理，然后找到这个网站，但有些代理可能速度比较慢或者连不上

尽管该网站提供了测试代理速度的功能，但手动点击并且人工看结果再粘贴复制比较累，所有有了这个程序

由于该网站上代理的端口和测试功能都是js生成的，所以使用了casperjs

### 依赖

-  casperjs (1.1.0-beta3)

如果有nodejs，安装casperjs就很简单了
```
sudo npm install casperjs -g
```

### 使用方法

```
casperjs fetch.js
```
参数全在`fetch.js`的_config变量中，可自行调整

[1]: http://pachong.org/

