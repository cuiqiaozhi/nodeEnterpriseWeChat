const request = require('request');

const webHookURL = '[企业微信群机器人WebHook]'

function requestfun(msg) {
    var resData = {
        "msgtype": "markdown",
        "markdown": {
            "content": msg,
        }
    };
    // url 为企业机器人的webhook
    request({
        url: webHookURL,
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(resData)
    }, function (error, response, body) {
        console.log('消息发送成功！');
    });
}

// 获取微博热搜榜
function sendWeiboData() {
    request({
        url: "https://api.hmister.cn/weibo/",
        method: "GET",
        headers: {
            "content-type": "application/json",
        },
    }, function (error, res, body) {
        const data = JSON.parse(body) || {}
        if(data.code === 200) {
            console.log('获取微博热搜数据成功~');
            // console.log(data.data);
        }
        var sendMsg = '微博热搜榜前十：';
        data.data.splice(0,10).forEach(item => {
            sendMsg += `\n[${item.id}. ${item.name}](${item.url})`
        })
        requestfun(sendMsg);
    });
}
sendWeiboData();
var i = 0;
// setInterval(() => {
//     i++;
//     sendWeiboData()
//     console.log(`第${i}条消息`)
// }, 1000 * 60 * 60);

console.log('Start successfully');
