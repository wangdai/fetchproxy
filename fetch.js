/*
 * 程序: fetch.js
 * 作者: wangdai
 * 时间: 2014.9.10
 * 版本: 0.1
 * 功能: 抓取pachong.org上的代理, 按速度顺序排序
 * 依赖: casperjs
 * 使用方法: casperjs fetch.js
 */

// js include起来不是很方便，所以config也写在一起了
var _config = {
	// 这个抓取程序主要是针对pachong.org的，当然可以改成pachong.org的其他类似页面
	// 如http://pachong.org/transparent.html	
	'pagePath': 'http://pachong.org/anonymous.html',

	// pachong.org提供的测试功能大概要等待1分钟	
	'waitTime': 60 * 1000,

	// 是否向stdout输出log
	'verbose': true,

	// 4个level: debug < info < warning < error
	// 指定debug就输出大于等于debug级别的log
	'logLevel': 'debug',

	// 是否要指定国家
	// 例如['中国', '美国']
	// []表示所有国家
	'country': ['中国'],
	
	// 响应速度超过这个值的代理将被过滤，单位是ms
	'threshold': 1500,

	'fileName': 'proxy.txt',

	'delimiter': ' '
}

var casper = require('casper').create({
    verbose: _config.verbose,
    logLevel: _config.logLevel
});
var utils = require('utils');
var fs = require('fs');

casper.start(_config.pagePath);
casper.then(function() {
    this.click('a.alltest');
});
casper.wait(_config.waitTime, function() {
	var i, data;
    var arr = this.evaluate(function(_config) {
        var i, j;
        var rows, cols;
        var host, port, speed, country, anonymity, status;
		var matchStr;
        var arr = Array();
        rows = document.querySelectorAll('table.tb tbody tr');
		if (rows.length == 0) {
			console.log('[error]', '代理表格的行数为0, 可能是网页结构变化, 也可能是url不对');
			return null;
		}
        for (i = 0; i < rows.length; i++) {
            cols = rows[i].querySelectorAll('td');
            host = cols[1].textContent;
            port = cols[2].innerHTML.replace(/<\w+>[^<]*<\/\w+>/, ''); // 把一段<script>给去除掉
			country = cols[3].textContent.trim().replace('        ', '').replace('\n', ''); // ugly code
			if (_config.country.length != 0) {
				for (j = 0; j < _config.country.length; j++) {
					if (country.match(_config.country[j]) != null) {
						break;
					}
				}
				if (j == _config.country.length) {
					continue;
				}
			}
			anonymity = cols[4].textContent.trim();
			status = cols[5].textContent.trim();
            speed = cols[6].textContent;
			if (speed.match('异常') != null) {
				continue;
			}
			if (speed.match('测试中') != null) {
				console.log('[warning]', i + ' ' + host + ':' + port + ' 该代理的速度还在测试中, 将不输出这个代理, 有可能是waitTime设置的略小');
				continue;
			}
			if (matchStr = speed.match(/(\d+)ms/)) {
				speed = Number(matchStr[1]);
			} else if (matchStr = speed.match(/(\d+)秒/)) {
				speed = Number(matchStr[1]) * 1000;
			} else {
				console.log('[error]', i + ' ' + host + ':' + port + ' 在该代理的速度一栏得到了未预期的值, 有可能是网页内容变动');
				continue;
			}
			if (speed > _config.threshold) {
				continue;
			}
            arr.push({
				'host': host,
				'port': port,
				'country': country,
				'anonymity': anonymity,
				'status': status,
				'speed': speed
			});
        }
        return arr;
    }, _config);
	if (arr.length == 0 || arr == null) {
		this.log('没有抓取到符合条件的代理', 'error');
		this.exit();
	}
	arr.sort(function(a, b) {
		return a.speed - b.speed;
	});
	data = '';
	for (i = 0; i < arr.length; i++) {
		data += (arr[i].host + _config.delimiter + 
				arr[i].port + _config.delimiter + 
				arr[i].country + _config.delimiter + 
				arr[i].anonymity + _config.delimiter +
				arr[i].status + _config.delimiter +
				arr[i].speed + 'ms\n');
	}
	if (_config.fileName != '') {
		fs.write(_config.fileName, data, 'w');
	} else {
		this.echo(data);
	}
});

casper.on('remote.message', function(msg) {
	var matchStr;
	if (matchStr = msg.match(/\[(\w+)\] (.+)/)) {
		this.log(matchStr[2], matchStr[1]);
	} else {
		this.log('[console] ' + msg, 'warning');
	}
});

casper.run();
