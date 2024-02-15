<template>
    <div class="m4c-quote hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			mapSymbolToIcmInfo: {},
			mapSymbolToQuoteObject: {},
			// 當前訂閱表
			curSubMap: {},
			/** 統計專用 */
			subTime: {},
			usage: {
				sub: {
					count: 0,
					usage: 0,
					average: 0,
				},
			},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Quote = this.$store.state.m4c.quote = this;

		this.subSymbolList = this.subSymbol = this.sub;
		this.unSubSymbolList = this.unSubSymbol = this.unsub;

		// 註冊資料分派
		M4C.regDispatch({'s': 'Q', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'O', 'callback': this.onData.bind(this)});
		M4C.regDispatch({'s': 'OG', 'callback': this.onData.bind(this)});
	
		// AC 登入回應
		M4C.on("AC-LOGIN-READY", function(data, wsConn) {
			// 報價連線登入成功
			if (wsConn.info.type === 'quote'){
				// 支持斷線重連後，自動重新訂閱報價 (若訂閱表有內容就是斷線重連情境)
				let subList = Object.keys(this.curSubMap);
				if (subList.length > 0) {
					this.sendSubCmd(subList);
				}
				// 訂閱所有交易所清盤訊號
				M4C.send({
					"s": "Q",
					"c": "sub",
					"d": {"s": "Quote.Reset.*"},	// 訂閱所有交易所清盤訊號
					"r": "Sub.Quote.Reset"
				});					
			}				
		}.bind(this));
	},
    methods: {
		// 訂閱
		sub(sid, com_instance) {
			let self = this;
			// 商品代碼格式不如預期
			if (!Array.isArray(sid) && typeof sid !== 'string') {
				return;
			}
			// 元件實體不如預期
			if (typeof com_instance !== 'object') {
				return;
			}
			// 將要訂閱的內容整理至 self.queueSubMap
			self.appendSubMap(sid, com_instance);
		},
		// 解訂閱
		unsub(sid, com_instance) {
			let self = this;
			if (!sid)
				return;
			// 商品代碼格式不如預期
			if (!Array.isArray(sid) && typeof sid !== 'string') {
				return;
			}
			// 元件實體不如預期
			if (typeof com_instance !== 'object') {
				return;
			}
			// 將要解訂閱的內容整理至 self.queueSubMap
			self.removeSubMap(sid, com_instance);
		},
		// 全部解除訂閱
		unsubAll() {
			let self = this;
			for (let sid in self.queueSubMap) {
				self.queueSubMap[sid] = {};
			}
			self.createSubUnsubAction();
		},
		// 將要訂閱的內容整理至 self.queueSubMap
		appendSubMap(sid, com_instance) {
			let self = this;
			let sidList = self.sidToList(sid);
			let queueSubMap = self.getQueueSubMap();
			sidList.forEach(function(sid) {
				let subID = self.getComInstanceSubID(com_instance);
				if (!queueSubMap[sid])
					queueSubMap[sid] = {};
				queueSubMap[sid][subID] = com_instance;
			});
			self.createSubUnsubAction();
		},
		// 將要解訂閱的內容整理至 self.queueSubMap
		removeSubMap(sid, com_instance) {
			let self = this;
			let sidList = self.sidToList(sid);
			let queueSubMap = self.getQueueSubMap();
			sidList.forEach(function(sid) {
				let subID = self.getComInstanceSubID(com_instance);
				if (queueSubMap[sid])
					delete queueSubMap[sid][subID];
			});
			self.createSubUnsubAction();
		},
		// 將要訂閱的 sid 轉為陣列
		sidToList(sid) {
			let sidList = [];
			if (Array.isArray(sid)) {
				sidList = sid;
			} else if (typeof sid === 'string') {
				sidList = sid.split(',');
			}
			return sidList;
		},
		// 執行 [比對訂閱] 之前的 [新訂閱表]
		getQueueSubMap() {
			let self = this;
			if (!self.queueSubMap) {
				// self.queueSubMap = Object.assign({}, self.curSubMap);
				// 由於 Ojject.assign 只進行淺拷貝，我們這兩層的結構，需要自己 loop 一層來 copy (也有其它深拷貝的方案，但是除了 jquery 以外沒有比較簡單的)
				self.queueSubMap = {};
				for (let key in self.curSubMap) {
					self.queueSubMap[key] = Object.assign({}, self.curSubMap[key]);
				}
			}
			return self.queueSubMap;
		},
		// 提供元件一個 unique 訂閱ID 用以建立 [訂閱表]
		getComInstanceSubID(com_instance) {
			if (!com_instance.ss2_subscribe_id)
				com_instance.ss2_subscribe_id = "".random();
			return com_instance.ss2_subscribe_id;
		},
		// 利用 setTimeout 來合併解決 -> 連續性 訂閱/解訂閱 要求
		createSubUnsubAction() {
			let self = this;
			if (!self.subUnsubAction) {
				self.subUnsubAction = setTimeout(function(self) {
					self.comparisonSubUnsub();
					delete self.subUnsubAction;
				}, 100, self);
			}
		},
		// [比對訂閱] : 比對 [新/舊訂閱表] 來決定要 訂閱/解訂閱 哪些商品
		comparisonSubUnsub() {
			let self = this;
			let subList = [];
			let unsubList = [];
			for (let sid in self.queueSubMap) {
				// 已經訂閱該商品的元件數量
				let len1 = self.curSubMap[sid] ? Object.keys(self.curSubMap[sid]).length : 0;
				// 即將訂閱該商品的元件數量
				let len2 = Object.keys(self.queueSubMap[sid]).length;
				// 需解除訂閱
				if (len2 === 0 && len1 > 0) {
					unsubList.push(sid);
					// 移除解除訂閱的商品市況
					let qo = self.mapSymbolToQuoteObject[sid];
					if (qo) 
						self.$set(qo, "$suspend", true);
				}
				// 需增加訂閱
				else if (len1 === 0 && len2 > 0) {
					subList.push(sid);
				}
			}
			// 進行訂閱
			if (subList.length > 0) {
				this.sendSubCmd(subList);
				// 統計訂閱至收到資料的時間
				if (window.dvm) {
					let now = new Date();
					subList.forEach((sid)=>{
						self.subTime[sid] = now;
					});
				}
			}
			// 進行解訂閱
			if (unsubList.length > 0) {
				this.sendUnsubCmd(unsubList);
			}
			// 當前訂閱表
			self.curSubMap = self.queueSubMap;
			delete self.queueSubMap;
			// 移除已經沒有人訂閱的 Key (非必要，但可增加 self.curSubMap 的可讀性，增加下次複製 queueSubMap 的效率)
			for (let sid in self.curSubMap) {
				if (Object.keys(self.curSubMap[sid]).length === 0) {
					delete self.curSubMap[sid];
				}
			}
		},
		// 處理sid中有加帶+OG的情形
		getSidListInfo(list) {
			if(!Array.isArray(list)){
				list = list.split(',');
			}
			let addOG = false;
			let sidList = list.map(s=>{
				// 以+來切割sid
				let sidObj = s.split('+');
				// 判斷是否加訂OG
				if(sidObj[1] === "OG")
					addOG = true;
				return sidObj[0];
			});
			// 回傳sid清單及是否加訂OG
			return {
				sidList: sidList,
				addOG: addOG
			}
		},
		/** 送出訂閱命令 */
		sendSubCmd(subList) {
			let self = this;
			let sidListInfo = this.getSidListInfo(subList);
			let txtSub = sidListInfo.sidList;
			let subObj = {};
			// 轉Object再轉回Array用以過濾掉相同ID (可避免訂閱相同ID時，Server回覆-22的問題) https://trello.com/c/Fg5MxwmQ
			txtSub.forEach(sid=>subObj[sid]=1);
			txtSub = Object.keys(subObj);
			
			let str = JSON.stringify({
				"s": "Q",
				"c": "sub",
				"d": {"s": txtSub},
				"r": "".random(),
			});
			// console.log(`M4C.Quote.send`, str);
			M4C.send(str);

			// 訂閱商品內包含選擇權商品
			if (str.indexOf("I.O.") !== -1 || sidListInfo.addOG) {
				let optList = subList.filter(sid=>{
					return sid.indexOf('I.O.')===0;
				});
				optList = sidListInfo.addOG? sidListInfo.sidList: optList;
				M4C.send({
					"s": "OG",
					"c": "sub",
					"d": {"s": optList},
					"r": "".random(),
				});
			}
			// 訂閱期權雲
			if (window.OptionCloud) {
				// 首次訂閱才開始聽 onData
				if (!this.onOptionCloudDataReady) {
					OptionCloud.onData(this.onOptionCloudData);
					this.onOptionCloudDataReady = true;
				}
				if (this.logOptionCloud) console.log('OptionCloud.sub :', txtSub);
				OptionCloud.sub(subList).then((result) => {
					// 訂閱結果
					if (this.logOptionCloud) console.log('OptionCloud.sub.result :', result);
					let errorList = result.filter(o=>o.code!==0);
					if (errorList.length > 0)
						console.warn(`OptionCloud.sub.error : `, errorList);
				}).catch((error) => {});
			}
		},
		/** 送出解除訂閱命令 */
		sendUnsubCmd(unsubList) {
			let sidListInfo = this.getSidListInfo(unsubList);
			let txtUnsub = sidListInfo.sidList;
			let str = JSON.stringify({
				"s": "Q",
				"c": "unsub",
				"d": {"s": txtUnsub},
				"r": "".random(),
			});
			// console.log(`M4C.Quote.send`, str);
			M4C.send(str);

			// 解除訂閱商品內包含選擇權商品
			if (str.indexOf("I.O.") !== -1 || sidListInfo.addOG) {
				let optList = unsubList.filter(sid=>{
					return sid.indexOf('I.O.')===0;
				});
				optList = sidListInfo.addOG? sidListInfo.sidList: optList;
				M4C.send({
					"s": "OG",
					"c": "unsub",
					"d": {"s": optList},
					"r": "".random(),
				});
			}
			// 解除訂閱期權雲
			if (window.OptionCloud) {
				if (this.logOptionCloud) console.log('OptionCloud.unsub :', txtUnsub);
				OptionCloud.unsub(unsubList).then((result) => {}).catch((error) => {});
			}
		},
		// 收到 Quote 資料
		onData(dataObj) {
			let self = this;
			let data = dataObj.d;
			switch (dataObj.c) {
				// 即時報價資料
				case 't':
					let sid = data.s;
					// 不在訂閱中的商品直接丟棄
					// if (!self.curSubMap[sid])
					// 	return;
					// 統計訂閱至回覆的耗時
					if (window.dvm) {
						let subTime = self.subTime[sid];
						if (subTime) {
							let now = new Date();
							let cost = now - subTime;
							self.usage.sub.count++;
							self.usage.sub.usage += cost;
							self.usage.sub.average = `${(self.usage.sub.usage / self.usage.sub.count).toFixed(2)}ms`;
							delete self.subTime[sid];
						}
					}
					// 即時報價轉換成市況
					let qo = self.mapSymbolToQuoteObject[sid] = Object.assign(
						self.mapSymbolToQuoteObject[sid] || {},
						{'realtimeTick': data},
						data);
					// 市況物件恢復正常狀態
					self.$set(qo, "$suspend", false);
					// QuoteObject 加值處理
					self.processQO(data, qo);
					// 送出給有訂閱的元件
					// let instanceList = self.curSubMap[sid];
					// for (let sid in instanceList) {
					// 	let com_instance = instanceList[sid];
					// 	if (com_instance.onQuote)
					// 		com_instance.onQuote(qo);
					// }
					break;
				// 回補 市況 資料
				case 'mkt':
					if (Array.isArray(data)) {
						for (let i = 0; i < data.length; i += 1) {
							let qo = data[i];
							// 取得市況表示該商品未下市
							qo.$delisting = false;
							if (qo.s) {
								self.mapSymbolToQuoteObject[qo.s] = Object.assign(
									self.mapSymbolToQuoteObject[qo.s] || {},
									qo);
							}
						}
					}
					break;
				case 'sub':
					if (self.mapSymbolToQuoteObject[dataObj.d])
						this.$set(self.mapSymbolToQuoteObject[dataObj.d], "$cd", dataObj.cd);
					if (dataObj.cd != 20)
						console.warn('[M4C_Quote]', 'onQuoteData', JSON.stringify(dataObj));
					break;
				// 清盤、上市、下市訊號 (有訂閱才有送)
				case 's':
					if (data.c === "Reset") {
						// elm = I.S.TWS.*, I.F.TWF.TXF.*, I.F.TWF.TXF.201812, etc...
						data.d.forEach((elm)=>{
							console.log("清盤訊號", elm);
							let resetID = elm.replace('.*', '');
							let resetIDs = resetID.split('.');
							// 交易所 or 商品(不含月份) 層級的清盤
							if (resetIDs.length <= 4) {
								for (let sid in self.mapSymbolToQuoteObject) {
									if (sid.indexOf(resetID) === 0) {
										delete self.mapSymbolToQuoteObject[sid];
										// 立即進行回補
										self.rcvMkt(sid);
									}
								}
							}
							// 商品合約層級清盤
							else if (resetIDs.length === 5) {
								delete self.mapSymbolToQuoteObject[resetID];
								// 立即進行回補
								self.rcvMkt(sid);
							}
							// 送出報價清盤事件 (刻意遞延 5 秒，保證回補的最新已經到達，減低元件取市況失敗延伸的問題)
							setTimeout((resetID) => {
								M4C.trigger("QuoteReset", resetID);
							}, 5000, resetID);
						});
					}
					break;
			}
		},
		// QuoteObject 加值處理
		processQO(tick, qo) {
			let self = this;
			// 漲跌 / 漲跌幅 / 漲跌字色
			if (tick.p && qo.r) {
				qo.$cg = +Big(tick.p).minus(qo.r);
				qo.$cgr = (qo.$cg / qo.r * 100).toFixed(2) + "%";
				qo.$clr = qo.$cg > 0 ? 'clr-up' : (qo.$cg < 0 ? 'clr-dn' : 'clr-ref');
				qo.$bgc = qo.$cg > 0 ? 'bgc-up' : (qo.$cg < 0 ? 'bgc-dn' : 'bgc-ref');
			}
			if (tick.cskew && qo.ycskew) {
				// 計算CSkew漲跌幅(今日CSkew - 昨日CSkew) / 昨日CSkew
				qo.$cskew$pct = parseFloat(this.$safeFloat((tick.cskew - qo.ycskew) / qo.ycskew * 100)).toFixed(2) + "%";
			}
			if (tick.pskew && qo.ypskew) {
				// 計算PSkew漲跌幅(今日PSkew - 昨日PSkew) / 昨日PSkew
				qo.$pskew$pct = parseFloat(this.$safeFloat((tick.pskew - qo.ypskew) / qo.ypskew * 100)).toFixed(2) + "%";
			}
/*			// 名稱+四位月份 ex."澳幣1906"
			if (!qo.$sn && qo.sn) {
				qo.$sn = qo.sn.replace('20', '');
			}
			// 代碼+四位月份 ex. "6A1906"
			if (!qo.$sm && qo.ts && qo.m) {
				qo.$sm = (qo.ts + qo.m).replace('20', '');
			}
			// 交易所代碼 ex. "CME"
			if (!qo.$exg && qo.s) {
				qo.$exg = qo.s.split('.')[2];
			} */
		},
		/**
		 * 回補市況
		 * @memberof M4C_Quote
		 * @param {String} sid 商品代碼
		 * @return {Deferred} 回補狀況
		 */
		rcvMkt(sid) {
			let self = this;
			let cmd = {};
			cmd.s = 'Q';
			cmd.c = 'mkt';
			cmd.r = "".random();
			cmd.d = {};
			cmd.d.s = this.sidToList(sid);
			// 空內容時不回補
			if (!cmd.d.s || cmd.d.s.length === 0)
				return;
			M4C.send(cmd);
			// 只回傳單一個市況
			if(typeof sid === 'string')
				return self.getQuoteObject(sid);
		},
		_getIcmInfo(symbol) {
			var self = this;
			var icmInfo = self.mapSymbolToIcmInfo[symbol];
			if (icmInfo)
				return icmInfo;

			icmInfo = self.mapSymbolToIcmInfo[symbol] = M4C.Symbol.getMainformInfo(symbol);
			return icmInfo;
		},
		isFraction(symbol) {
			var icmInfo = this._getIcmInfo(symbol);
			// 顯示分母
			var showDeno = parseInt(icmInfo.ShowDeno || 1, 10);

			if (showDeno === 1)
				return false;
			else
				return true;
		},
		getInteger(symbol, price, param) {
			return parseInt(price);
		},
		getNumerator(symbol, price, param) {
			var icmInfo = this._getIcmInfo(symbol);
			// 顯示分母
			var showDeno = this.getShowDenominator(symbol);
			return parseFloat((price % 1 * showDeno).toFixed(8));
		},
		getShowDenominator(symbol) {
			var icmInfo = this._getIcmInfo(symbol);
			// 顯示分母
			var showDeno = parseInt(icmInfo.ShowDeno || 1, 10);
			return showDeno;
		},
		// 取得報價物件 (vue響應式)
		getQuoteObject(sid) {
			var self = this;
			if (self.mapSymbolToQuoteObject[sid] == null) {
				self.mapSymbolToQuoteObject[sid] = self.createQuoteObject(sid);
			}
			return self.mapSymbolToQuoteObject[sid];
		},
		// 顯示用價格
		getDisplayPrice(symbol, price, param) {
			var icmInfo = this._getIcmInfo(symbol);
			// 顯示分母
			var showDeno = parseInt(icmInfo.ShowDeno || 1, 10);
			if (isNaN(showDeno))
				showDeno = 1;
			// 小數位數
			var digits = M4C.Symbol.getDecimalLengthWithMulti(symbol, price);
			// 分子
			var numerator = this.getNumerator(symbol, price, param);
			// 整數部分
			var integer = this.getInteger(symbol, price, param);

			var value;
			if (showDeno === 1)
				value = price.toFixed(digits);
			else {
				value = (integer != 0 ? integer + " " : '') + numerator + "/" + showDeno;
			}
			return value;
		},
		// 顯示用數量
		getDisplayVolume(symbol, volume) {
			var info = this._getIcmInfo(symbol) || {};
			if (info.BoardLot && info.BoardLot !== '1') {
				return +Big(volume).div(info.BoardLot);
			} else {
				return volume;
			}
		},
		// 收到期權雲訂閱的即時資料
		onOptionCloudData(data) {
			// console.log('OptionCloud.onData :', JSON.stringify(data));
			for (let sid in data) {
				let qo = this.mapSymbolToQuoteObject[sid];
				if (qo) {
					let obj = data[sid];
					for (let key in obj) {
						this.$set(qo, key, obj[key].value);
					}					
				}
			}
		},
		// 先定義好的欄位，才可被轉為響應式物件 (沒有在這個表裡的欄位將無法響應 !)
		createQuoteObject(sid) {
			return Object.assign({}, {
				"s": "",
				"sn": "",
				"ts": "",
				"d": "",
				"t": "",
				"p": "",
				"q": "",
				"v": "",
				"r": "",
				"o": "",
				"h": "",
				"hl": "",
				"ll": "",
				"l": "",
				"bp1": "",
				"bp2": "",
				"bp3": "",
				"bp4": "",
				"bp5": "",
				"bp6": "",
				"bp7": "",
				"bp8": "",
				"bp9": "",
				"bp10": "",
				"bv1": "",
				"bv2": "",
				"bv3": "",
				"bv4": "",
				"bv5": "",
				"bv6": "",
				"bv7": "",
				"bv8": "",
				"bv9": "",
				"bv10": "",
				"sp1": "",
				"sp2": "",
				"sp3": "",
				"sp4": "",
				"sp5": "",
				"sp6": "",
				"sp7": "",
				"sp8": "",
				"sp9": "",
				"sp10": "",
				"sv1": "",
				"sv2": "",
				"sv3": "",
				"sv4": "",
				"sv5": "",
				"sv6": "",
				"sv7": "",
				"sv8": "",
				"sv9": "",
				"sv10": "",
				"m": "",
				"td": "",
				"ed": "",
				"tsi": "",
				"tp": "",
				"kud": "",
				"kuc": "",
				"kuv": "",
				"kdc": "",
				"kdv": "",
				"ibp": "",
				"ibv": "",
				"isp": "",
				"isv": "",
				"oi": "",
				"yoi": "",
				"st": "",	// 今結算價
				"c": "",	// 收盤價
				"pc": "",	// 昨收
				
				// Opt 欄位
				"iv": "",	// 歷史波動率
				"piv": "",	// 歷史波動率 - 昨日
				"de": "",
				"ga": "",
				"ve": "",
				"th": "",
				"rh": "",
				"hv4": 0,	// 20天歷史波動率
				"phv4": 0,	// 20天歷史波動率 - 昨日

				"$cg": "",
				"$cgr": "",
				"$clr": "",
				"$sn": "",
				"$sm": "",
				"$exg": "",
				"$cd": "",
				// 已下市 (預設為true)
				"$delisting": true,
				// 暫停狀態 (已被完全解除訂閱時=true，即時資料進入=false)
				"$suspend": true,
			});
		},		
	},
	watch: {},
    computed: {
		logOptionCloud() {
			return vue.$store.state.logConsole.OptionCloud;
		},
	},
}
</script>
