// 建立畫面
(()=>{
    String.prototype.random = function(len = 8) {
        let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (var i = len; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
        return result;
    }
    
    // 淺色背景
    let whiteBG = window.comp==='fubon' || window.comp==='taishin';
    let initialLoadingCtn = window.initialLoadingCtn = document.createElement("div");
    initialLoadingCtn.innerHTML = `
        <div class="initial-message">${window.launch.$ln('正在取得主程式')}</div>
        <div class="btn-reload hidden" onclick="window.location.reload()">${window.launch.$ln('Reload')}</div>
        <div class="loader-message"/>
    `;
    initialLoadingCtn.className = `initial-loading-build ${whiteBG?'white-bg':''}`; // 登入画面会移除此 class
    document.body.appendChild(initialLoadingCtn);
    
    // 建立與揭示 deviceID
    try {
        window.deviceID = localStorage.getItem(`${window.projectID}_$STORE_device>deviceID`);
        window.deviceID = window.deviceID || ''.random(32);
        let deviceIdCtn = document.createElement("div");
        deviceIdCtn.innerHTML = `${window.deviceID.substr(-4)}`;
        deviceIdCtn.className = `device-id-ctn`;
        initialLoadingCtn.appendChild(deviceIdCtn);
    }catch(e){}

    // 桌機版 electron 專用
    if (window.isElectron) {
        window.sendElectron = function(message) {if (ipcRenderer) ipcRenderer.send(message);};	
        let winToolBar = document.createElement("div");
        winToolBar.innerHTML = `
            <div class="flex-1"></div>
            <div class="electron-no-drag flex-center sys-btn" onclick="sendElectron('close-window')"><span class="icon-close"/></div>
        `;
        winToolBar.className = "electron-win-line electron-drag flex-row";
        initialLoadingCtn.appendChild(winToolBar);
    }

    // 有進度時，持續延長 10 秒逾時
    window.extendLoadingTimeout = ()=>{
        clearTimeout(window.loadingFailTimeout);
        // 10秒後仍沒有取得主程式會出現的訊息
        window.loadingFailTimeout = setTimeout(()=>{
            // window.showInitialMessage(`Network Error`);
            window.showBtnReload();
        }, 10000);
    };
    window.extendLoadingTimeout();

    // 啟動階段的文字訊息
    window.showInitialMessage = function(str, notLog) {
        if (!notLog)
            console.log('[啟動器]', str);
        try{document.getElementsByClassName("initial-message")[0].textContent = window.launch.$ln(str);}catch(e){}
        // 有進度時，持續延長 10 秒逾時
        window.extendLoadingTimeout();
    };
    // 點擊 reload 按鈕
    window.showBtnReload = function() {
        try{document.getElementsByClassName("btn-reload")[0].classList.remove("hidden");}catch(e){}
    };

    // 關閉 App 啟動畫面 (SplashScreen)
    setTimeout(()=>{try{navigator.splashscreen.hide();}catch(e){};}, 5000);

    // 主程式進度條
    let key = `${window.projectID}_VERSION`;
    let thisV = window._version.v;
    let lastV = localStorage.getItem(key);
    if (thisV != lastV) {
        let ctn = window.notifyUpdateCtn = document.createElement("div")
        ctn.className = `update-notify-ctn`;
        ctn.innerHTML = `
            <div class="content">
                <span class="bgc"></span>
                <span class="txt">${window.launch.$ln('Updating')} ${thisV}</span>
            </div>
        `;
        initialLoadingCtn.appendChild(ctn);
        window.notifyUpdateBgc = ctn.getElementsByClassName('bgc')[0];
        window.notifyUpdatePercent = (percent)=>{
            window.notifyUpdateBgc.style.width = `${percent}%`;
        }
        localStorage.setItem(key, thisV);
    }

	/** 載入遠端 loading.gif 機制 (向前相容) */
	let loadLoadingImage = ()=>{
		// 查詢 loading.gif 的版號
		let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
		let url = `https://${window.$path.LOGIN_HOST}/ss2/fsInfo/appbo?f=pic/splash/loading.gif&qry=${qry}&r=${new Date().getTime()}`;
		fetch(url).then(response => response.json()).then(data => {
			let v = '-';
			try{v = data.d[0].version;}catch(err){};
			let newImage = new Image();
			newImage.style.width = '100%';
			newImage.style.height = '100%';
			newImage.style.objectFit = 'cover';
			// 遠端 loading.gif 貼進來，支持拔掉原本殼上的 gif
			let replaceImage = () => {
				// 關閉 App 啟動畫面 (SplashScreen)
				try{navigator.splashscreen.hide();}catch(e){};
				// 向前相容於仍有自帶載入圖示的 app (2.58-)
				let orgImage = window.initialLoadingCtn.getElementsByClassName('loading-icon')[0];
				if (orgImage)
					orgImage.parentNode.removeChild(orgImage);
				window.initialLoadingCtn.prepend(newImage);
			};
			// 圖片載入完成
			newImage.onload = () => {
				// App 情境 initialLoadingCtn 已經存在
				if (window.initialLoadingCtn) {
					replaceImage();
				}
				// Browser 情境 initialLoadingCtn 要等 projectID，可能還沒存在
				else {
					let checkInterval = setInterval(()=>{
						if (window.initialLoadingCtn) {
							clearInterval(checkInterval);
							replaceImage();
						}
					}, 100);
				}
			};
			newImage.src = window._initialImageSrc = `https://${window.$path.LOGIN_HOST}/ss2/fs/appbo/${v}/pic/splash/loading.gif?qry=${qry}`;
		});
	};
	loadLoadingImage();    
})();
