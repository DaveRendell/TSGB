if(!self.define){let s,e={};const n=(n,i)=>(n=new URL(n+".js",i).href,e[n]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=n,s.onload=e,document.head.appendChild(s)}else s=n,importScripts(n),e()})).then((()=>{let s=e[n];if(!s)throw new Error(`Module ${n} didn’t register its module`);return s})));self.define=(i,l)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let u={};const t=s=>n(s,r),o={module:{uri:r},exports:u,require:t};e[r]=Promise.all(i.map((s=>o[s]||t(s)))).then((s=>(l(...s),u)))}}define(["./workbox-7cfec069"],(function(s){"use strict";self.addEventListener("message",(s=>{s.data&&"SKIP_WAITING"===s.data.type&&self.skipWaiting()})),s.precacheAndRoute([{url:"assets/index-3JGfrkL3.js",revision:null},{url:"assets/index-8FeogP9c.js",revision:null},{url:"assets/index-9UxTbK8_.js",revision:null},{url:"assets/index-azlxNKjz.js",revision:null},{url:"assets/index-fMuMV4kd.js",revision:null},{url:"assets/index-FYACCcoe.css",revision:null},{url:"assets/index-JeXDP0IF.css",revision:null},{url:"assets/index-mQ7C_XzF.css",revision:null},{url:"assets/index-N21Ov4cV.js",revision:null},{url:"assets/index-nC7bC0MK.css",revision:null},{url:"assets/index-Nd5_4BhV.js",revision:null},{url:"assets/index-nIC53Y0F.js",revision:null},{url:"assets/index-q9pwenQs.js",revision:null},{url:"assets/index-r98hkaB_.js",revision:null},{url:"assets/index-uFkXWL6z.js",revision:null},{url:"assets/index-Vez8w4kf.js",revision:null},{url:"assets/index-yuoR-J8w.js",revision:null},{url:"index.html",revision:"7471802076a2b3179563a2f711f1a394"},{url:"registerSW.js",revision:"7fe60ca1bc4ae7eafe540d90992d8206"},{url:"manifest.webmanifest",revision:"c2549d950684cea0d583d632513aa5b7"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
