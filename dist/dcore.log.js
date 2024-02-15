(function(){
	// 儲存 console-quote
	let logs = [];
	// 日期物件轉為 "2017/12/31 12:30:50.123" 格式
	let formatString=function(t){for(var g=t.getFullYear().toString(),n=(t.getMonth()+1).toString(),r=t.getDate().toString(),e=t.getHours().toString(),o=t.getMinutes().toString(),i=t.getSeconds().toString(),S=t.getMilliseconds().toString(),l=0;l<3-S.length;l+=1)S="0"+S;return g+"/"+(n[1]?n:"0"+n[0])+"/"+(r[1]?r:"0"+r[0])+" "+(e[1]?e:"0"+e[0])+":"+(o[1]?o:"0"+o[0])+":"+(i[1]?i:"0"+i[0])+"."+S};
	// 組合單行 log
	let argsToString = (args)=>{
		// 支持指定不要送往 cloud (ex. 總表)
		if (args[3] && args[3].NOT_TO_CLOUD)
			return;
		// 單筆資料量大於 1MB 不送 (會送失敗)
		if (args[2] && args[2].length > 1024000)
			return;
		// 物件轉字串
		for (let i=0; i<args.length; i++) {
			if (typeof(args[i]) === 'object')
				args[i] = JSON.stringify(args[i]);
		}
		let result = formatString(args.time) + ' ' +  args.join(' ');
		return result;
	};
	// 覆寫 console.log
	let orgLog = console.log;
	console.log = function(...args){
		args.time = new Date();
		logs.push(args)
		orgLog.apply(this, arguments);
	};
    // 覆寫 console.error
	let orgErr = console.error;
	console.error = function(...args){
		args.time = new Date();
		logs.push(args)
		orgErr.apply(this, arguments);
	};
	// 取得當前的 console 內容
	let getCurrConsole = function(){
		let len = logs.length;
		if (len === 0)
			return "";
		let str = "";
		for (let i=0; i<len; i++) {
			let newLine = argsToString(logs[i]);
			if (newLine)
				str = str + newLine + "\r\n";
		}
		logs = [];
		return str;
	};

	// inline compressworker
	let content = "var LZString={_keyStr:\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\",_f:String.fromCharCode,compressToBase64:function(e){if(e==null)return\"\";var t=\"\";var n,r,i,s,o,u,a;var f=0;e=LZString.compress(e);while(f<e.length*2){if(f%2==0){n=e.charCodeAt(f/2)>>8;r=e.charCodeAt(f/2)&255;if(f/2+1<e.length)i=e.charCodeAt(f/2+1)>>8;else i=NaN}else{n=e.charCodeAt((f-1)/2)&255;if((f+1)/2<e.length){r=e.charCodeAt((f+1)/2)>>8;i=e.charCodeAt((f+1)/2)&255}else r=i=NaN}f+=3;s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+LZString._keyStr.charAt(s)+LZString._keyStr.charAt(o)+LZString._keyStr.charAt(u)+LZString._keyStr.charAt(a)}return t},decompressFromBase64:function(e){if(e==null)return\"\";var t=\"\",n=0,r,i,s,o,u,a,f,l,c=0,h=LZString._f;e=e.replace(/[^A-Za-z0-9+/=]/g,\"\");while(c<e.length){u=LZString._keyStr.indexOf(e.charAt(c++));a=LZString._keyStr.indexOf(e.charAt(c++));f=LZString._keyStr.indexOf(e.charAt(c++));l=LZString._keyStr.indexOf(e.charAt(c++));i=u<<2|a>>4;s=(a&15)<<4|f>>2;o=(f&3)<<6|l;if(n%2==0){r=i<<8;if(f!=64){t+=h(r|s)}if(l!=64){r=o<<8}}else{t=t+h(r|i);if(f!=64){r=s<<8}if(l!=64){t+=h(r|o)}}n+=3}return LZString.decompress(t)},compressToUTF16:function(e){if(e==null)return\"\";var t=\"\",n,r,i,s=0,o=LZString._f;e=LZString.compress(e);for(n=0;n<e.length;n++){r=e.charCodeAt(n);switch(s++){case 0:t+=o((r>>1)+32);i=(r&1)<<14;break;case 1:t+=o(i+(r>>2)+32);i=(r&3)<<13;break;case 2:t+=o(i+(r>>3)+32);i=(r&7)<<12;break;case 3:t+=o(i+(r>>4)+32);i=(r&15)<<11;break;case 4:t+=o(i+(r>>5)+32);i=(r&31)<<10;break;case 5:t+=o(i+(r>>6)+32);i=(r&63)<<9;break;case 6:t+=o(i+(r>>7)+32);i=(r&127)<<8;break;case 7:t+=o(i+(r>>8)+32);i=(r&255)<<7;break;case 8:t+=o(i+(r>>9)+32);i=(r&511)<<6;break;case 9:t+=o(i+(r>>10)+32);i=(r&1023)<<5;break;case 10:t+=o(i+(r>>11)+32);i=(r&2047)<<4;break;case 11:t+=o(i+(r>>12)+32);i=(r&4095)<<3;break;case 12:t+=o(i+(r>>13)+32);i=(r&8191)<<2;break;case 13:t+=o(i+(r>>14)+32);i=(r&16383)<<1;break;case 14:t+=o(i+(r>>15)+32,(r&32767)+32);s=0;break}}return t+o(i+32)},decompressFromUTF16:function(e){if(e==null)return\"\";var t=\"\",n,r,i=0,s=0,o=LZString._f;while(s<e.length){r=e.charCodeAt(s)-32;switch(i++){case 0:n=r<<1;break;case 1:t+=o(n|r>>14);n=(r&16383)<<2;break;case 2:t+=o(n|r>>13);n=(r&8191)<<3;break;case 3:t+=o(n|r>>12);n=(r&4095)<<4;break;case 4:t+=o(n|r>>11);n=(r&2047)<<5;break;case 5:t+=o(n|r>>10);n=(r&1023)<<6;break;case 6:t+=o(n|r>>9);n=(r&511)<<7;break;case 7:t+=o(n|r>>8);n=(r&255)<<8;break;case 8:t+=o(n|r>>7);n=(r&127)<<9;break;case 9:t+=o(n|r>>6);n=(r&63)<<10;break;case 10:t+=o(n|r>>5);n=(r&31)<<11;break;case 11:t+=o(n|r>>4);n=(r&15)<<12;break;case 12:t+=o(n|r>>3);n=(r&7)<<13;break;case 13:t+=o(n|r>>2);n=(r&3)<<14;break;case 14:t+=o(n|r>>1);n=(r&1)<<15;break;case 15:t+=o(n|r);i=0;break}s++}return LZString.decompress(t)},compress:function(e){if(e==null)return\"\";var t,n,r={},i={},s=\"\",o=\"\",u=\"\",a=2,f=3,l=2,c=\"\",h=0,p=0,d,v=LZString._f;for(d=0;d<e.length;d+=1){s=e.charAt(d);if(!Object.prototype.hasOwnProperty.call(r,s)){r[s]=f++;i[s]=true}o=u+s;if(Object.prototype.hasOwnProperty.call(r,o)){u=o}else{if(Object.prototype.hasOwnProperty.call(i,u)){if(u.charCodeAt(0)<256){for(t=0;t<l;t++){h=h<<1;if(p==15){p=0;c+=v(h);h=0}else{p++}}n=u.charCodeAt(0);for(t=0;t<8;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}else{n=1;for(t=0;t<l;t++){h=h<<1|n;if(p==15){p=0;c+=v(h);h=0}else{p++}n=0}n=u.charCodeAt(0);for(t=0;t<16;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}a--;if(a==0){a=Math.pow(2,l);l++}delete i[u]}else{n=r[u];for(t=0;t<l;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}a--;if(a==0){a=Math.pow(2,l);l++}r[o]=f++;u=String(s)}}if(u!==\"\"){if(Object.prototype.hasOwnProperty.call(i,u)){if(u.charCodeAt(0)<256){for(t=0;t<l;t++){h=h<<1;if(p==15){p=0;c+=v(h);h=0}else{p++}}n=u.charCodeAt(0);for(t=0;t<8;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}else{n=1;for(t=0;t<l;t++){h=h<<1|n;if(p==15){p=0;c+=v(h);h=0}else{p++}n=0}n=u.charCodeAt(0);for(t=0;t<16;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}a--;if(a==0){a=Math.pow(2,l);l++}delete i[u]}else{n=r[u];for(t=0;t<l;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}}a--;if(a==0){a=Math.pow(2,l);l++}}n=2;for(t=0;t<l;t++){h=h<<1|n&1;if(p==15){p=0;c+=v(h);h=0}else{p++}n=n>>1}while(true){h=h<<1;if(p==15){c+=v(h);break}else p++}return c},decompress:function(e){if(e==null)return\"\";if(e==\"\")return null;var t=[],n,r=4,i=4,s=3,o=\"\",u=\"\",a,f,l,c,h,p,d,v=LZString._f,m={string:e,val:e.charCodeAt(0),position:32768,index:1};for(a=0;a<3;a+=1){t[a]=a}l=0;h=Math.pow(2,2);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}switch(n=l){case 0:l=0;h=Math.pow(2,8);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}d=v(l);break;case 1:l=0;h=Math.pow(2,16);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}d=v(l);break;case 2:return\"\"}t[3]=d;f=u=d;while(true){if(m.index>m.string.length){return\"\"}l=0;h=Math.pow(2,s);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}switch(d=l){case 0:l=0;h=Math.pow(2,8);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}t[i++]=v(l);d=i-1;r--;break;case 1:l=0;h=Math.pow(2,16);p=1;while(p!=h){c=m.val&m.position;m.position>>=1;if(m.position==0){m.position=32768;m.val=m.string.charCodeAt(m.index++)}l|=(c>0?1:0)*p;p<<=1}t[i++]=v(l);d=i-1;r--;break;case 2:return u}if(r==0){r=Math.pow(2,s);s++}if(t[d]){o=t[d]}else{if(d===i){o=f+f.charAt(0)}else{return null}}u+=o;t[i++]=f+o.charAt(0);r--;f=o;if(r==0){r=Math.pow(2,s);s++}}}};if(typeof module!==\"undefined\"&&module!=null){module.exports=LZString}\nonmessage = function (e) {\n\tvar str = LZString.compressToUTF16(e.data);\n\tpostMessage(str);\n};";
	let blobWorker = new Blob([content], {type: 'application/javascript'});
	let blobWorker_url = URL.createObjectURL(blobWorker);
	let compressworker = new Worker(blobWorker_url);

	// 使用 CompressWorker 來進行壓縮 (否則會很重)
	let compressResolve;
	let compressWithWorker = function (str) {
		compressworker.postMessage(str);
		return new Promise((resolve, reject)=>{compressResolve = resolve;});
	};
	compressworker.onmessage = function (e) {
		compressResolve(e.data);
	};

	// 取得當前的 console 內容 -> 壓縮 -> 上傳
	let updateConsoleLog = function(){
		if (logs.length == 0)
			return;
		let account = window.deviceID;
		if (window.vue) {
			let loginObj = vue.$store.state.login;
			if (loginObj.brokerID)
				account += '.' + loginObj.brokerID;
			if (loginObj.traderID)
				account += '.' + loginObj.traderID;
			if (loginObj.accountID && loginObj.accountID != loginObj.traderID)
				account += '.' + loginObj.accountID;
		}
		if (!account) return;

		// 支持公開設定指定 dcore 主機
		let postHost = window.$path.LOGIN_HOST;
		try{postHost = window.$publicPdSetting.function.aplog.host;}catch(e){}
		// 取得當前的 console 內容
		var str = getCurrConsole();
		if (str.length > 0) {
			// 使用 CompressWorker 壓縮
			compressWithWorker(str).then(function(str){
				const formData = new URLSearchParams();
				formData.append('project', `x4.${window.projectID}`);
				formData.append('account', account);
				formData.append('content', str);
				formData.append('version', window._version.v);
				fetch(`https://${postHost}/APLog/log`, {
					method: "POST",
					headers: {'Accept': 'application/json, text/plain, */*'},
					body: formData,
				});
				// console.debug(`cloud-console-log upload [${window.projectID}|${account}] ${(str.length/1024).toFixed(2)}KB`);
			});
		}
	};
	// 蒐集全域 exception
	window.onerror = function(a, b, c, d, error, e, f) {
		console.error('window.onerror : ' + error.stack);
	};
	// 定時送出 consoleQueue
	setInterval(updateConsoleLog, 15000);
})();
