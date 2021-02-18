const request = require('request');
const fs = require('fs');
const cheerio = require("cheerio");
const path = require('path');
const superagent = require("superagent");
const { holiday_2021 } = require('./const/time');

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
    .end((err, res) => {
      console.log('消息发送成功！');
    })
}

// 统一生成writeStream
function createWriteStream(fileName) {
  const fullFileName = path.join(__dirname, './', 'log', fileName)
  const writeStream = fs.createWriteStream(fullFileName, {
    flags: 'a' //'a'为追加，'w'为覆盖
  })
  return writeStream
}

// 写入日志
function writeLog(writeStream, log) {
  writeStream.write(log + '\n')
}

// 抓取微博热搜页面，提取热搜数据json
function getHotSearchList() {
  const weiboURL = 'https://s.weibo.com';
  const weiboHotSearch = weiboURL + '/top/summary?cate=realtimehot';
  return new Promise((resolve, reject) => {
    superagent.get(weiboHotSearch, (err, res) => {
      try {
        let hotList = [];
        if (err) throw Error(err);
        const $ = cheerio.load(res.text);
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
      } catch (error) {
        const myDate = new Date();
        const Y = myDate.getFullYear();
        const M = myDate.getMonth() + 1;
        const D = myDate.getDate();
        const curDay = Y + '-' + M + '-' + D;
        const fileName = curDay + '-' + myDate.getTime() % 100000;
        const accessWriteStream = createWriteStream(`${fileName}.log`);
        writeLog(accessWriteStream, `报错时间：\n${curDay + ' ' + myDate.toTimeString()}`);
        writeLog(accessWriteStream, `微博链接：\n${weiboHotSearch}`);
        writeLog(accessWriteStream, `网页内容：\n${JSON.stringify(res)}`);
        writeLog(accessWriteStream, `报错信息：\n${error}`);
        requestfun(`微博热搜数据爬取失败，请查看报错日志：${fileName}.log`);
        // 一分钟后重新爬取微博热搜数据
        setTimeout(getHotSearchList, 1000 * 60 * 10);
      }
    });
  });
}
// 获取微博热搜榜
async function sendWeiboData() {
  let data;
  try {
    data = await getHotSearchList();
  } catch (error) {
    console.log(error)
  }
  var sendMsg = '微博热搜榜前十五：';
  const topTenArr = data.splice(0, 15);
  topTenArr.forEach(item => {
    sendMsg += `\n[${item.index}. ${item.text}， 热度：${item.hotValue}](${item.link})`
  })
  requestfun(sendMsg);
}
// 爬取微博图片
// function getWeiboPics() {
//   const containerId="1076035796662600"; // 吴宣仪ID
//   const url = `https://m.weibo.cn/api/container/getIndex?containerid=${containerId}&page=`;
//   for(var i = 1; i < 3; i++) {
//     superagent(url + i, (err, res) => {
//       const data = JSON.parse(res.text).data;
//       const urlArr = data.cards
//         .map(item => item.mblog.pics && item.mblog.pics.map(pic => pic.large && pic.large.url))
//         .flat()
//         .filter(item => item);
//       console.log(urlArr)
//       urlArr.forEach(url => {
//         const fileName = url.split('/').pop();
//         request(url).pipe(fs.createWriteStream(`./assets/${fileName}`));
//       })
//     })
//   }
// }
// sendWeiboData();
// 

// 补充前缀0
function addZero(num) {
  if (num <= 9) return '0' + num;
  return num;
}

function mySetInterval(cb, time) {
  let timer;
  let fn = () => {
    cb();
    const curHours = new Date().getHours();
    if (curHours < 9 || curHours > 19) {
      if (timer) clearTimeout(timer);
      return;
    }
    timer = setTimeout(fn, time)
  };
  fn();
}

// 工作日每隔一小时爬取微博数据
function getWeiboDataInWorkDay() {
  const myDate = new Date();
  const M = myDate.getMonth() + 1;
  const D = myDate.getDate();
  // 非工作日返回
  if (holiday_2021[addZero(M)][addZero(D)]) return;
  mySetInterval(sendWeiboData, 1000 * 60 * 60)
}
getWeiboDataInWorkDay();
console.log('Start successfully');
