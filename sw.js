if(!self.define){let s,e={};const i=(i,n)=>(i=new URL(i+".js",n).href,e[i]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()})).then((()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s})));self.define=(n,l)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let u={};const t=s=>i(s,r),o={module:{uri:r},exports:u,require:t};e[r]=Promise.all(n.map((s=>o[s]||t(s)))).then((s=>(l(...s),u)))}}define(["./workbox-7cfec069"],(function(s){"use strict";self.addEventListener("message",(s=>{s.data&&"SKIP_WAITING"===s.data.type&&self.skipWaiting()})),s.precacheAndRoute([{url:"assets/index-3JGfrkL3.js",revision:null},{url:"assets/index-4VH8xLe7.js",revision:null},{url:"assets/index-8FeogP9c.js",revision:null},{url:"assets/index-9URa0g_X.js",revision:null},{url:"assets/index-9UxTbK8_.js",revision:null},{url:"assets/index-azlxNKjz.js",revision:null},{url:"assets/index-EtQ_wNX6.css",revision:null},{url:"assets/index-FabJ7qGr.css",revision:null},{url:"assets/index-fMuMV4kd.js",revision:null},{url:"assets/index-FYACCcoe.css",revision:null},{url:"assets/index-ihOgJ9fG.js",revision:null},{url:"assets/index-JeXDP0IF.css",revision:null},{url:"assets/index-KgCjzu7M.js",revision:null},{url:"assets/index-mQ7C_XzF.css",revision:null},{url:"assets/index-N21Ov4cV.js",revision:null},{url:"assets/index-nC7bC0MK.css",revision:null},{url:"assets/index-Nd5_4BhV.js",revision:null},{url:"assets/index-nIC53Y0F.js",revision:null},{url:"assets/index-q9pwenQs.js",revision:null},{url:"assets/index-r98hkaB_.js",revision:null},{url:"assets/index-SWltQ8G0.js",revision:null},{url:"assets/index-tJitNTRc.js",revision:null},{url:"assets/index-uFkXWL6z.js",revision:null},{url:"assets/index-Vez8w4kf.js",revision:null},{url:"assets/index-yuoR-J8w.js",revision:null},{url:"assets/index-yxdpLQnc.js",revision:null},{url:"index.html",revision:"a570fbde83177d226da75b27ccbf72bf"},{url:"registerSW.js",revision:"7fe60ca1bc4ae7eafe540d90992d8206"},{url:"manifest.webmanifest",revision:"c2549d950684cea0d583d632513aa5b7"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
