<template>
    <div class="m4c-symbol hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			classification: {},
			mainformInfos: {},
			/** 記憶每檔商品的小數位數長度，以供快速回覆 */
			mapSidToDecimalLength: {},
			/** 讓 "I.F.CBOT.TN.HOT" 可以轉回 "I.F.CBOT.TN.201909" 的 mapping */
			mapHotMonth: {},
			/** 合約表 */
			contractMap: {},
			/** 交易所代號->交易所Obj */
			mapExgIDtoExgObj: {},
			/** 三表查詢結果的容器 */
			queryMainformResolve: {},
			queryMainformReject: {},
			/** 熱門月資料 */
			hotList: [],
			/** 期貨->選擇權 對應表 */
			/** 標的商品代碼 -> 期權商品代碼 對應表 */
			mapULSIDtoOSID: {},
			/** 標的商品代碼 -> 期貨商品代碼 對應表 */
			mapFSIDtoULSID: {},
			/** 熱門月月份代碼 -> 期貨各月份合約清單 對應表 */
			mapSymbolContracts: {},
			// 品種代碼 -> 該品種各月份合約代碼清單
			mapSymbolToContracts: {},
			/** 對回以 key 為 [標的] 的合約代碼 */
			mapReverseUnderlying: {},
			PORTFOLIOContracts: {},
			/** 匯率表版號 */
			currencyVer: '',
			// 查詢總表 timeout 容器
			queryMainformTimeout: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Symbol = this.$store.state.m4c.symbol = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'Symbol', 'c': 'get', 'callback': this.onGetData.bind(this)});
		M4C.regDispatch({'s': 'Symbol', 'c': 'sub', 'callback': this.onSubData.bind(this)});
	},
    methods: {
		// 發送 Symbol.get 命令
		sendSymbolGet(mName) {
			let keyD = `${this.projectID}_SYMBOL_${mName}.d`;
			let keyV = `${this.projectID}_SYMBOL_${mName}.v`;
			let cache = localStorage.getItem(keyD);
			let v = parseInt(localStorage.getItem(keyV));
			let cmd = {
				"s": "Symbol",
				"c": "get",
				"r": "".random(),
				"d": {
					"t": "C",
					"name": mName,
					"v": cache && v ? v : 0,
				},
			};
			M4C.send(cmd);
		},
		// 發送 Symbol.get 命令取匯率表
		sendSymbolGetCurreny() {
			// 目前匯率表變動不大，一天只有一次。因此如果有匯率表資料就不再查詢
			if(this.currencyVer) return;
			let cmd = {
				"s": "Symbol",
				"c": "get",
				"r": "".random(),
				"d": {
					"t": "Currency"
				},
			};
			M4C.send(cmd);
		},		
		// 查詢總表/分類表
		queryMainform(mName) {
			let self = this;
			// 發送 Symbol.get 命令
			self.sendSymbolGet(mName);
			// 建立 Promise
			let promise = new Promise(function(resolve, reject){
				self.queryMainformResolve[mName] = resolve;
				self.queryMainformReject[mName] = reject;
			});

			// 10 秒內還沒拿到總表分類表，送出 reject
			self.queryMainformTimeout[mName] = setTimeout((mName)=>{
				if (self.queryMainformReject[mName]) {
					self.queryMainformReject[mName]();
				}
			}, 9988, mName);

			return promise;
		},
		// 即時版號異動
		onSubData(data) {
			let self = this;
			// 有版號時才是有異動
			if (data.d.v) {
				// 隨機延遲 1~60 秒
				let delay = Math.floor(Math.random()*60) * 1000;
				console.log(`Symbol 隨機延遲(${delay}ms) 後重查三表 !`);
				setTimeout((data)=>{
					// 重查三表
					self.queryMainform(data.d.name);
				}, delay, data);
			}
		},
		// 收到資料
		onGetData(data, wsConn) {
			// 匯率表改由其他的函式處理。
			if(data.d && data.d.t=='Currency') {
				this.onGetCurrencyData(data);
				return;
			}
			let self = this;
			// 三表內容沒有 d 時表示發生錯誤
			if (!data.d) {
				M4C.trigger("SYMBOL-ERROR", data);
				return;
			}
			// 解壓縮後的內容放在 data.d.$data 中
			if (data.d.$data && data.d.$data.gzip)
				data.d.data = data.d.$data.gzip;
			// 三表名稱 (ex. "FMM_FREXG", "X4_OPT")
			let mName = data.d.name;
			// 儲存 key
			let keyD = `${this.projectID}_SYMBOL_${mName}.d`;
			let keyV = `${this.projectID}_SYMBOL_${mName}.v`;
			// 本次發出查詢的版號
			let queryV = localStorage.getItem(keyV);
			// 本次查詢回來的版號
			let mdataV = `${data.d.v}`;
			// 內容的字串格式
			let strData = data.d.data ? JSON.stringify(data.d.data) : '';
			// 版號異動
			if (mdataV !== queryV) {
				if (data.d.data)
					console.log(`取得商品表 ${mName} 版號 ${mdataV} 內容長度 ${strData.length}`);
				else
					console.log(`商品表內容異常(無法解析/空資料) 商品表 ${mName} 查詢版號 ${queryV} 回覆版號 ${mdataV}`);
			}
			// 空內容 -> 從 Cache 拿
			let dataD = data.d.data;
			if (!dataD) {
				// 從 localStorage 取回/解壓縮三表資料
				dataD = JSON.parse(localStorage.getItemWithDecompress(keyD));
			}
			// 解析處理此商品表資料
			this.processData({dataD});
			// 三表完成
			if (self.queryMainformResolve[mName]) {
				clearTimeout(self.queryMainformTimeout[mName]);
				delete self.queryMainformTimeout[mName];
				self.queryMainformResolve[mName]();
			}
			// 本次查回有內容 -> 存入Cache
			if (data.d.data) {
				// 內容
				localStorage.setItemWithCompress(keyD, strData);
				// 版號
				localStorage.setItem(keyV, data.d.v);
			}
			// 訂閱即時三表
			if (!self.alreadySub) {
				M4C.send({"s": "Symbol", "c": "sub", "d":{"t": "C", "name": data.d.name}});
				self.alreadySub = true;
				// 台灣版加查匯率表
				if(self.twMode)
					this.sendSymbolGetCurreny();
			}
		},
		// 收到匯率表資料
		onGetCurrencyData(data) {
			if (data.d.$data && data.d.$data.gzip) {
				data.d.data = data.d.$data.gzip;
				// 內容的字串格式
				let strData = data.d.data ? JSON.stringify(data.d.data) : '';
				if (data.d.data) {
					console.log(`取得匯率表 版號 ${data.d.LastVersion} 內容長度 ${strData.length}`);
					// 目前symbol回的資料是以美金當key的json資料ex:{USD:{TWD:29.1, ...}}
					for(let idx in data.d.data) {
						let xrateList = data.d.data[idx];
						if(xrateList) {
							this.$store.state.data.xRate = xrateList;
							// 記錄當次查詢的版號，以判別是否再次重查
							this.currencyVer = data.d.LastVersion;
						}
						// console.log("vuex xRate is ", this.$store.state.data.xRate);
						// 只處理第一份以美金計算的匯率資料，避免萬一SERVER給第二份以其他幣別計算的匯率，導致匯率混亂。
						break;
					}
				}
			}
		},
		// 解析處理此商品表資料
		processData({dataD}) {
			let self = this;
			// 總表
			let sec = dataD.sec;
			for (let key in sec) {
				let minfoMap = sec[key];
				for (let sid in minfoMap) {
					self.processMainformInfo(minfoMap[sid], sid);
				}
			}
			// 分類表
			let cla = dataD.cla;
			// 逐分類表 (ex. "FMM_FREXG", "X4_OPT", ...)
			for (let key in cla) {
				let cfList = cla[key].Node
				self.classification[key] = cfList;
				// 逐交易所
				cfList.forEach((exgObj)=>{
					// 交易所代號->交易所Obj
					if (exgObj.ENG) {
						let id = exgObj.ENG; // 用 ENG 作為 ID (如果未來有支持 ID 欄位，應改用 ID 欄位)
						// 不同分類表會存在相同交易所，因此加入分類表代號以區隔
						self.mapExgIDtoExgObj[`${key}.${id}`] = self.mapExgIDtoExgObj[id] = exgObj;
					}
					// 取得第一個期貨交易所 (首次登入預設選擇的交易所)
					self.getFirstFExgID(exgObj);
					// 解析/處理 [選擇權] 交易所/商品
					let isOpt = self.processOpt(key, exgObj);
					// 解析所有商品
					self.processSymbol(key, exgObj, isOpt);
					// 找出熱門月Contracts
					if (Array.isArray(exgObj.Node)) {
						let exgNode = exgObj.Node;
						if (isOpt) {
							exgNode.forEach((symbolObj)=>{
								// 避免個別商品若有異常資料去影響到其它商品的解析
								try{
									let hotIdx = symbolObj.Node.findIndex(obj=>obj.ENG==="HOT");
									if (hotIdx !== -1) {
										let tmp = symbolObj.Node[0].Node[0].Contracts[0].split('.');
										let sf5 = tmp.slice(0,5).join('.');
										let sf4 = tmp.slice(0,4).join('.');
										self.mapHotMonth[sf4] = sf5;
									}
								}catch(e){}
							});
						}
						else {
							let hotIdx = exgNode.findIndex(obj=>obj.ENG==="HOT");
							if (hotIdx !== -1){
								// 用這行模擬出熱門月有缺漏的情境 for https://trello.com/c/CzBRVlej
								// exgNode[hotIdx].Contracts.splice(1,1);
								self.hotList = [...self.hotList, ...exgNode[hotIdx].Contracts];
								// 處理期貨熱門月對應的合約清單。
								exgNode[hotIdx].Contracts.forEach((sid)=>{
									let symbolObj = exgNode.find(obj=>{return obj.Contracts.indexOf(sid) !== -1 && obj.ENG !=="HOT"});
									if (symbolObj) {
										self.mapSymbolContracts[sid] = symbolObj.Contracts;
										// 此品種有對應到熱門月
										symbolObj.hasHot = true;
									}
								});
							}
							// 品種代碼 -> 該品種各月份合約代碼清單 (一鍵轉倉要用)
							exgNode.forEach(nodeObj=>{
								if (nodeObj.ENG==='HOT') return;
								if (!nodeObj.Contracts) return;
								let firstSid = nodeObj.Contracts[0];
								if (!firstSid) return;
								let sids = firstSid.split('.');
								if (sids.length > 5) return;
								let symbolId = sids.slice(0, 4).join('.');
								self.mapSymbolToContracts[symbolId] = nodeObj.Contracts;
							});
						}
					}
				});
			}

			// 建立讓 "I.F.CBOT.TN.HOT" 可以轉回 "I.F.CBOT.TN.201909" 的 mapping
			self.hotList.forEach((contractID)=>{
				let tmp = contractID.split('.');	// contractID = "I.F.CBOT.TN.201909"
				let mon = tmp.splice(-1,1);			// mon = ['201909']
				let key = tmp.join('.');
				self.mapHotMonth[key] = contractID;
			});
			// 合約表
			let con = dataD.con;
			for (let key in con) {
				let conList = con[key];
				for (let contractID in conList) {
					self.contractMap[contractID] = conList[contractID];
				}
			}
		},
		// 取得第一個期貨交易所 (首次登入預設選擇的交易所)
		getFirstFExgID(exgObj) {
			if (!this.firstFExgID) {
				try {
					if (exgObj.Node[0].Contracts[0].indexOf(".F.") !== -1) {
						this.firstFExgID = exgObj.ENG;
						return;
					}
				}catch(err){}
			}
		},
		// 檢查是否包含 Option 商品
		processOpt(key, exgObj) {
			try {
				let eng = exgObj.Node[0].Node[0].Node[0].ENG;
				if (eng === "C" || eng === "P") {
					this.$store.state.status.existOpt = true;
					this.optClassification = this.optClassification || key;
					return true;
				}
			}catch(err) {}
		},
		/** 解析所有商品 */
		processSymbol(key, exgObj, isOpt) {
			// PORTFOLIO分類表
			if(key == "PORTFOLIO") {
				exgObj.Node.forEach((itemObj)=>{
					if (itemObj.ENG == "Options") {
						if (Array.isArray(itemObj.Node)) {
							// 逐商品
							itemObj.Node.forEach((symbolObj)=>{
								symbolObj.Node.forEach(StrikePriceObj=> {
									StrikePriceObj.Node.forEach(CPObj=> {
										CPObj.Contracts.forEach(contract=> {
											this.PORTFOLIOContracts[contract] = true;
										});
									});
								});
							});
						}
					}
					else {
						if (Array.isArray(itemObj.Node)) {
							// 逐商品
							itemObj.Node.forEach((symbolObj)=>{
								symbolObj.Contracts.forEach(contract=> {
									this.PORTFOLIOContracts[contract] = true;
								});
							});
						}
					}
				});
			}
			// 期貨
			else if (!isOpt) {
				// 逐商品
				if (Array.isArray(exgObj.Node)) {
					exgObj.Node.forEach((symbolObj)=>{
						if (symbolObj.Contracts && symbolObj.Contracts[0]) {
							let sid = this.getPureSymbol(symbolObj.Contracts[0]);
							let minfo = this.getMainformInfo(sid);
							// [期貨->標的物] 對應表
							if (minfo && minfo.Underlying && minfo.Underlying.S) {
								let ulSID = minfo.Underlying.S;
								this.mapFSIDtoULSID[sid] = ulSID;
							}
						}
						else {
							console.log('M4C.Symbol.processSymbol Contracts Error: ', key, exgObj, symbolObj);
						}
					});
				}
			}
			// 選擇權
			else {
				// 逐商品
				if (Array.isArray(exgObj.Node)) {
					// 逐商品
					exgObj.Node.forEach((symbolObj)=>{
						let sid = M4C.Option.getOptPureSymbol(symbolObj);
						let minfo = this.getMainformInfo(sid);
						// [標的物->期權] 對應表
						if (minfo && minfo.Underlying && minfo.Underlying.S) {
							let ulSID = minfo.Underlying.S;
							this.mapULSIDtoOSID[ulSID] = sid;
						}
					});
				}
			}
		},
		// 前處理總表
		processMainformInfo(minfo, key) {
			this.mainformInfos[minfo['full-name']] = minfo;

			// 對回以 key 為 [標的] 的合約代碼 (排除除權息的干擾)
			if (minfo.Underlying && !minfo.SetPRIADJ) {
				this.mapReverseUnderlying[minfo.Underlying.S] = key;
				this.mapReverseUnderlying[minfo.Underlying.F] = key;
			}
		},
		// 對應回以 sid 為標的的品種代碼
		reverseUnderlying(sid) {
			return this.mapReverseUnderlying[sid] || sid;
		},
		// 取得分類表
		getClassification(key) {
			// OPT 時，支持公開設定指定選擇權要用的分類表
			key = key==="OPT" ? (this.optClassificationKey || key) : key;
			// OPT 時，支持預設拿第一個內容有選擇權的分類表
			key = key==="OPT" ? (this.optClassification || "X4_OPT") : key;
			return this.classification[key];
		},
		// 取得指定商品總表 (支持含月份與不含月份)
		getMainformInfo(sid) {
			if (!sid) return;
			if (!this.mainformInfos[sid]) {
				// 將月份去掉
				let ctId = sid.split('.').slice(0, 4).join('.');
				// 含月份的 sid 也對應到此總表物件，下次再拿可以更快
				this.mainformInfos[sid] = this.mainformInfos[ctId];
			}
			return this.mainformInfos[sid];
		},
		// 取得此合約的交易所層級的總表
		getExgMainformInfo(sid) {
			try{return M4C.Symbol.getMainformInfo(sid.split('.').slice(0,3).join('.'));}catch(e){return {};}
		},
		/** 取得指定合約的內容 */
		getContractInfo(contractID) {
			return this.contractMap[contractID];
		},
		/** 取得交易所名稱 by 交易所代號(ENG) */
		getExgNameByExgId(exgId) {
			let langCode = window.mainformLangKey;
			let obj = this.mapExgIDtoExgObj[exgId];
			return obj ? obj[langCode] : exgId;
		},
		/** 取得交易所節點 by 交易所代號(ENG), 取不到就回第一個的內容 */
		getExgNodeByExgId(cla, exgId) {
			cla = cla==="OPT" ? (this.optClassification || "X4_OPT") : cla;
			let key = `${cla}.${exgId}`;
			let map = this.mapExgIDtoExgObj;
			return map[key] || map[Object.keys(map)[0]];
		},
		// 取得跳動點數物件(tso)陣列 (支持優化記憶)
		getTSOList(minfo) {
			if (!minfo || typeof(minfo.TickSize) !== 'string')
				return [];
			if (minfo.$TickSizeList)
				return minfo.$TickSizeList;
			let tsList = [];
			// 分析
			let list = minfo.TickSize.split(';');
			// 防呆最右邊多打 ; 的各種情境 ex. "xx;xxx;", "xx;xxx; ", "xx;xxx;;", "xx;xxx;; ", "xx;xxx; ;"
			list = list.filter(function(substr){return !!substr.trim();});
			// 單一組設定時
			if (list.length === 1)
				return isNaN(list[0]) ? [1] : [Number(list[0])];
			// 逐個分解建立設定
			list.forEach((obj)=>{
				let tmp = obj.split(':');
				if (tmp && !isNaN(tmp[0]) && !isNaN(tmp[1]))
					tsList.push({lmt: Number(tmp[0]), val: Number(tmp[1])});
			});
			return minfo.$TickSizeList = tsList;
		},
		// 取得跳動點數
		getTickSize(sid, price, decrease) {
			let self = this;
			// 指定特定合約使用指定的Ticksize
			if (this.overwriteTickSize && this.overwriteTickSize[sid])
				return this.overwriteTickSize[sid];
			let minfo = self.getMainformInfo(sid);
			// 沒有總表 -> 回傳 1
			if (!minfo) return 1;
			// 已存在此商品的『唯一』TickSize 直接回傳
			if (minfo.$TickSize)
				return minfo.$TickSize;
			// 價格錯誤 -> 回傳 1
			if (isNaN(price)) return 1;
			// 沒有 TickSize 設定 -> 回傳 1
			if (minfo.TickSize === undefined) return 1;
			// 取得 tso 物件陣列
			let tsList = self.getTSOList(minfo);
			// 只有一個就直接回傳 (同時儲存至 minfo.$TickSize)
			if (tsList.length === 1)
				return minfo.$TickSize = tsList[0];
			// 複式期貨一律取最小的 TickSize (https://trello.com/c/Q3yUSVdx/6578-100)
			let ids = sid.split('.');
			if (ids[1] === 'F2') return tsList[0].val;

			price = parseFloat(price, 10);
			let tickSize = 1;
			// TickSize: "0:0.1;10:0.5;50:1;500:5;1000:10;"
			// tsList: [{lmt:0, val:0.1}, {lmt:10, val:0.5}, {lmt:50, val:1}, {lmt:500, val:5}, {lmt:1000, val:10}]
			for (let i=0; i<tsList.length; i++) {
				let tso0 = tsList[i];
				let tso1 = tsList[i+1];
				// 找不到匹配且價格比最大限制還大以最大限制計ticksize
				if (tso1 == null && price > tso0.lmt)
					return tso0.val;
				// 找不到匹配且價格比最小限制還小以最低限制計ticksize
				if (!tso1 && price < tsList[0].lmt)
					return tsList[0].val;
				// 遞減模式時，不包含切換價格本身 (ex. 50 應回傳 0.5), 遞增模式時，要包含切換價格本身 (ex. 50 應回傳 1)
				if (price === tso0.lmt) {
					// 價格匹配且i=0時會出現tsList[0-1]的問題(有負值情境下才會發生)，因此多判斷i>0。
					return decrease && i > 0? tsList[i-1].val: tso0.val;
				}
				// 在限制區間內
				if (price > tso0.lmt && price < tso1.lmt)
					return tso0.val;
			}
			return tickSize;
		},
		// 支持顯示乘數 (將帶入數值x顯示乘數)
		doMult(sid, val) {
			if (!val) return val;
			if (this.supportMult) {
				let mult = this.getShowMult(sid);
				if (mult != 1)
					return +Big(val).times(mult || 1);
			}
			return val;
		},
		// 取得顯示乘數
		getShowMult(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			if (minfo && minfo.PriceExpression && minfo.PriceExpression[window.comp])
				return Number(minfo.PriceExpression[window.comp].mult);
		},
		// 取得跳動點數 (考慮乘數)
		getTickSizeWithMulti(tcId, orgVal) {
			let self = this;
			let minfo = self.getMainformInfo(tcId);
			if (!minfo || orgVal==null)
				return 1;
			let ticksize = self.getTickSize(tcId, orgVal);
			if (isNaN(ticksize))
				return 1;
			let mult = minfo.PriceExpression && minfo.PriceExpression[window.comp] ? minfo.PriceExpression[window.comp].mult : 1;
			mult = isNaN(mult) ? 1 : mult;
			let tickSizeWithMulti = new Big(ticksize).times(mult);
			return parseFloat(tickSizeWithMulti.toString(), 10);
		},
		// 取得價格小數長度
		getDecimalLength(tcId, decimalPrice) {
			if (!decimalPrice)
				return 0;
			let minfo = this.getMainformInfo(tcId);
			// 支持透過 maping 快速回覆 (價格跳動不會更新，但是因為機率很低，就算 ticksize 變，小數位數也不一定會變，所以略過不考慮)
			// 20230306 加入$TickSizeList資料判斷，如果有就不優先取用快取資料，防止取錯ticksize長度。
			if (this.mapSidToDecimalLength[tcId] != null && (minfo && !minfo.$TickSizeList))
				return this.mapSidToDecimalLength[tcId];

			// 支持乘數
			let multDecimalPrice = this.doMult(tcId, decimalPrice);
			// 無總表時 -> 直接回傳帶入價格的小數位數 (避免產生 mapSidToDecimalLength[tcId] = 1 的錯誤 cache)
			if (!minfo) return `${multDecimalPrice}`.getDecimalLength();

			let dlen = 0;
			let numTickSize = this.getTickSize(tcId, decimalPrice);
			let multTickSize = numTickSize;
			if (minfo && minfo.PriceExpression && minfo.PriceExpression[window.comp]) {
				let mult = Number(minfo.PriceExpression[window.comp].mult);
				if (mult != 1)
					multTickSize = Big(numTickSize).times(mult);
			}

			if (isNaN(multTickSize)) {
				dlen = 0;
			}
			let strTickSize = `${multTickSize}`;
			// 有科學符號時，例如 日圓 "5e-7"
			if (strTickSize.indexOf('e') !== -1) {
				dlen = Math.abs(Big(multTickSize).e);
			}
			// 無科學符號時，一般商品
			else {
				dlen = strTickSize.getDecimalLength();
			}
			this.mapSidToDecimalLength[tcId] = dlen;
			return dlen;
		},
		// 取得小數位數 (考慮乘數)
		getDecimalLengthWithMulti(tcId, orgVal) {
			var numTickSize = this.getTickSizeWithMulti(tcId, orgVal);
			if (isNaN(numTickSize)) {
				return 0;
			}
			return Math.abs(Big(numTickSize).e);
		},
		// 取得商品名稱
		getSymbolName(minfo, sid) {
			let langCode = window.mainformLangKey;
			if (!minfo) return sid;
			// 優先使用 EXG_M, CHT_M, CHS_M
			return minfo.Name[`${langCode}_M`] || minfo.Name[`${langCode}`] || minfo.Name.ENG || minfo.Symbol;
		},
		// 取得合約名稱
		getContractName(sid = "") {
			let minfo = this.getMainformInfo(sid);
			return this.getSymbolName(minfo, sid);
		},
		// 取得合約月份顯示名稱 ex."澳币1906", 支持指定連結符號 ex. " " -> "澳币 1906"
		getCNM4(sid = "", link = "") {
			let minfo = this.getMainformInfo(sid);
			if (!minfo) return sid;
			let ids = sid.split('.');
			let symbolName = this.getSymbolName(minfo);
			if (ids[1]==="O") {
				let skp = ids.slice(6).join('.') + (minfo.SetPRIADJ || '');
				return `${symbolName}${link}${ids[4].substr(2)} ${ids[5]}${skp}`;
			}
			else if (ids[1]==="S")
				return `${symbolName}${link}${ids[3]}`;
			else if(this.isPriceDiff_FutSymbol(sid)) {
				let mth1 = ids[4];
				let mth2 = ids[ids.length-1];
				return `${symbolName}${link}${mth1} (${mth2})`;
			}
			else {
				// 相容台灣商品(指數類只有4碼ex:I.F.TWF.TXF)
				let month = ids[4]? ids[4].substr(2): this.getCIDM4(sid);
				return `${symbolName}${link}${month}`;
			}
		},
		// 取得合約代碼+月份四碼 ex. "6A1906", 支持指定連結符號 ex. " " -> "6A 1906"
		getCIDM4(sid = "", link = "") {
			let minfo = this.getMainformInfo(sid);
			if (!minfo) {
				let tmp = sid.split('.');
				return tmp.slice(2).join('.');
			}
			let ids = sid.split('.');
			if (ids[1]==="S") {
				return `${minfo.Symbol}`;
			}
			else if (ids[1]==="O") {
				let symbol = minfo.Symbol.replace(minfo.SetPRIADJ,'');
				let skp = ids.slice(6).join('.') + (minfo.SetPRIADJ || '');
				// "[SYMBOL] [MONTH] [CALLPUT][STRIKE]" 注意 ! 空白有被 SymbolCNM4 利用切割，要改需要對應修改
				return `${symbol} ${ids[4].substr(2)} ${ids[5]}${skp}`;
			}
			else if(this.isPriceDiff_FutSymbol(sid)) {
				let mth1 = ids[4];
				let mth2 = ids[ids.length-1];
				return `${minfo.Symbol}${link}${mth1} (${mth2})`;
			}
			else {
				let mth = ids[ids.length-1];
				return `${minfo.Symbol}${link}${mth=='HOT' ? '' : mth.substr(2)}`;
			}
		},
		getCNameCIDHot(sid = "") {
			let minfo = this.getMainformInfo(sid);
			let tmp = sid.split('.').slice(2).join('.');
			let ids = sid.split('.');
			if (ids[1]==="O") {
				let symbol = minfo.Symbol.replace(minfo.SetPRIADJ,'');
				let skp = ids.slice(6).join('.') + (minfo.SetPRIADJ || '');
				// "[SYMBOL] [MONTH] [CALLPUT][STRIKE]" 注意 ! 空白有被 SymbolCNM4 利用切割，要改需要對應修改
				tmp = `${symbol} ${ids[5]}${skp} (HOT)`;
			}
			else 
				tmp = `${minfo.Symbol} (HOT)`;
			return `${this.getContractName(sid)}${tmp}`;
		},
		// 取得合約名稱+合約代碼+月份四碼 ex. "澳幣6A1906", 支持指定連結符號 ex. " " -> "澳幣 6A 1906"
		getCNameCIDM4(sid = "", link = "") {
			// let minfo = this.getMainformInfo(sid);
			// if (!minfo) return sid;
			// let ids = sid.split('.');
			// let monthL4 = ids[ids.length-1].substr(2);
			// return `${this.getSymbolName(minfo)}${link}${minfo.Symbol}${link}${monthL4}`;
			return `${this.getContractName(sid)}${link}${this.getCIDM4(sid)}`;
		},
		// 取得合約所屬交易所名稱
		getExchangeName(sid) {
			let minfo = this.getMainformInfo(sid);
			if (!minfo) return sid;
			return `${minfo.ExchangeName ? minfo.ExchangeName[window.mainformLangKey] : minfo.Exchange}`;
		},
		// 取得該交易所是 S/F/O 哪一種
		getExgType(exgItem) {
			try{return exgItem.Node[0].Contracts[0].split('.')[1];}catch(e){}
		},
		// 取得 [最早開盤] 至 [最晚收盤] 時間 ＝> return {'start': '0600', 'close': '0500'}
		getOpenCloseTime(sid = "") {
			let ocList = this.getOpenCloseList(sid);
			if (ocList === null)
				return null;
			return {'start': ocList[0].start, 'close': ocList[ocList.length-1].close};
		},
		// 取得(多盤別)開收盤時間列表
		getOpenCloseList(sid = "") {
			let list = [];
			let tradingHours = this.getTradingHours(sid);
			if (tradingHours === null)
				return null;
			let tmp = tradingHours.split(',');
			tmp.forEach((octime)=>{
				let tmp2 = octime.split('-');
				list.push({'start': tmp2[0], 'close': tmp2[1]});
			});
			return list;
		},
		// 取得交易時段設定 (總表.TradingHours)，取不到時會取所屬交易所的設定
		getTradingHours(sid) {
			// 先取合約/商品層級的 TradingHours
			let minfo = this.getMainformInfo(sid);
			let result = minfo.TradingHours;
			// 不存在時，取交易所層級的 TradingHours
			if (result == null) {
				let tmpID = sid.split('.').slice(0,3).join('.');
				result = this.getMainformInfo(tmpID).TradingHours;
			}
			return result;
		},
		// 取得商品的 OrderType
		getOrderType(sid) {
			// 先取合約/商品層級的 OrderType
			let minfo = this.getMainformInfo(sid);
			let result = minfo.OrderType;
			// 不存在時，取交易所層級的 OrderType
			if (result == null) {
				let tmpID = sid.split('.').slice(0,3).join('.');
				result = this.getMainformInfo(tmpID).OrderType;
			}
			return result;
		},
		// 小數填滿 0 至 ticksize 長度
		fillDecimalLength(sid, val, addLen=0) {
			if (val==null || val=='') return '';
			let len = this.getDecimalLength(sid, val);
			if (val.toFixed)
				return val.toFixed(len+addLen);
		},
		// 小數填滿 0 至 ticksize 長度 (考慮乘數)
		fillDecimalLengthWithMulti({sid, orgVal, multVal, addLen=0}) {
			if (multVal==null || multVal=='') return '';
			let len = this.getDecimalLengthWithMulti(sid, orgVal);
			if (multVal.toFixed)
				return multVal.toFixed(len+addLen);
		},
		// 取得分數表示法物件
		getDenoObject({sid, val}) {
			val = Math.abs(val);
			let minfo = this.getMainformInfo(sid);
			if (minfo && minfo.PriceExpression && minfo.PriceExpression[window.comp]) {
				let deno = minfo.PriceExpression[window.comp].deno;
				if (deno != 1) {
					let obj = {deno: deno};
					obj.integer = parseInt(val);
					let decimal = +Big(val).mod(1);
					obj.molecular = +Big(decimal).times(deno);
					return obj;
				}
			}
		},
		// 分數物件轉回十進位小數
		denoToDecimal({integer, molecular, deno}) {
			let num = +Big(molecular).div(deno);
			return +Big(integer).plus(num);
		},
		// 檢查該商品是否為熱門月
		isHotSymbol(sid) {
			return this.hotList.indexOf(sid) !== -1;
		},
		// 檢查該代碼最後一位是否為HOT
		isHotSID(sid) {
			let tmp = sid.split('.');
			if (Array.isArray(tmp) && (tmp[tmp.length-1] === 'HOT' || tmp[tmp.length-1] === 'HOT2'))
				return true;
		},
		/** 將 selectedSymbol 轉 Hot 代碼回傳 */
		selectedSymbolToHot() {
			let sid = this.$store.state.selectedSymbol.ID;
			// 支持主連機制，嘗試直接在這裡判斷，當前不是 displayAsHot 時就不轉，讓單月情境保持單月sid
			if (!this.$store.state.selectedSymbol.displayAsHot)
				return sid;
			if (this.isHotSymbol(sid)) {
				let tmp = sid.split('.');
				tmp.splice(-1,1);
				tmp.push('HOT');
				return tmp.join('.');
			}
			return sid;
		},
		/** 將 [合約代碼] 轉為 [熱門月代碼] ex. "I.F.CME.6B.201909" -> "I.F.CME.6B.HOT" */
		toHotSymbol(sid) {
			if (this.isHotSymbol(sid)) {
				let tmp = sid.split('.');
				tmp.splice(-1,1);
				tmp.push('HOT');
				return tmp.join('.');
			}
			return sid;
		},

		/** 將 [熱門月代碼] 轉為 [合約代碼] ex. "I.F.CBOT.TN.HOT" -> "I.F.CBOT.TN.201909" */
		toMonthSymbol(sid) {
			if (!sid) return "";
			let tmp = sid.split('.');
			// 非 HOT / HOT2 時，直接回傳
			if (tmp[4] !== 'HOT' && tmp[4] !== 'HOT2')
				return sid;
			// 取得品種層級代碼
			let sbid = sid.split('.').slice(0, 4).join('.');
			return this.mapHotMonth[sid] || this.mapHotMonth[sbid] || sid;
		},
		/** 以 [期貨SID] 取得對應的 [期權SID] */
		getOSIDbyFSID(sid) {
			sid = this.getPureSymbol(sid);
			let ulSID = this.mapFSIDtoULSID[sid] || sid;
			return this.mapULSIDtoOSID[ulSID];
		},
		/** 取得品種代碼 (ex."I.F.SHFE.cu.202005"->"I.F.SHFE.cu") */
		getPureSymbol(sid) {
			if (!sid) return;
			let sids = sid.split('.');
			if (sids.length < 5)
				return sid;
			return sids.slice(0, 4).join('.');
		},
		// 取得合約月份
		getPureMonth(sid) {
			if (!sid) return;
			return sid.split('.')[4];
		},
		/** 取得指定期權合約的到期日 date 物件 **/
		getExpireDay(sid) {
			if (!sid) return;
			let contractInfo = M4C.Symbol.getContractInfo(sid);
			if (contractInfo && contractInfo.ExpirationDate) {
				return new Date().resetDate(contractInfo.ExpirationDate).resetTime("000000");
			}
		},
		/** 取得指定期權合約的剩餘有效天數 */
		getRemainDays(sid) {
			let expireTime = this.getExpireDay(sid);
			if (expireTime) {
				let todayTime = new Date().resetTime("000000");
				return Math.round((expireTime - todayTime) / 86400000);
			}
		},
		/** 取得標的商品SID */
		getUnderlyingS(sid) {
			if (!sid) return;
			let minfo = M4C.Symbol.getMainformInfo(sid);
			if (minfo && minfo.Underlying) {
				let underlyingF = minfo.Underlying.F;
				let underlyingS = minfo.Underlying.S;
				// 未设定 underlying.F 时，回 underlying.S
				if (!underlyingF)
					return underlyingS;
				let include_U = underlyingF.indexOf("_U") != -1;
				// 期货期权
				if (!include_U && underlyingF===underlyingS)
					// return M4C.Symbol.mapHotMonth[underlyingF];
					return `${underlyingF}.${sid.split('.')[4]}`;
				// 个股期权
				else
					return underlyingS;
			}
		},
		/** 是否為商品期權(期貨期權) */
		isCommodityOptions(sid) {
			if (!sid) return;
			let tmp = sid.split('.');
			// 只有 O 才繼續往下判斷
			if (!tmp[1] || tmp[1]!=='O') return false;
			let minfo = M4C.Symbol.getMainformInfo(sid);
			if (minfo && minfo.Underlying) {
				let underlyingF = minfo.Underlying.F;
				let underlyingS = minfo.Underlying.S;
				let include_U = underlyingF.indexOf("_U") != -1;
				return !include_U && underlyingF===underlyingS;
			}
		},
		/** 將期貨品種代碼轉為合約代碼(使用熱門月)，同時支持帶入合約代碼情境 */
		toContractID(sid) {
			let tmp = sid.split('.');
			if (tmp[1] === 'F') {
				if (tmp.length !== 4)
					return sid;
				return this.toMonthSymbol(`${sid}.HOT`);
			}
			return sid;
		},
		// 取選擇權商品的履約價清單
		getStrikePriceList(sid) {
			let sidArr = sid.split('.');
			if(sidArr[1] != 'O') return [];
			// 交易所代碼
			let exgid = this.getExchangeName(sid);
			// 商品月份
			let month = sidArr[4];
			// 商品代碼
			let symbol = sidArr[3];
			// 除權息商品
			if(symbol.slice(-1)[0] == 'A')
				symbol = symbol.slice(0, -1);
			let exgNode = this.getExgNodeByExgId("OPT", exgid);
			let list = [];
			exgNode.Node.forEach(Item=>{
				Item.Node.forEach(Month=>{
					if(Month.Node && Month.Node[0].SYMBOL == symbol && Month.ENG == month && Month.Node[0].Contracts)
						list = Month.Node[0].Contracts;
				});
			});
			return list;
		},
		// 是否為期貨價差商品代碼(依rudy的建議:1.可以觀察行情Type欄位 tp=205xx 為期貨價差2.如果要從id直接判斷，第二欄是F，以"."切字中長度=7)
		isPriceDiff_FutSymbol(sid) {
			if(!sid) return;
			// 以第2點建議方式做判斷
			let sidArray = sid.split('.');
			return sidArray[1] == 'F' && sidArray.length == 7;
		},
		// 合併分類表
		mergeClassification() {
			try {
				this.mergeSetting.forEach(obj=>{
					let list = [];
					obj.from.forEach(classificationName=>{
						list = list.concat(this.classification[classificationName]);
					});
					this.classification[obj.to] = list;
				});
			}catch(err){}
		},
		// 此合約是否為週期商品 (thomas: 只有 TWF.MX1,MX2,MX4,MX5)
		isWeeklySymbol(sid) {
			let sids = sid.split('.');
			if (sids[2] === 'TWF') {
				switch (sids[3]) {
					case 'MX1':
					case 'MX2':
					case 'MX4':
					case 'MX5':
						return true;
				}
			}
		},
		/** 判別此商品代碼是否為 期貨 商品 */
		isFut(sid){return sid.indexOf('I.F') >= 0;},
		/** 判別此商品代碼是否為 Option 商品 */
		isOpt(sid){return sid.indexOf('I.O') >= 0;},
		/** 判別此商品代碼是否為 證券 商品 */
		isStk(sid){return sid.indexOf('I.S') >= 0;},
		// 判斷是否為台灣交易所
		isTWF(sid) {
			let minfo = this.getMainformInfo(sid);
			return minfo.Exchange === "TWF";
		},
		
	},
	watch: {
		// 所有分類表已到達
		mainformArrive(nv) {
			if (nv) {
				// 合併分類表
				this.mergeClassification();
				// 宣布總表完成
				this.$store.state.status.mainformReady = true;
			}
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 暫時直接判斷 TW 固定支持分數 (未來若要區分再拉至pdsetting)
		supportDeno() {
			return this.twMode;
		},
		// 暫時直接判斷 TW 固定支持乘數 (未來若要區分再拉至pdsetting)
		supportMult() {
			return this.twMode;
		},
		projectID() {
			return this.$store.state.config.projectID;
		},
		mainformArrive() {
			return this.$store.state.status.mainformArrive;
		},
		mergeSetting() {
			try{return this.$store.state.config.quotePdSetting.classification.merge;}catch(err){}
		},
		optClassificationKey() {
			// 設定位置對齊於 futures_classification
			try{return vuex.config.quotePdSetting.classification.optiont_classification;}catch(e){};
			// 保留以向前相容
			try{return vuex.config.publicPdSetting.CONFIG.OptionClassification;}catch(e){};
		},
		// 指定特定合約使用指定的Ticksize
		overwriteTickSize() {
			try{return vuex.config.publicPdSetting.function.overwriteTickSize;}catch(e){};
		},
	},
}
</script>
