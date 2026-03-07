// Service Worker: 使 chrome.tabs API 可通过 CDP Runtime.evaluate 调用
// keepalive alarm 防止 MV3 service worker 休眠（30秒无事件会被终止）

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("keepalive", { periodInMinutes: 0.4 });
  console.log("标签页智能分组 v1.1 - Service Worker ready (keepalive armed)");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepalive") {
    // 空回调即可，alarm 事件本身会唤醒 SW
  }
});
