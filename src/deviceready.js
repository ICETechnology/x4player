(()=>{
	// (for 向前相容) 取得 URL 參數 (app 裡的 loader.js 包含此功能後即可移除)
	let urlParam = window.urlParam = {};
	location.search.substr(1).split('&').forEach((s)=>{let tmp = s.split('=');if (tmp.length===2) urlParam[tmp[0]] = tmp[1];});
	// 專案代號 (支持 app 檔首寫入，支持 url&p= 指定)
	window.projectID = window.projectID || urlParam.p || 'x4cn';

	// 首次交互作用
	document.addEventListener("click", ()=>{
		if(window.firstInteractive) return;
		console.log("first interactive !");
		window.firstInteractive = true;
	}, false);
	// 取得 chrome 版本號
	try{window.chromeVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);}catch(e){}

	// 移除載入主程式畫面
	window.removeScreenLoadingBuild = ()=>{
		let removeIt = ()=>{
			try{document.getElementsByClassName('screen-loading-build')[0].remove();}catch(e){};
			try{document.getElementsByClassName('initial-loading-build')[0].remove();}catch(e){};
			// 移除主程式 script 元素
			try{document.getElementById('main-script').remove();}catch(e){};
		};
		removeIt();
		// 保險起見 1 秒後再關一次
		setTimeout(removeIt, 1000);
	};
	// 印出 userAgent
	console.log('[deviceready.js] navigator.userAgent :', window.navigator.userAgent);
})();
