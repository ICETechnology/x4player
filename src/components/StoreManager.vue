<template>
    <div class="store-manager" v-show="false">
		<span>{{tp}}</span>
		<span>{{ntp}}</span>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		console.log('StoreManager.beforeMount');
		// Main.vue 的 beforeMount 時間點 (登入完成後)
		eventBus.$on("MAIN_BEFORE_MOUNT", this.onMainBeforeMount);
		// 啟動需要執行 (可晚於 Config.xxx.vue 的)
		this.initLanguage();
		// 從設定檔取得預設 Layout (預設用第一個)
		if (this.CONFIG.LAYOUT) {
			let firstLayoutKey = Object.keys(this.CONFIG.LAYOUT)[0];
			this.$store.state.layout = this.CONFIG.LAYOUT[firstLayoutKey].layout;
		}

		/** ========== 由此設定希望 vuex 要 [自動儲存/讀取] from LocalStorage 的變數 ========== */
		/** device id */
		this.restore("device>deviceID");
		this.restore("device>bundleDevice", "object");
		this.restore("device>macAddress");
		this.restore("device>orginDeviceID");

		this.restore("device>screenShotProtect", "boolean");
		/** SIM */
		this.restore("sim>wechatUnionid");
		this.restore("sim>phoneNumber");
		this.restore("sim>thirdPartyType");
		/** 語系 */
		this.restore("lang>language");
		/** 是否顯示標題列的權益數資料 */
		this.restore("status>displayHeadMargin", "boolean");
		/** 呈現 JSTest 工具列 */
		this.restore("jstest>display", "boolean");
		/** 當前交易所代碼 */
		this.restore("selectedSymbol>ID");
		/** 即時走勢是否被選取 */
		this.restore("Kchart>TChart", "boolean");
		/** 技術分析選在幾分K上 */
		this.restore("Kchart>NK");
		/** 技術分析選在哪個指標上 */
		this.restore("Kchart>Idc");
		/** 持倉線顯示 */
		this.restore("Kchart>showPosLine", "boolean");
		/** 委託單線顯示 */
		this.restore("Kchart>showWorkingLine", "boolean");
		this.restore("Kchart>config>MA", "object");
		this.restore("Kchart>config>BBAND", "object");
		this.restore("Kchart>config>SAR", "object");
		this.restore("Kchart>config>ichimoku", "object");
		this.restore("Kchart>config>RSI", "object");
		this.restore("Kchart>config>KD", "object");
		this.restore("Kchart>config>MACD", "object");
		this.restore("Kchart>config>ATR", "object");
		this.restore("Kchart>config>DMI", "object");
		this.restore("Kchart>drawLineData", "object");
		this.restore("thunder", "object");
		// 市價轉交易
		this.restore("convertMarketPrice", "object");
		// 新功能展示 Tooltip 功能
		this.restore("tooltips>passMap", "object");
		/** 當前交易所代碼 */
		this.restore("status>quoteTabID");
		/** 設定回報音效開關 */
		this.restore("config>soundEffect", "boolean");
		/** 設定動線音效開關 */
		this.restore("config>fllowEffect", "boolean");
		/** 設定資料音效開關 */
		this.restore("config>dataEffect", "boolean");
		/** 設定下單盒greeks開關 */
		this.restore("config>orderBlockGreeks", "boolean");
		/** 問題回報提醒延遲時間 */
		this.restore("config>feedbackDelayTime", "number");
		/** 下單盒模式 (0:普通, 1:高級) */
		this.restore("config>orderBoxMode", "number");
		/** 持倉加入關注列表(true: 是, false: 否) */
		this.restore("config>posListAddToFocusList", "boolean");
		/** 音效設定 */
		this.restore("config>advanceEffectSetting", "object");

		this.restore("config>normalPositionTable_sortKey");
		this.restore("config>normalPositionTable_sortDesc", "boolean");
		/** 行情報價使用元件 */
		this.restore("config>quoteComponentClass");
		/** 使用手势锁 */
		this.restore("config>enablePatternLock", "boolean");
		/** 強制指定交易連線主機 */
		this.restore("config>forceTradeHost");
		/** 強制指定交易連線主機 */
		this.restore("config>inputType");
		/** 顯示字型(預設/大字型) */
		this.restore("config>largeSize","boolean");
		/** 顯示大字型提示 */
		this.restore("config>showLargeNotice","boolean");
		/** 商品连动范围 (layout: 版面内, system: 全系统) */
		this.restore("config>syncMode");
		/** 文章內文字體大小 */
		this.restore("config>articleContentFontSize");
		/** 雲端洗價同意書簽署時間 */
		this.restore("config>smoSignedDate", "number");
		/** 同意雲端條件單版本號 */
		this.restore("config>localSmoAgreementVersion");
		/** 雲端洗價警示發送 email */
		this.restore("config>smoAlertEmail", null, null, true);
		/** 以對手價計算損益 */
		this.restore("config>profitByOpposite","boolean");
		/** 帳務版面最後停留的功能 */
		this.restore("status>rightsTabID");
		/** 設定下單確認開關 */
		this.restore("order>confirm", "boolean");
		/** 閃電下單確認開關 */
		this.restore("thunder.settings.other.orderConfirm", "boolean");
		/** 行情快速下單UI買方報價 */
		this.restore("order>fastOrderBuy");
		/** 行情快速下單UI賣方報價 */
		this.restore("order>fastOrderSell");
		/** 設定期貨下單預設數量 */
		this.restore("order>futQty", "number");
		/** 設定選擇權下單預設數量 */
		this.restore("order>optQty", "number");
		/** 設定證券下單預設數量 */
		this.restore("order>stkQty", "number");
		/** 設定下單最大數量 */
		this.restore("order>maxQty", "number");
		/** 設定期貨自動拆單數量 */
		this.restore("order>futSplitQty", "number");
		/** 設定選擇權自動拆單數量 */
		this.restore("order>optSplitQty", "number");
		/** 設定證券自動拆單數量 */
		this.restore("order>stkSplitQty", "number");
		/** 超價跳數 */
		this.restore("order>overJump", "number");
		/** 反手預設價格別 */
		this.restore("order>oppositeFlag");
		/** 反手價格加掛跳數 */
		this.restore("order>oppositeJump", "number");		
		/** 上期所、INE平仓设定 */
		this.restore("order>closeShfeIne");
		/** GTC 天數 */
		this.restore("order>inputGtcDays", "number");
		/** 以一定範圍市價送出 */
		this.restore("order>useRangeMarket", "boolean");
		// 下單後重設買賣
		this.restore("order>resetBS", "boolean");
		// 下單後重設口數
		this.restore("order>resetQty", "boolean");
		// 下單後重設價格
		this.restore("order>resetPrice", "boolean");
		// 下單後關閉下單盒
		this.restore("order>closeOrderBox", "boolean");
		/** 期權T各月份展開個數 */
		this.restore("opt>expandCnt");
		/** 期權報價預設欄位 (在 opt>columns 之前) */
		this.$store.state.opt.defaultColumns = [...this.$store.state.opt[this.optColumnsID]];
		/** 期權T各商品各月份是否展開 */
		this.restore("opt>expandMap", "object");
		this.restore("opt>selectedSymbol");
		this.restore(`opt>${this.optColumnsID}`, "object");
		this.restore("opt>reverse", "boolean");
		this.restore("opt>displayPRIADJ", "boolean");
		/** 各類資料是否要列印 */
		this.restore("logConsole", "object");
		/** 新手教學 */
		this.restore("helper", "object");
		/** 自選群組 */
		// 自選群組已經由 M4C.SelfGroup 決定 Key 以及存取，所以用不到這邊
		// this.restore("data>ssgList");
		/** 多交易帳號機制 */
		this.restore("loginedBTOList", "object", {deep: true}, true);
		/** 自動確認結算單 */
		this.restore("autoConfirmSettlement", "object");
		/** 持倉顯示逐日盈虧/逐筆盈虧 */
		this.restore("position>dailyPL", "boolean");
		/** 保持恒亮 (不进入休眠) */
		this.restore("config>keepAwake", "boolean");
		/** 進階搜尋頁簽index */
		this.restore("searchPlus>tabIndex", "number");
		/** 行情卡片類型 */
		this.restore("config>quoteStyle");
		/** 表格排序 方式 */
		this.restore("tableX>sortBy");
		/** 表格排序 索引 */
		this.restore("tableX>sortKey");
		/** 公告彈出通知時間 */
		this.restore("status>announcePopupTime");
		/** 憑證 */
		this.restore("cert", "object", {deep: true}, true);
		// 記憶密碼 (tw only)
		this.restore("login>keepPassword", "boolean");
		// 記憶身分證號 (tw only)
		this.restore("login>keepAccount", "boolean");
		// 最後選擇幣別
		this.restore("status>selectedCurrency");
		// 快速登入
		this.restore("securityLogin", "object", {deep: true});
		// 關閉快速登入介面
		this.restore("status>closeSecurityLock", "boolean");
		// 是否不再提醒啟用快速登入
		this.restore("status>isNotRemindSecurityLock", "boolean");

		this.restore("data>sciChartSmileCurveDefaultQty", "number");
		// 自選localStorage最後更新時間
		this.restore("config>ssgListUpdateTime");
		/** 夜盤顯示時間紀錄 */
		this.restore("status>showAfterhoursTime", "number");
		/** 桌機版 only */
		if (this.isDesktop) {
			// 檢查此 key 是否需要被強制清除
			this.checkStorageVersion(`${this.$store.state.config.projectID}_Desktop_Layout`, this.$store.state.desktop.layoutV);
			this.checkStorageVersion(`${this.$store.state.config.projectID}_$STORE_desktop>quoteColumns`, this.$store.state.desktop.quoteColumnsV);
			this.checkStorageVersion(`${this.$store.state.config.projectID}_$STORE_desktop>reportColumns`, this.$store.state.desktop.reportColumnsV);
			this.checkStorageVersion(`${this.$store.state.config.projectID}_$STORE_desktop>positionColumns`, this.$store.state.desktop.positionColumnsV);
			// 報價/回報/持倉預設欄位
			this.$store.state.desktop.quoteDefaultColumns = [...this.$store.state.desktop.quoteColumns];
			this.$store.state.desktop.reportDefaultColumns = [...this.$store.state.desktop.reportColumns];
			this.$store.state.desktop.positionDefaultColumns = [...this.$store.state.desktop.positionColumns];

			/** 字體等級 */
			this.restore("desktop>fontSizeRatio", "number");
			/** 字體套用至全部版面 */
			this.restore("desktop>fontSizeToAll", "boolean");
			/** 行情欄位設定 */
			this.restore("desktop>quoteColumns", "object");
			/** 回報欄位設定 */
			this.restore("desktop>reportColumns", "object");
			/** 持倉欄位設定 */
			this.restore("desktop>positionColumns", "object");
		}
		// 已同意的同意書
		this.restore("config>confirmAgreement");

		for (let key in this.mapOrderTypeLabel) {
			this.mapOrderTypeLabel[key] = this.$ln(this.mapOrderTypeLabel[key]);
		}
	},
    mounted() {
		// sync [rightsTabName] by rightsTabID
		this.updateRightsTabName();
		// 螢幕不進入休眠
		if (window.powerManagement && this.$store.state.config.keepAwake)
			window.powerManagement.acquire();
		// deviceID 已經提早至 initialScreen.js 建立，這邊應繼承使用 window.deviceID 即可
		if (!this.$store.state.device.deviceID)
			this.$store.state.device.deviceID = window.deviceID || localStorage.getItem(`${window.projectID}_$STORE_device>deviceID`) || ''.random(32);
		// 列印關於 localStorage 相關資訊
		try{console.log('localStorage size : ', (JSON.stringify(localStorage).length/1024).toFixed(2) + 'KB');}catch(e){}
		console.log('window.projectID : ', window.projectID);
		console.log('$store.state.config.projectID : ', this.$store.state.config.projectID);
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 從 localStorage 還原該變數值，並且監聽變動存回 localStorage
		// param : 帶入 $store.watch 的參數 ex. {deep: true} 可支持深度監聽
		// compress 是否要壓縮 ex. loginedBTOList 內容包含帳號會有弱掃問題，所以要帶 true 進行壓縮
		restore(key, type, param, compress) {
			let storageKey = `${this.$store.state.config.projectID}_$STORE_${key}`;
			let getItemMethod = compress ? 'getItemWithDecompress' : 'getItem';
			let setItemMethod = compress ? 'setItemWithCompress' : 'setItem';
			let val = localStorage[getItemMethod](storageKey);
			let keys = key.split('>');
			// 有儲存值才處理 (無儲存值時使用 store.js 裡的預設值)
			if (val != null) {
				switch(type) {
					case 'boolean':
						val = val=="true" || val==1;
						break;
					case 'number':
						val = Number(val);
						break;
					case 'object':
						try {
							val = JSON.parse(val) || {};
						} catch(e) {
							val = {};
						}
						break;
				}
				if (keys.length === 2) {
					this.$store.state[keys[0]][keys[1]] = val;
				}
				else if (keys.length === 3){
					this.$store.state[keys[0]][keys[1]][keys[2]] = val;
				}
				else if (keys.length === 1 && type === 'object'){
					let obj = this.$store.state[keys[0]];
					for (let objKey in val){
						// 需以 $set 方式保證內容為響應式
						this.$set(obj, objKey, val[objKey]);
					}
				}
				else
					this.$store.state[key] = val;
			}
			// 需by貼牌給預設值
			else if(val == null) {
				let obj = this.$store.state[keys[0]];
				switch(key){
					case "status>displayHeadMargin":
						// 取貼牌設定值或vuex預設值。
						let defaultHeadMargin = this.CONFIG.DEFAULT_HEADMARGIN || this.$store.state.status.displayHeadMargin;
						this.$set(obj, keys[1], defaultHeadMargin);
						break;
					default:
						break;
				}
				
			}
			// 動態監聽該變數，異動時寫入 localStorage
			this.$store.watch((state, getters) => {
					if (keys.length === 2)
						return state[keys[0]][keys[1]];
					else
						return state[key];
				}, (nv, ov) => {
					try {
						nv = this.checkStoreData(key, nv);
						if (typeof(nv) === "object")
							nv = JSON.stringify(nv);
						if (nv === "null")
							localStorage.removeItem(storageKey);
						else {
							localStorage[setItemMethod](storageKey, nv);
						}
					}
					catch(e) {}
				}, param);
		},
		// 檢查要儲存的資料
		checkStoreData(key, data) {
			switch(key) {
				case 'loginedBTOList':
					// 不可儲存原始密碼 (不可直接移除 nv 裡的 traderPwd 以免造成 trader.login 時找不到而密碼錯誤)
					let clone = JSON.parse(JSON.stringify(data));
					clone.forEach(o=>delete o.traderPwd);
					return clone;
			}
			return data;
		},
		// Main.vue 的 beforeMount 時間點 (登入完成後)
		onMainBeforeMount() {
			// vuex 設定當前交易所名稱
			let defaultExgID = this.$store.state.status.quoteTabID || M4C.Symbol.firstFExgID;
			this.$store.commit('setQuoteTabID', defaultExgID);
			// vuex 設定當前商品名稱
			this.$store.commit("setSelectedSymbol", this.$store.state.selectedSymbol.ID);
			// 支持 project 設定 帳務預設的幣別
			this.$store.state.status.rightsTabID = this.$store.state.status.rightsTabID || this.CONFIG.RIGHTS_TAB_DEFAULT_CURRENCY || "***";
		},
		/** 用 rightsTabID 對出 rightsTabName */
		updateRightsTabName() {
			let rightsTabID = this.$store.state.status.rightsTabID;
			if (this.$store.state.config.currencyMap[rightsTabID])
				this.$store.state.status.rightsTabName = this.$store.state.config.currencyMap[rightsTabID].label;
			else if (rightsTabID === "Warrant")
				this.$store.state.status.rightsTabName = this.$ln(`备兑锁定与解锁`);
			else if (rightsTabID === "ExerciseRecord")
				this.$store.state.status.rightsTabName = this.$ln(`行权记录`);
		},
		/** 語系設定 */
		initLanguage() {
			// 需對應 store.js 儲存的內容
			let storageKey = `${this.$store.state.config.projectID}_$STORE_lang>language`;
			// 偵測瀏覽器語系
			let lang = navigator.language || (navigator.languages ? navigator.languages[0] : "") || window.navigator.browserLanguage || window.navigator.userLanguage || "";
			// zh-cn/zh-CN 視為 zh
			lang = lang.toLowerCase() === "zh-cn" ? "zh" : lang;
			// zh-tw/zh-TW 視為 zh-TW
			lang = lang.toLowerCase() === "zh-tw" ? "zh-TW" : lang;
			// 非 en/zh-TW -> 預設為 zh (簡中)
			lang = lang != "en" && lang != "zh-TW" ? "zh" : lang;
			// 若設定檔有設定預設的語系時，使用預設的語系 > 瀏覽器語系
			if (this.CONFIG.DEFAULT_LANGUAGE)
				lang = this.CONFIG.DEFAULT_LANGUAGE;
			// 優先使用 localStorage 裡的 (最後的設定)
			if (localStorage.getItem(storageKey) == null)
				localStorage.setItem(storageKey, lang);
			// 再次從 localStorage 取出
			lang = localStorage.getItem(storageKey);
			// 設定到 vuex
			this.$store.commit("setLanguage", lang);
		},
		checkStorageVersion(storageKey, v) {
			if (localStorage.getItem(storageKey+'V') != v) {
				localStorage.removeItem(storageKey);
				localStorage.setItem(storageKey+'V', v);
			}
		},
	},
	watch: {
		// 持倉變化時，需要重新過濾出當前關注商品的部位變數
		positionSumList() {
			let sid = this.$store.state.selectedSymbol.ID;
			this.$store.state.selectedSymbol.positionSum = this.$store.state.data.normalPositionSumList.find(pos => pos.SYMBOL == sid) || {};
		},
		// 帐务版面功能名稱
		rightsTabID(nv) {
			this.updateRightsTabName();
		},
		advanceEffectSetting:{
			handler(nv, ov) {
				localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_config>advanceEffectSetting`, JSON.stringify(nv) || "");	
			},
			deep: true
		},
		kChartConfig:{
			handler(nv, ov) {
				for(let key in nv){
					localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_Kchart>config>${key}`, JSON.stringify(nv[key]) || "");
				}
			},
			deep: true
		},
		kChartDrawLineData:{
			handler(nv, ov) {
				localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_Kchart>drawLineData`, JSON.stringify(nv) || "");
			},
			deep: true
		},
		thunderConfig:{
			handler(nv, ov) {
				localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_thunder`, JSON.stringify(nv));
			},
			deep: true
		},
		convertMarketPrice:{
			handler(nv, ov) {
				localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_convertMarketPrice`, JSON.stringify(nv));
			},
			deep: true
		},
		'$store.state.logConsole': {
			handler(nv, ov) {localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_logConsole`, JSON.stringify(nv));},
			deep: true
		},
		/** 自動確認結算單 : 動態新增的 key:value 也需要被偵測 & 自動儲存結果 */
		autoConfirmSettlement: {
			handler(nv, ov) {
				localStorage.setItem(`${vue.$store.state.config.projectID}_$STORE_autoConfirmSettlement`, JSON.stringify(nv));
			},
			deep: true
		},
		/** tp 表示允許委託類型 (正面表列，有 tp 時表示全關，僅 tp 內容開啟) */
		tp(nv) {
			// isSIM or 同時無 tp/ntp 時，恢復預設
			if (this.$store.state.login.isSIM || (!this.tp && !this.ntp)) {
				this.$store.state.login.isStock = true;
				this.$store.state.login.isOption = true;
				this.$store.state.login.isStockOption = true;
				return;
			}
			if (!Array.isArray(nv))
				return;
			let isStock = false;
			let isFut = false;
			let isOption = false;
			let isStockOption = false;			
			nv.forEach((item)=>{
				// 萬位數 3 & 個位數 5 表示為股票期權
				if (parseInt(item/10000) === 3 && item%10 === 5)
					isStockOption = true;
				// 萬位數 1 = 證券
				if (parseInt(item/10000) === 1)
					isStock = true;
				// 萬位數 2 = 期貨
				if (parseInt(item/10000) === 2)
					isFut = true;
				// 萬位數 3 = 選擇權
				if (parseInt(item/10000) === 3)
					isOption = true;
			});
			this.$store.state.login.isStock = isStock;
			this.$store.state.login.isFut = isFut;
			this.$store.state.login.isOption = isOption;
			this.$store.state.login.isStockOption = isStockOption;
		},
		/** ntp 表示不允許委託類型 (負面表列，有 ntp 時表示全開，僅 ntp 內容關閉) */
		ntp(nv) {
			// isSIM or 同時無 tp/ntp 時，恢復預設
			if (this.$store.state.login.isSIM || (!this.tp && !this.ntp)) {
				this.$store.state.login.isStock = true;
				this.$store.state.login.isOption = true;
				this.$store.state.login.isStockOption = true;
				return;
			}
			if (!Array.isArray(nv))
				return;
			let isStock = true;
			let isFut = true;
			let isOption = true;
			let isStockOption = true;
			nv.forEach((item)=>{
				// 萬位數 3 & 個位數 5 表示為股票期權
				if (parseInt(item/10000) === 3 && item%10 === 5)
					isStockOption = false;
				// 萬位數 1 = 證券(10000代表所有證券類型商品，不允許委託)
				if (item == 19999)
					isStock = false;
				if (item == 29999)
					isFut = false;
				// 萬位數 3 = 選擇權 (30000代表所有期權類型商品，不允許委託)
				if (item == 39999)
					isOption = false;
			});
			this.$store.state.login.isStock = isStock;
			this.$store.state.login.isFut = isFut;
			this.$store.state.login.isOption = isOption;
			this.$store.state.login.isStockOption = isStockOption;
		},
		'$store.state.config.keepAwake'(nv) {
			// 螢幕不進入休眠
			if (window.powerManagement) {
				if (nv)
					window.powerManagement.acquire();
				else
					window.powerManagement.release();
			}
		},
		/** 暫時禁止 click 事件 500ms */
		'$store.state.status.lockClick'(nv) {
			if (nv) setTimeout((self)=>{self.$store.state.status.lockClick = false;}, 500, this);
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		optColumnsID() {
			return this.twMode ? 'columnsV3' : 'columnsCN';
		},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		positionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		rightsTabID() {
			return this.$store.state.status.rightsTabID;
		},
		/** 來自專案 Config.vue 的內容 */
		CONFIG() {
			return this.$store.state.config.CONFIG;
		},
		advanceEffectSetting(){
			return this.$store.state.config.advanceEffectSetting;
		},
		kChartConfig(){
			return this.$store.state.Kchart.config;
		},
		kChartDrawLineData() {
			return this.$store.state.Kchart.drawLineData;
		},
		thunderConfig(){
			return this.$store.state.thunder;
		},
		convertMarketPrice() {
			return this.$store.state.convertMarketPrice;
		},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
		/** 自動確認結算單 */
		autoConfirmSettlement() {
			return this.$store.state.autoConfirmSettlement;
		},
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		tp() {
			try {return this.acPdSetting.broker.tp;}catch(err){}
		},
		ntp() {
			try {return this.acPdSetting.broker.ntp;}catch(err){}
		},
		mapOrderTypeLabel() {
			return this.$store.state.config.mapOrderTypeLabel;
		},
	},
}
</script>

<style scoped>
</style>