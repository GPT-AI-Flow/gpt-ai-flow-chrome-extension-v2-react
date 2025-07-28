import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

// 集成文本总结功能
import "./plugins/text-summary/background-extension";
