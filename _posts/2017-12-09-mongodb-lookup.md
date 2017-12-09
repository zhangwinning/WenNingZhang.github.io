---
layout: post
title: mongodb aggregate实现一对多、一对一的查询
key: 20171202
tags: Nginx
category: blog
date: 2017-12-09T18:39:34+08:00
modify_date: 2017-12-09T18:44:34+08:00
---

 MongoDB 3.2原来已经实现一对多、一对一的查询 :wave: :wave:

<!--more-->

## 一对多

先创建一张表`countryCode`

```
db.countryCode.insert([{code: 1}, {code: 20}, {code: 30}])
```

![](http://wx4.sinaimg.cn/large/e8616f3dly1fmapix2e3zj20xe074myo.jpg)

第二张表`countryCodeLookup`，这张表显示country的code和country的name 的对应关系是`一对多`

```
db.countryCodeLookup.insert([{code: 1, name: "United States"}, {code: 20, name: "Egypt"},
{code: 1, name: "Foobar"}, {code: 30, name: "Greece"}])
```

![](http://wx2.sinaimg.cn/large/e8616f3dly1fmapiwmxsqj20x30aojtv.jpg)

### $lookup、$project

下面通过 $lookup 操作符连接两个集合，其中 $project 会过滤属性

```
db.countryCode.aggregate([
{ $lookup: {from: "countryCodeLookup", localField: "code", foreignField: "code", as: "countryName"} },
{ $project: {"code":1, "countryName.name":1, "_id":0} }
])
```

![](http://wx1.sinaimg.cn/large/e8616f3dly1fmapiw7q16j20wr0c1tao.jpg)

### $match

$match 会查询连接后的表，显示符合条件的。

```
db.countryCode.aggregate([
{ $lookup: {from: "countryCodeLookup", localField: "code", foreignField: "code", as: "countryName"} },
{ $project: {"code":1, "countryName.name":1, "_id":0} },
{ $match:{"code":1.0}}
])
```

![](http://wx3.sinaimg.cn/large/e8616f3dly1fmapivt4r1j20wa08dmyg.jpg)

## 一对一

### $unwind

$unwind操作符会分解$lookup中的as数组，使之扁平化返回。

```
db.countryCode.aggregate([
{ $lookup: {from: "countryCodeLookup", localField: "code", foreignField: "code", as: "countryName"} },
{ $project: {"code":1, "countryName.name":1, "_id":0} },
{ $unwind: "$countryName"},
{ $match:{"code":1.0}}
])
```

![](http://wx3.sinaimg.cn/large/e8616f3dly1fmapivt4r1j20wa08dmyg.jpg)

现在countryName是一个子文档，在project中设置把子文档中的属性拿出来，这里$project要在$unwind属性后面。

```
db.countryCode.aggregate([
{ $lookup: {from: "countryCodeLookup", localField: "code", foreignField: "code", as: "countryName"} },
{ $unwind: "$countryName"},
{ $project: {"code":1, "name": "$countryName.name", "_id":0} }
])
```

![](http://wx2.sinaimg.cn/large/e8616f3dly1fmapisx2y3j20xw0admyq.jpg)

[参考文档](https://www.codeproject.com/Articles/1077839/Working-with-MongoDBs-lookup-Aggregator)
