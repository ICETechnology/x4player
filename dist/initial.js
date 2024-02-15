(()=>{
	console.log("[啟動器] initial.js");
	// 區域函式收納
	let localFn = {
		// 擴增 window 下的函式
		windowFn: ()=>{
			// 載入指定 JS file (支持指定 timeout 秒數，timeout=0 表示不逾期) --- chin : loader.js 下次修改時應搬回覆蓋 loader.js
			window.appendScript = function(src, timeout) {
				return new Promise((resolve, reject) => {
					if (timeout !== 0)
						setTimeout(() => { reject(-99107); }, timeout || 9998);
					let tag = document.createElement('script');
					tag.type = "text/javascript";
					tag.src = src;
					tag.onload = resolve;
					tag.onerror = reject;
					document.getElementsByTagName("head")[0].appendChild(tag);
				});
			};
			// 載入指定 CSS file (支持指定 timeout 秒數，timeout=0 表示不逾期) --- chin : loader.js 下次修改時應搬回覆蓋 loader.js
			window.appendCSS = function(src, timeout) {
				return new Promise((resolve, reject) => {
					if (timeout !== 0)
						setTimeout(() => { reject(-99107); }, timeout || 9998);
					let tag = document.createElement('link');
					tag.type = "text/css";
					tag.rel = "stylesheet";
					tag.href = src;
					tag.onload = resolve;
					tag.onerror = reject;
					document.getElementsByTagName("head")[0].appendChild(tag);
				});
			};
			// 同時支持 browser / app / desktop 的開啟 URL 情境
			window.openLink = (url)=>{
				try {
					if (window.cordova && window.cordova.InAppBrowser)
						window.cordova.InAppBrowser.open(url, '_system', undefined, (args)=>{console.log(args);});
					else
						window.open(url, '_system');
				}
				catch(err) {
					console.log('[啟動器] window.openLink error : ', url, err);
				}
			};
			// 鎖定螢幕方向
			window.lockScreen = (direction)=>{
				if (screen && screen.orientation && screen.orientation.lock) {
					let promise = screen.orientation.lock(direction);
					if (typeof promise === 'object' && typeof promise['catch'] === 'function') {
						promise['catch'](function(evt){
							// console.log("screen.orientation.lock ", evt.code, evt.name, evt.message);
						});
					}
				}
			};

		},
		// 多個 window 變數設定
		windowVariable: ()=>{
			window.dvm = location.hostname.indexOf('172.28') != -1 || location.hostname.indexOf('192.168') != -1 || location.search.indexOf("dvm=1") != -1;
			// 取得 URL 參數
			let urlParam = window.urlParam = {};
			location.search.substr(1).split('&').forEach((s)=>{let tmp = s.split('=');if (tmp.length===2) urlParam[tmp[0]] = tmp[1];});
			// 是否為桌機版
			window.isDesktop = window.isElectron || !!urlParam.desktop || location.pathname.indexOf('desktop') !== -1;
			// 手機模式 + dev 時，將 報價連線 / 語系檔 改往 uat for WFH
			// if (window.cordova && window.$path.LOGIN_HOST === 'ss2-dev.icetech.com.tw')
			// 	window.$path.LOGIN_HOST = 'ss2-uat.icetech.com.tw';
	
			// 寬度大於 450 時 (Pad情境) 限制寬度至 375
			if (screen.width > 450) {
				window.isPad = true;
				window.restrictWidth = 375;
				try{document.querySelector('meta[name="viewport"]').content = `user-scalable=no, width=${window.restrictWidth}, viewport-fit=cover`;}catch(e){}
			}
			// 不套用 OS 調整的字體 (避免調整為大字體時在多個畫面產生疊字問題)
			if (window.MobileAccessibility) {
				window.MobileAccessibility.usePreferredTextZoom(false);
			}
		},
		// 取得 company / product
		getCompProd: ()=>{
			/** 專案代號 
			 * - 第1優先. 支持 app 檔首指定
			 * - 第2優先. 支持 url 指定
			 * - 第3優先. 支持解析 path 取得
			 * - 相容未設定或是路徑為 x4 時，視為 x4cn 專案
			*/
			let projectID = window.projectID || window.urlParam.p;
			// 支持從 path 取得 ex. http://ss2-dev.icetech.com.tw/x4/
			projectID = (location.hostname.indexOf('172.28') === -1 || location.hostname.indexOf('192.168') === -1) && !projectID && location.pathname.length > 1 ? window.location.pathname.split('/')[1] : projectID;
			// 桌機版無指定 projectID 時，視為 desktop
			projectID = !projectID && window.isDesktop ? 'desktop' : projectID;
			// 向前相容 /x4/ 視為 x4cn 公版
			projectID = !projectID || projectID === 'x4' ? 'x4cn' : projectID;
			// 填入 window.projectID 供全域使用
			window.projectID = projectID;
			// 仍找不到 projectID 時要警示
			if (!window.projectID) {
				console.error(`沒有取得 window.projectID !!!`);
				return;
			}
			// 分析報價與交易連線使用的 Company/Product
			switch (projectID) {
				case 'x4cn':	// CN公版
					window.comp = 'ss2';
					window.prod = 'ff';
					break;
				case 'x4tw':	// TW公版
					window.comp = 'ss2';
					window.prod = 'fftw';
					break;
				case 'desktop':		// CN桌機公版
					window.comp = 'ss2';
					window.prod = 'ff_d';
					break;
				default:
					// 新定義改用 '.' 連結 comp/prod
					let tmp = projectID.split('.');
					window.comp = tmp[0];
					window.prod = tmp[1];
					break;
			}
		},
		// 載入主程式，附帶載入進度
		loadingBuild: (src)=>{
			let xhr = new XMLHttpRequest();
			xhr.addEventListener("progress", function(event) {
				// nginx + gzip 無法提供 content-length，因此無法使用 event.lengthComputable 與 event.total，僅有 event.loaded
				// console.log(`[啟動器] loader.loadingBuild.progress : `, `${event.loaded} / ${event.total}`);
				let totalSize = event.total || window._version.size;
				if (totalSize) {
					let percent = event.loaded / totalSize * 100;
					percent = percent > 100 ? 100 : percent;
					let $ln = window.launch.$ln;
					let str = percent === 100 ? `${$ln('Loading')}` : `${$ln('Downloading')} (${parseInt(percent)}%)`;
					if (window.showInitialMessage)
						window.showInitialMessage(str, true);
					if (window.notifyUpdatePercent)
						window.notifyUpdatePercent(percent);
				}
			}, false);
			xhr.addEventListener("load", function(event) {
				// 清除主程式載入失敗的Timeout
				clearTimeout(window.loadingFailTimeout);
				console.log(`[啟動器] 主程式大小 : `, event.loaded);
				let e = event.target;
				window.onLoadBuildJsTime = new Date();
				let s = document.createElement("script");
				s.id = 'main-script';
				s.textContent = xhr.responseText;
				setTimeout(()=>{document.documentElement.appendChild(s);}, 0);
			}, false);
			xhr.open("GET", src);
			xhr.send();
		},
		// 取得語系檔
		loadLanguage: ()=>{
			let company = window.comp;
			try{company = window.$publicPdSetting.CONFIG.QuoteCompanyWithout_q ? window.comp : `${window.comp}_q`;}catch(e){}
			return new Promise((resolve, reject)=>{
				// 取得語系檔版本號
				fetch(`https://${window.$path.LOGIN_HOST}/ss2/fsInfo/appbo?f=${company}/${window.prod}/language.json&r=${new Date().getTime()}`).then(response => response.json()).then(data => {
					let v = '-';
					try{
						v = data.d[0].version;
						window.showInitialMessage(`正在下載語系檔...`);
					}catch(err){};
					fetch(`https://${window.$path.LOGIN_HOST}/ss2/fs/appbo/${v}/${company}/${window.prod}/language.json`).then(response => response.json()).then(data => {
						window.showInitialMessage(`語系檔完成`);
						// 語系檔完成
						window._language = data;
						resolve();
					}).catch((err)=>{
						reject(err);
					});
				}).catch((err)=>{
					reject(err);
				});
				// 10 秒無法取得語系檔的訊息
				setTimeout(()=>{
					if (!window._language) {
						window.showInitialMessage('下載語系檔逾時');
						reject();
					}
				}, 9998);
			});
		},
		// 啟動階段的語系處理
		launchLanguage: ()=>{
			// 載入語系功能(遠端)
			window.launch = window.launch || {};
			// 啟動階段的語系對應表
			window.launch.langMap = {
				"Downloading": {"zh": "正在下载更新", "zh-TW": "正在下載更新", "en": "Downloading"},
				"Loading": {"zh": "正在载入更新", "zh-TW": "正在載入更新", "en": "Loading"},
				"Network Error": {"zh": "无法连线主机，请检查网路", "zh-TW": "無法連線主機，請檢查網路", "en": "Network Error"},
				"Reload": {"zh": "重新启动", "zh-TW": "重新啟動", "en": "Restart"},
				"Updating": {"zh": "正在自动更新至版本", "zh-TW": "正在自動更新至版本", "en": "Updating Version"},
				"Version Fail": {"zh": "网路异常，无法取得版本号", "zh-TW": "網路異常，無法取得版本號", "en": "Network Error (Get Version Fail)"},
				"Download Language": {"zh": "正在下载语系档", "zh-TW": "正在下載語系檔", "en": "Downloading Language File"},
			};
			// 啟動階段的轉語系函式
			window.launch.$ln = (txt)=>{
				let map = window.launch.langMap;
				if (map && map[txt])
					return map[txt][window.launch.language] || txt;
				return txt;
			};
			// 使用語系(預設瀏覽器語系), // zh-cn/zh-CN 視為 [zh], zh-tw/zh-TW 視為 [zh-TW], 非 en/zh-TW -> 預設為 zh (簡中)
			let lang = navigator.language || (navigator.languages ? navigator.languages[0] : "") || window.navigator.browserLanguage || window.navigator.userLanguage || "";
			lang = lang.toLowerCase() === "zh-cn" ? "zh" : lang;
			lang = lang.toLowerCase() === "zh-tw" ? "zh-TW" : lang;
			lang = lang != "en" && lang != "zh-TW" ? "zh" : lang;
			window.launch.language = localStorage.getItem(`${window.projectID}_$STORE_lang>language`) || lang;
		},
		// 取得公開設定
		getPublicPdsetting: ()=>{
			return new Promise((resolve, reject)=>{
				let url = `https://${window.$path.LOGIN_HOST}/ss2/api?cmdLine={"s":"appbo","c":"setting.pd.get.pub","d":{"comp":"${window.comp}","pd":"${window.prod}"},"r":"${new Date().getTime()}"}`;
				console.log('[啟動器] 查詢公開設定網址 : ', url);
				fetch(url).then(res => res.json()).then(data => {
					console.log('[啟動器] 取得公開設定內容 : ', data.d);
					window.$publicPdSetting = data.d;
					try{vue.$store.state.config.publicPdSetting = window.$publicPdSetting;}catch(e){}
					resolve();
				}).catch(err=>{
					reject();
				});
				// 10 秒無法取得公開設定時的訊息
				setTimeout(()=>{
					if (!window.$publicPdSetting) {
						window.showInitialMessage('取得公開設定逾時');
						reject();
					}
				}, 9998);
			});
		},

		// deviceReady 處理
		onDeviceReady: ()=>{
			// 收到 cordova deviceready 事件
			document.addEventListener("deviceready", ()=>{
				console.log('[啟動器] Running cordova-' + cordova.platformId + '@' + cordova.version);
				console.log("[啟動器] cordova deviceready !");
				// 收到 deviceready 才可確定是 App
				window.isAPP = true;
				// 裝置鎖定為直向
				window.lockScreen('portrait');
			}, false);			
		},
	};

	// 清除 : 等待10秒無法進載入畫面提示機制
	clearTimeout(window.waitInitialTimeout);

	// 擴增 window 下的函式
	localFn.windowFn();
	// 多個 window 變數設定
	localFn.windowVariable();
	// 取得 company / product
	localFn.getCompProd();
	// 啟動階段的語系處理
	localFn.launchLanguage();
	// deviceReady 處理
	localFn.onDeviceReady();

	// 建立畫面
	appendCSS(`${window.cloudPath}/initialScreen.css?_=${window.$v}`);
	appendScript(`${window.cloudPath}/initialScreen.js?_=${window.$v}`);
	// dcore log
	appendScript(`${window.cloudPath}/dcore.log.js?_=${window.$v}`);

	// 取得貼牌公開設定
	let getLanguage = localFn.getPublicPdsetting().then(()=>{
		// 取得語系檔
		return localFn.loadLanguage()
	});
	// 取得material icons的CSS
	let getIconCSS = appendCSS(`${window.cloudPath}/css/icon.css?_${new Date().getTime()}`);
	getIconCSS.catch(err=>{		
		// 10 秒無法取得圖形檔時的訊息
		setTimeout(()=>{
			window.showInitialMessage('圖形檔讀取失敗');
		}, 3000);
	});

	Promise.all([getLanguage, getIconCSS]).then(() => {
		// 等待語系檔跟CSS完成後，再載入主程式(遠端) build.js
		window.showInitialMessage('正在下載主程式...');
		let buildSrc = `${window.cloudPath}/build.js?_=${window.$v}`;
		localFn.loadingBuild(buildSrc);
	});

	// 載入 Tradingview charting library js
	let url = `${window.cloudPath}/charting_library/charting_library.standalone.js?_${new Date().getTime()}`;
	console.log('[TVC] charting_library url : ', url);
	appendScript(url);	
})();