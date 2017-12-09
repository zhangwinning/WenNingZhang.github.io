---
layout: post
title: 重写express(一)
key: 10002
tags: express
category: blog
date: 2017-12-09T12:21:55+08:00
modify_date: 2017-12-09T12:22:55+08:00
---

  一直以为学好一个东西最好的方法，就是实现它，接下来就会一步步实现express。

<!--more-->

## 基本知识
* 作用

  实现URL的重写以及匹配的URL重定向。

* 配置语法

```
Syntax: rewrite regex replacement [flag];
Default: --
Context: server, location, if
```

* 正则表达式

  小括号（） 用于匹配括号之间的内容，通过 $1、$2 调用

```
if ($http_user_agent ~ MSIE) {
     rewrite ^(.*)$  /msie/$1 break;
}
//代理是MSIN的，如果是/test.html ,会跳转到/msin/test.html 页面中
```

* flag 标记位

  标记rewrite的类型

| 类型 | 解释 |
| :---: | :---: |
| last | 停止rewrite检测 |
| break | 停止rewrite检测 |
| redirect | 返回302临时重定向，地址栏会显示跳转后的地址 |
| pemanent | 返回301永久重定向，地址栏会显跳转后的地 |

比较flag标记位的last、break

```
server {
        listen  8000 ;
        server_name localhost;
        root /root/opt/app/code;
        location ~^/break {
                rewrite ^/break /static/  break;
        }
        location ~^/last {
                rewrite ^/last /test/ last;
        }
        location /test/ {
                default_type application/json;
                return 200 '{"status":"success", "remote_addr": $remote_addr}';
        }
}
```

~ 表示区分大小写的正则匹配。

访问 \`/break\` 会匹配第一个location，标志位是 break ，这时nginx会找root目录下的/static/目录的index.html文件，如果没有，返回404，找到显示。

而访问\`/last\`会匹配第二个location，标志位是 last ，这时nginx会_重新匹配一个请求URL为/test/的_，匹配第三个location，返回结果。

比较flag标记位的redirect、last。

```
server {
        listen  8000 ;
        server_name localhost;
        root /root/opt/app/code;
        location ~^/last {
                rewrite ^/last /test/ last;
      #          rewrite ^/last /test/ redirect;
        }
        location /test/ {
                default_type application/json;
                return 200 '{"status":"success", "remote_addr": $remote_addr}';
        }
}
```

last在日志中就一条日志，客户端就发送一次请求。

redirect是有两条日志，其中第一条是状态302，并且请求头中有location，为重定向的地址。第二条返回200。nignx一看是redirect，就重新发送一次请求，从而匹配第三个。

```
last日志:
*   Trying 106.15.231.221...
* Connected to 106.15.231.221 (106.15.231.221) port 8000 (#0)
> GET /last HTTP/1.1
> Host: 106.15.231.221:8000
> User-Agent: curl/7.43.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.10.3 (Ubuntu)
< Date: Wed, 15 Nov 2017 07:49:04 GMT
< Content-Type: text/html
< Content-Length: 165
< Last-Modified: Wed, 15 Nov 2017 02:09:17 GMT
< Connection: keep-alive
< Vary: Accept-Encoding
< ETag: "5a0ba1cd-a5"
< Accept-Ranges: bytes
<
<html>
<head>
    <meta charset="utf-8">
    <title>test proxy</title>
</head>
<body style="background-color:red;">
    <h1>this is test proxy</h1>
</body>
</html>

redirect日志:
*   Trying 106.15.231.221...
* Connected to 106.15.231.221 (106.15.231.221) port 8000 (#0)
> GET /last HTTP/1.1
> Host: 106.15.231.221:8000
> User-Agent: curl/7.43.0
> Accept: */*
>
< HTTP/1.1 302 Moved Temporarily
< Server: nginx/1.10.3 (Ubuntu)
< Date: Wed, 15 Nov 2017 07:51:14 GMT
< Content-Type: text/html
< Content-Length: 170
< Location: http://106.15.231.221:8000/test/
< Connection: keep-alive
<
* Ignoring the response-body
* Connection #0 to host 106.15.231.221 left intact
* Issue another request to this URL: 'http://106.15.231.221:8000/test/'
* Found bundle for host 106.15.231.221: 0x7fc91b607150
* Re-using existing connection! (#0) with host 106.15.231.221
* Connected to 106.15.231.221 (106.15.231.221) port 8000 (#0)
> GET /test/ HTTP/1.1
> Host: 106.15.231.221:8000
> User-Agent: curl/7.43.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.10.3 (Ubuntu)
< Date: Wed, 15 Nov 2017 07:51:14 GMT
< Content-Type: application/json
< Content-Length: 51
< Connection: keep-alive
<
* Connection #0 to host 106.15.231.221 left intact
{"status":"success", "remote_addr": 101.231.137.70}
```

而redirect 和permanent 也可以重定向到其他的网页。完成重定向

* rewrite 规则在不同模块下的优先级是不同的。

  * 执行server 块中rewrite指令

  * 执行location 匹配

  * 执行location 的rewrite 指令

## 实践
接下来看一个redirect的应用

```
server {
        listen  8000 ;
        server_name localhost;
        root /root/opt/app/code;
        location / {
#                rewrite ^/course-(\d+)-(\d+)-(\d+)\.html$ /course/$1/$2/course_$3.html break;
#                rewrite  ^/nginx https://www.baidu.com redirect;
                 if (!-f $request_filename) {
                             rewrite ^/(.*)$ http://www.baidu.com/$1 redirect;
                  }
        }
        location ~ ^/http_user_agent {
                echo 'test';
                return 200 '{"http_user_agent": "$http_user_agent", "request_filename": "$request_filename", "-f $request_filename": "-f $request_filename"}';
        }
}
```

~ ^/http\_user\_agent 其中 ~ 表示区分大小写的正则匹配，如果这个匹配不成，走通用匹配 /

先看第一个rewrite，若请求路径为\`/course-2-2-2.html\`， 因为rewrite 的标志位是break，说明请求静态文件，而请求的静态文件位置为  root/opt/app/code/course/2/2/course\_2.html；

第二个rewrite 是表示 开头以nginx开头，这时会重定向到[https://www.baidu.com。](https://www.baidu.com。)

第三个rewrite，当请求的文件在/root/opt/app/code 中不存在时，这里的 -f 就是判断 请求文件在此目录下是否存在，不存在时重定向到百度页面。

<a href="http://seanlook.com/2015/05/17/nginx-location-rewrite/" target="_blank">nginx配置location总结及rewrite规则写法</a>

<a href="https://yuerblog.cc/2017/06/12/nginx-rewrite-problem/" target="_blank">nginx配置location总结及rewrite规则写法</a>
