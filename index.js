const request = require('request');
const cheerio = require("cheerio");
const superagent = require("superagent");

const weiboURL = 'https://s.weibo.com';
const weiboHotSearch = weiboURL + '/top/summary?cate=realtimehot';
const webHookURL = '[企业微信 WebHookURL]'

function requestfun(msg) {
    var resData = {
        "msgtype": "markdown",
        "markdown": {
            "content": msg,
        }
    };
    superagent.post(webHookURL)
    .set('content-type', 'application/json')
    .send(JSON.stringify(resData))
    .end((err,res) => {
        console.log('消息发送成功！');
    })
}

function getHotSearchList() {
    return new Promise((resolve, reject) => {
      superagent.get(weiboHotSearch, (err, res) => {
        if (err) reject("request error");
        const $ = cheerio.load(res.text);
        let hotList = [];
        $("#pl_top_realtimehot table tbody tr").each(function (index) {
          if (index !== 0) {
            const $td = $(this).children().eq(1);
            const link = weiboURL + $td.find("a").attr("href");
            const text = $td.find("a").text();
            const hotValue = $td.find("span").text();
            const icon = $td.find("img").attr("src")
              ? "https:" + $td.find("img").attr("src")
              : "";
            hotList.push({
              index,
              link,
              text,
              hotValue,
              icon,
            });
          }
        });
        hotList.length ? resolve(hotList) : reject("errer");
      });
    });
}
// 获取微博热搜榜
async function sendWeiboData() {
    const data = await getHotSearchList();
    var sendMsg = '微博热搜榜前十：';
    data.splice(0,10).forEach(item => {
        sendMsg += `\n[${item.index}. ${item.text}](${item.link})`
    })
    requestfun(sendMsg);
}
var i = 0;
setInterval(() => {
    i++;
    sendWeiboData()
    console.log(`第${i}条消息`)
}, 1000 * 60 * 60);

console.log('Start successfully');
