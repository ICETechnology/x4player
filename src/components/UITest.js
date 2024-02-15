export default {
	props: [],
	// 使用這個行情代理元件需組件本身擁用sid 及suspend 變數才能正常使用
	data: function () {
		return {
			testIndex: -1,
			testList: [],
			sendCmdList: [],
			// 檢測執行中
			running: false,
			outputList: [],
			// 有建立出 interval 的都要加進來，重載或重啟都應該清光確保沒有殘留
			intervalList: [],
		}
	},
	beforeMount() {
		window.$data = this.$store.state.data;
	},
	beforeDestroy() {
		this.intervalList.forEach(itv=>clearInterval(itv));
	},
	mounted() {
		window.uitest = this;
		this.output('UITest 啟動');
		window.appendScript("https://code.jquery.com/jquery-3.6.0.min.js").then(()=>{
			this.output('動態載入外部函式庫完成');
			// jquery.initialize (https://github.com/pie6k/jquery.initialize)
			(function($){"use strict";var combinators=[" ",">","+","~"];var fraternisers=["+","~"];var complexTypes=["ATTR","PSEUDO","ID","CLASS"];function grok(msobserver){if(!$.find.tokenize){msobserver.isCombinatorial=true;msobserver.isFraternal=true;msobserver.isComplex=true;return}msobserver.isCombinatorial=false;msobserver.isFraternal=false;msobserver.isComplex=false;var token=$.find.tokenize(msobserver.selector);for(var i=0;i<token.length;i++){for(var j=0;j<token[i].length;j++){if(combinators.indexOf(token[i][j].type)!=-1)msobserver.isCombinatorial=true;if(fraternisers.indexOf(token[i][j].type)!=-1)msobserver.isFraternal=true;if(complexTypes.indexOf(token[i][j].type)!=-1)msobserver.isComplex=true}}}var MutationSelectorObserver=function(selector,callback,options){this.selector=selector.trim();this.callback=callback;this.options=options;grok(this)};var msobservers=[];msobservers.initialize=function(selector,callback,options){var seen=[];var callbackOnce=function(){if(seen.indexOf(this)==-1){seen.push(this);$(this).each(callback)}};$(options.target).find(selector).each(callbackOnce);var msobserver=new MutationSelectorObserver(selector,callbackOnce,options);this.push(msobserver);var observer=new MutationObserver(function(mutations){var matches=[];for(var m=0;m<mutations.length;m++){if(mutations[m].type=="attributes"){if(mutations[m].target.matches(msobserver.selector))matches.push(mutations[m].target);if(msobserver.isFraternal)matches.push.apply(matches,mutations[m].target.parentElement.querySelectorAll(msobserver.selector));else matches.push.apply(matches,mutations[m].target.querySelectorAll(msobserver.selector))}if(mutations[m].type=="childList"){for(var n=0;n<mutations[m].addedNodes.length;n++){if(!(mutations[m].addedNodes[n]instanceof Element))continue;if(mutations[m].addedNodes[n].matches(msobserver.selector))matches.push(mutations[m].addedNodes[n]);if(msobserver.isFraternal)matches.push.apply(matches,mutations[m].addedNodes[n].parentElement.querySelectorAll(msobserver.selector));else matches.push.apply(matches,mutations[m].addedNodes[n].querySelectorAll(msobserver.selector))}}}for(var i=0;i<matches.length;i++)$(matches[i]).each(msobserver.callback)});var defaultObeserverOpts={childList:true,subtree:true,attributes:msobserver.isComplex};observer.observe(options.target,options.observer||defaultObeserverOpts);return observer};$.fn.initialize=function(callback,options){return msobservers.initialize(this.selector,callback,$.extend({},$.initialize.defaults,options))};$.initialize=function(selector,callback,options){return msobservers.initialize(selector,callback,$.extend({},$.initialize.defaults,options))};$.initialize.defaults={target:document.documentElement,observer:null}})(jQuery);
			// 支持 random
			$.fn.random = function() {return this.eq(Math.floor(Math.random() * this.length));}			
			// 支持 textEquals
			$.expr.pseudos.textEquals = $.expr.createPseudo(function(arg) {return function( elem ) {return $(elem).text().match("^" + arg + "$");};});
			// 載入腳本
			this.downloadJson();
		});
	},
	methods: {
		// 重新下載腳本
		downloadJson() {
			// 指定為 local 時，使用本地的 dvmTestList (方便 hot-reload 開發)
			if (window.urlParam.uitest === 'local') {
				eventBus.$emit("FLASHMESSAGE", `本地端脚本完成`, {"bgClr": "black"});
				this.testList = JSON.parse(JSON.stringify(this.dvmTestList));
				return;
			}
			let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
			let url = `https://${this.host}/ss2/fsInfo/appbo?f=x4/${this.fileName}&qry=${qry}&r=${new Date().getTime()}`;
			this.output(`腳本版本 from ${url}`);
			fetch(url).then(response => response.json()).then(data => {
				let v = '-';
				try{v = data.d[0].version;}catch(err){};
				let url = this.jsonUrl = `https://${this.host}/ss2/fs/appbo/${v}/x4/${this.fileName}?qry=${qry}`;
				this.output(`腳本內容 from ${url}`);
				fetch(url).then(response=>response.json()).then(json => {
					eventBus.$emit("FLASHMESSAGE", `脚本下载完成`, {"bgClr": "black"});
					this.testList = json;
				});
			});
		},
		// 將當前項目測試結果設定為 true
		setResult(val = true) {
			if (this.testList[this.testIndex]) {
				this.$set(this.testList[this.testIndex], 'result', val);
				this.$set(this.testList[this.testIndex], 'loading', false);
			}
		},
		// 將當前項目測試 loading 設定為 true
		setLoading(val = true) {
			if (this.testList[this.testIndex]) {
				this.$set(this.testList[this.testIndex], 'loading', val);
			}
		},
		// 開始
		start(idx) {
			delete this.testStop;
			// 停止所有 Interval 檢測
			this.intervalList.forEach(itv=>clearInterval(itv));
			this.output('開始下載腳本...');
			this.running = true;
			// 若在 -1 則移動至 0
			this.testIndex = this.testIndex === -1 ? 0 : this.testIndex;
			this.testItem();
		},
		// 下一步
		next() {
			clearTimeout(this.failTimeout);
			this.setResult(true);
			if (this.testStop) return;
			this.testIndex++;
			this.testItem();
		},
		// 跳過 N 步
		skip(cnt) {
			clearTimeout(this.failTimeout);
			this.setResult(true);
			if (this.testStop) return;
			this.testIndex += cnt;
			this.testItem();
		},
		// 停止
		stop() {
			this.running = false;
			clearTimeout(this.delayTimeout);
			this.setLoading(false);
		},
		// 測單項後停止
		testOne(idx) {
			this.testStop = true;
			this.testIndex = idx;
			this.testItem(idx);
		},
		// 測指定編號項目
		testItem(idx = this.testIndex) {
			let testObj = this.testList[idx];
			if (!testObj) return;
			this.setResult(null);
			this.setLoading();
			clearTimeout(this.failTimeout);
			// 延遲後開始
			this.delayTimeout = setTimeout((self)=>{
				// Timeout失敗
				self.failTimeout = setTimeout(()=>{
					self.running = false;
					self.setResult(false);
				}, 5000);
				// 預處理 testObj 內容
				this.prepareTestObj(testObj);
				// 執行測試函式
				this[`action$${testObj.action}`](testObj);
			}, testObj.action === 'title' ? 0 : (testObj.sleep || this.sleepMs), this);
		},
		// 預處理 testObj 內容
		prepareTestObj(testObj) {
			if (testObj.value)
				testObj.value = eval('`' + testObj.value + '`');
			if (testObj.selector)	
				testObj.selector = eval('`' + testObj.selector + '`');
		},
		// 紀錄送出的命令 (供測試反查使用)
		recordCmd(obj) {
			this.sendCmdList.unshift(obj);
		},
		// 印訊息
		output(str, result) {
			let strIdx = this.testIndex >= 0 ? `[${this.testIndex}]` : ''
			let strLine = `${new Date().time8()} ${strIdx} ${str} ${result ? '(成功)' : '(false)'}`;
			this.outputList.push(strLine);
			console.log(`UITest ${strLine}`);
		},
		// 指定 selector 誕生時會呼叫
		onInitial(selector, callback) {
			this.obs = $.initialize(selector, callback);
		},
		// 指定元素從不可見變為可見
		onDisplay(target, callback) {
			if (typeof(target)==='string')
				target = $(target)[0];
			var observer = new MutationObserver(function(mutations) {
				if (target.style.display != 'none')
					callback();
			});
			observer.observe(target, {
				attributes: true,
				attributeFilter: ["style"],
			});			
		},
		// 等待直到元素出現
		action$until(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output(`正在等待 [${testObj.text}] ...`);
			this.obs = $.initialize(testObj.selector, ()=>{
				// 解除監聽 (必須 delay 不可直接在 callback 內解除)
				if (this.obs) {
					setTimeout((self)=>{
						self.obs.disconnect();
						delete self.obs;
					}, 100, this);
				}
				this.lightUp(testObj.selector);
				this.output(`${testObj.text} (${testObj.selector})`, true);
				this.next();
			});
			clearTimeout(this.failTimeout);
		},
		// 檢查元素是否存在 (支持 skip=N 找不到時要跳過N步)
		action$check(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			let text = testObj.text;
			this.output(`正在進行 [${text}]`);
			let item = $(testObj.selector);
			this.output(`正在檢查是否有 [${text}]`, item.length);
			// 找的到元素
			if (item.length > 0) {
				this.lightUp(item);
				// 有指定檢查數值時 (元素的 text 比對 value)
				if (testObj.value) {
					let result = eval(`${item.text()}${testObj.value}`);
					this.output(`檢查元素的值[${item.text()}] 是否符合 [${testObj.value}]`, result);
					if (!result)
						return;
				}
				let ifSkip = testObj['if-skip'];
				// 有指定找到元素時要跳過幾步
				if (ifSkip) {
					this.output(`找到 [${text}] 時要跳過 ${ifSkip} 步`);
					// this.testIndex += (ifSkip+1);
					this.skip(ifSkip+1);
				}
				else {
					this.next();
				}
			}
			// 找不到元素
			else {
				let ifnotSkip = testObj.skip || testObj['ifnot-skip'];
				// 有指定找不到元素時要跳過幾步
				if (ifnotSkip) {
					this.output(`找不到 [${text}] 時要跳過 ${ifnotSkip} 步`);
					// this.testIndex += (ifnotSkip+1);
					this.skip(ifnotSkip+1);
				}
				else {
					if (testObj.continue) this.next();
				}
			}
		},
		// 檢查並點擊
		action$click(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			let text = testObj.text;
			this.output(`正在進行 [${text}]`);
			let item = testObj.random ? $(testObj.selector).random()[0] : $(testObj.selector)[0];			
			this.output(`正在檢查是否有 [${text}]`, !!item);
			// 找的到元素
			if (item) {
				this.lightUp(item);
				this.output(`已找到並正在點擊 [${text}]`);
				$(item).trigger('click');
				this.next();
			}
			// 找不到元素
			else {
				// 有指定可以繼續
				if (testObj.continue) {
					this.output(`找不到 [${text}] (自動繼續)`);
					this.next();
				}
				else {
					this.output(`找不到 [${text}] !`);
				}
			}
		},
		// 檢查並輸入
		action$input(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			let text = testObj.text;
			let item = $(testObj.selector)[0];			
			this.output(`正在檢查是否有 [${text}]`, !!item, testObj);
			// 找的到元素
			if (item) {
				this.lightUp(item);
				this.output(`已找到並正在輸入 [${testObj.value}]`);
				$(item).val(testObj.value);
				// 需觸發 input event 使 v-model 生效
				item.dispatchEvent(new Event('input'));
				this.next();
			}
			// 找不到元素
			else {
				// 有指定可以繼續
				if (testObj.continue) {
					this.output(`找不到 [${text}] (自動繼續)`);
					this.next();
				}
				else {
					this.output(`找不到 [${text}] !`);
				}
			}
		},
		// 關閉彈窗
		action$close(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output('正在關閉彈窗');
			eventBus.$emit("CLOSE-DIALOG");
			this.next();
		},
		// 顯示標題提示
		action$title(testObj) {
			this.output(`${testObj.text}`);
			this.next();
		},
		// 離開
		action$leave(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			let text = testObj.text;
			let item = $(testObj.selector)[0];
			this.output(`正在觀察目標 [${text}]`, !!item);
			if (item) {
				let itv = setInterval(()=>{
					if (!$(testObj.selector)[0]) {
						this.output(`目標 [${testObj.selector}] 已離開`);
						this.next();
						clearInterval(itv);
					}
				}, 1000);
				this.intervalList.push(itv);
			}
			else {
				this.output(`檢查不到目標 [${testObj.selector}]`);
				if (testObj.continue) this.next();
			}
			clearTimeout(this.failTimeout);
		},

		// 檢查回報是否存在
		action$reportExist(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output(`正在檢查 [${testObj.text}]`);
			if (!this.$order) return;
			let rpt = $(`.swiper-slide-active .report-card-ctn[sid="${this.sid}"]`)[0];
			this.lightUp(rpt);
			this.output(`正在檢查前次委託合約 [${this.contractName} / ${this.sid}] 回報是否存在`, !!rpt);
			if (rpt || testObj.continue)
				this.next();
		},
		// 檢查回報檢索值是否等同委託指定欄位值
		action$reportValue(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output(`正在檢查 [${testObj.text}]`);
			if (!this.$order) return;
			let rpt = $(`.swiper-slide-active .report-card-ctn[sid="${this.sid}"]`)[0];
			let selectorItem = $(rpt).find(testObj.selector);
			this.lightUp(selectorItem);
			let rptSelectorValue = selectorItem.text();
			let orderKeyValue = this.$order[testObj.orderKey];
			let result = orderKeyValue == rptSelectorValue;
			this.output(`正在檢查委託欄位 [${testObj.orderKey}](值:${orderKeyValue}) 是否符合檢索值 [${testObj.selector}](值:${rptSelectorValue})`, result);
			if (result || testObj.continue)
				this.next();
		},
		// 檢查回報裡是否存在檢索結果
		action$reportCheck(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output(`正在檢查 [${testObj.text}]`);
			if (!this.$order) return;
			let rpt = $(`.swiper-slide-active .report-card-ctn[sid="${this.sid}"]`)[0];
			let item = $(rpt).find(testObj.selector)[0];
			this.lightUp(item);
			this.output(`正在檢查回報裡是否存在檢索結果 [${testObj.selector}]`, !!item);
			if (item || testObj.continue)
				this.next();
		},
		// 檢查持倉是否存在
		action$positionExist(testObj) {
			// 支持 if 與 ifnot 判斷 (若 return false 就表示中斷)
			if (!this.processIfIfnot(testObj))
				return;
			this.output(`正在檢查 [${testObj.text}]`);
			if (!this.$order) return;
			let pos = $(`.swiper-slide-active .position-card-ctn[sid="${this.sid}"]`)[0];
			this.lightUp(pos);
			this.output(`正在檢查前次委託合約 [${this.contractName} / ${this.sid}] 是否存在於持倉`, pos);
			if (pos || testObj.continue)
				this.next();
		},
		// 點亮元素
		lightUp(item) {
			setTimeout(()=>{
				$(item).addClass('uitest-focus');
			}, 50);
			setTimeout(()=>{
				$(item).removeClass('uitest-focus');
			}, 500);
		},
		// 支持 if 與 ifnot 的檢查，若有設定且檢查不通過時回覆 false 以中斷執行 (但若有 continue 時，直接跳下一行)
		processIfIfnot(testObj) {
			// 支持 if 有東西才進行
			if (testObj.if) {
				let ifItem = $(testObj.if)[0];
				this.lightUp(ifItem);
				this.output(`正在檢查是否有 [${testObj.if}]`, !!ifItem);
				if (!ifItem) {
					if (testObj.continue) this.next();
					return false;
				}
			}
			// 支持 ifnot 有東西才進行
			if (testObj.ifnot) {
				let ifnotItem = $(testObj.ifnot)[0];
				this.lightUp(ifnotItem);
				this.output(`正在檢查是否不存在 [${testObj.ifnot}]`, !ifnotItem);
				if (ifnotItem) {
					if (testObj.continue) this.next();
					return false;
				}
			}
			return true;
		},
	},
	watch: {
		testIndex(nv) {
			if (nv < 0) return;
			if (nv >= this.testList.length) {
				this.output('已經沒有更多的測試項目，測試結束');
				return;
			}
		},
		host(nv) {
			this.output(`脚本 ${this.host} ${window.comp} ${window.prod} ${this.fileName}`);
		}
	},
	computed: {
		sid() {
			return this.$order.SYMBOL;
		},
		host() {
			return this.$store.state.status.quoteHost;
		},
		sleepMs() {
			return this.$store.state.uitest.sleepMs;
		},
		contractName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		fileName() {
			return this.$store.state.uitest.fileName;
		},
		orderCmdD() {
			let obj = this.sendCmdList.find(obj => obj.cmd.s === 'TRADE' && obj.cmd.c === 'order');
			if (obj)
				return obj.cmd.d;
			else
				this.output('查無前次委託命令');
		},
		$order() {
			let obj = Object.assign({}, this.orderCmdD);
			let sid = obj.SYMBOL;
			obj.$STRIKE = M4C.Option.getStrike(sid);
			obj.$MONTH = sid.split('.')[4];
			obj.$MTH4 = obj.$MONTH.substr(2);
			this.output(`前次委託參數 : ${JSON.stringify(obj)}`);
			return obj;
		},
	},
}