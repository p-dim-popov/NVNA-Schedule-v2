(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{5:function(n,e,t){"use strict";t.r(e),t.d(e,"Router",(function(){return a}));
/*!
 * hash-router v1.2.7
 * https://github.com/michaelsogos/Hash-Router
 * 
 * Developed by Michael Sogos
 * Copyright 2016
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 CreatedOn: 2014-10-19
 *
 * Copyright (C) 2016 by Michael Sogos <![[michael.sogos[at]gurustudioweb[dot]it]]>
 * Thanks to these libraries to inspired me:
 * - path.js https://github.com/mtrpcic/pathjs
 * - sammy.js http://sammyjs.org/
 * - director.js https://github.com/flatiron/director
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 **/
const a={init:function(n,e){return a.__eventOnChange=n,a.__eventOnNotFound=e,"onhashchange"in window?(a.__bindHashChange(),""==window.location.hash||"#"==window.location.hash?(a.__listener("#/"),!0):(a.__listener(window.location.hash),!0)):(console.error("The browser doesn't support HASH on URL!"),!1)},navigate:function(n){window.location.hash=n},run:function(n){null!=a.__eventOnChange&&a.__eventOnChange(n),a.__run(n,"before")},add:function(n,e){var t=!1;if(!n.path)return console.error("Cannot find property path when adding a new route!"),!1;for(var r=0;r<a.routes.length;r++)if(a.routes[r].path===n.path){if(t=!0,!0===e)return a.routes[r]=n,!0;break}return t?(console.error("A route for the path "+n.path+" is already mapped!"),!1):(a.routes.push(n),!0)},findRoute:function(n){for(var e=0;e<a.routes.length;e++)if(a.routes[e].path===n)return a.routes[e]},matchRoute:function(n){var e=a.__cleanHash(n),t=e.hashParams.split("/"),r=e.hashParams,o={},h={};if(e.hashQueryArray.length>0)for(var s=0;s<e.hashQueryArray.length;s++){var u=e.hashQueryArray[s].split("=");u.length>=1&&u[0]&&(h[decodeURIComponent(u[0])]=u[1]?decodeURIComponent(u[1]):"")}for(var i=0;i<a.routes.length;i++){var _=a.routes[i];if(r=e.hashParams,_.path.search(/:/)>0)for(var l=_.path.split("/"),c=0;c<l.length;c++)c<t.length&&":"===l[c].charAt(0)&&(o[l[c].replace(/:/,"")]=t[c],r=r.replace(t[c],l[c]));if(_.path===r)return _.params=o,_.url=n,_.query=h,_}return null},actualRoute:function(){return this.matchRoute(window.location.hash)},routes:[],__bindHashChange:function(){window.onhashchange=function(){a.__listener(location.hash)}},__cleanHash:function(n){var e={},t=n.indexOf("?");e.hash=n,e.hashParams=t>=0?n.substring(0,t):n,e.hashQuery=t>=0?n.substring(n.indexOf("?")+1):"",e.hashQueryArray=e.hashQuery?e.hashQuery.split("&"):[];var r=e.hashParams.replace(/\/+$/,"");return e.hashParams!==r&&(window.onhashchange=null,e.hash=r,e.hash+=e.hashQuery?"?"+e.hashQuery:"",window.location.hash=e.hash,a.__bindHashChange()),e},__listener:function(n){var e=a.matchRoute(n);return e||a.__eventOnNotFound?!e&&a.__eventOnNotFound?(a.__eventOnNotFound(a.__hashToArray(n)),!1):a.run(e):(console.error("Cannot find a valid route for hash "+n+"!"),!1)},__hashToArray:function(n){var e=n.split("/");return e.length>0&&"#"==e[0]&&e.shift(),e},__run:function(n,e,t){if(n[e]){var r=new a.__task((function(t){var r=a.__nextState(e);r&&a.__run(n,r,t)}));n.event={},n.event.previousResult=t,n.event.state=e,n.task=r,n[e]()}else{var o=a.__nextState(e);o&&a.__run(n,o)}},__nextState:function(n){return"before"==n?"on":"on"==n?"after":null},__eventOnChange:null,__eventOnNotFound:null,__task:function(n){return{__callback:n,done:function(n){this.__callback(n)}}}}}}]);