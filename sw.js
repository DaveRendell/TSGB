if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,t)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let l={};const o=e=>i(e,r),d={module:{uri:r},exports:l,require:o};s[r]=Promise.all(n.map((e=>d[e]||o(e)))).then((e=>(t(...e),l)))}}define(["./workbox-7cfec069"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-eEAkNQo5.css",revision:null},{url:"assets/index-EtQ_wNX6.css",revision:null},{url:"assets/index-kItpMxut.js",revision:null},{url:"assets/index-Pm9GWiKh.js",revision:null},{url:"index.html",revision:"ba84a4c998c07d871a314efd9d0fda9c"},{url:"registerSW.js",revision:"7fe60ca1bc4ae7eafe540d90992d8206"},{url:"manifest.webmanifest",revision:"c2549d950684cea0d583d632513aa5b7"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
