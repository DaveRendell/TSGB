if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let l={};const o=e=>i(e,t),u={module:{uri:t},exports:l,require:o};s[t]=Promise.all(n.map((e=>u[e]||o(e)))).then((e=>(r(...e),l)))}}define(["./workbox-7cfec069"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-mQ7C_XzF.css",revision:null},{url:"assets/index-N21Ov4cV.js",revision:null},{url:"assets/index-Nd5_4BhV.js",revision:null},{url:"assets/index-uFkXWL6z.js",revision:null},{url:"assets/index-yuoR-J8w.js",revision:null},{url:"index.html",revision:"071a6d2a7544a07017765815de74e0e8"},{url:"registerSW.js",revision:"7fe60ca1bc4ae7eafe540d90992d8206"},{url:"manifest.webmanifest",revision:"c2549d950684cea0d583d632513aa5b7"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
//# sourceMappingURL=sw.js.map
