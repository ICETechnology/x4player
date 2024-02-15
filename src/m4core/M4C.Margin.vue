<template>
    <div class="m4c-margin hidden" />
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	data() {
		return {
			/** 用以將整個 object 轉響應式物件 */
			rightsObj: {},
			/** requestID to baID */
			ridToBAID: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Margin = this.$store.state.m4c.margin = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.rights', 'callback': this.onMarginData.bind(this)});
		// 夜盤查詢
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.rights.afterhours', 'callback': this.onMarginAfterHoursData.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'margin.rate.query', 'callback': this.onMarginRateData.bind(this)});
		// 台灣版查詢商品保證金
		M4C.regDispatch({'s': 'TRADE', 'c': 'margin.query', 'callback': this.onMarginAmountData.bind(this)});
	},
    methods: {
		/** 啟始化資金資料 */
		initMargin(param) {
			if (!this.baID) return;
			let result = this.$store.state.result.queryMarginResult = this.baseQuery(`${this.baID}|account.rights`, param);
			this.$set(result, 'marginData', this.$store.state.data.marginData = {});
			return result;
		},
		// 查詢資金資料
		queryMargin(param) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.initMargin(param);
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'account.rights';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
			return result;
		},
		// 查詢夜盤資料
		queryAfterhoursMargin(param) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.baseQuery(`${this.baID}|account.rights.afterhours`, param);
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'account.rights.afterhours';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
			return result;
		},
		// 查詢保證金比率資料
		queryMarginRate(SYMBOL) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.$store.state.result.queryMarginRateResult = this.baseQuery(`${this.baID}|margin.rate.query`, SYMBOL);
			this.$set(result, 'marginRateData', this.$store.state.data.marginRateData = {});
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'margin.rate.query';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.BROKER_ID = this.brokerID;
			cmd.d.SYMBOL = SYMBOL;
			M4C.send(cmd);
			return result;
		},
		// 查詢商品保證金(tw)
		queryMarginAmount(SYMBOL) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.$store.state.result.queryMarginAmountResult = this.baseQuery(`${this.baID}|margin.query.amount`, SYMBOL);
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'margin.query';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.BROKER_ID = this.brokerID;
			cmd.d.TRADER_ID = this.traderID,
			cmd.d.SYMBOL = SYMBOL;
			M4C.send(cmd);
			return result;
		},
		// 收到資金資料
		onMarginData(data) {
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = this.baseOnTradeData(`${baID}|account.rights`, data);
			// 僅處理當前關注子帳
			if (baID === this.baID && (data.d.RIGHTS || data.d.RIGHTS_OB)) {
				let rightsMap = this.rightsArrayToMap(data);
				// 判斷查詢是否是夜盤
				const marginData = this.marginData;
				for (let currency in rightsMap) {
					let rightsObj = Object.assign(
						marginData[currency] || {},
						rightsMap[currency]
					);
					this.extendColumn(rightsObj);
					this.$set(marginData, currency, this.rightsObj = rightsObj);
				}
				// 優先取用 pdsetting.display.currency_order，未設定時則使用 server 吐出來的幣別內容轉的列表
				this.$store.state.server.marginCurrencyList = this.pdsettingCurrencyOrder || Object.keys(this.marginData);
				// 當前使用幣別
				this.$store.state.status.selectedCurrency = this.$store.state.status.selectedCurrency || this.$store.state.server.marginCurrencyList[0];
				// 資金沒有送 lt:true，收到資料就當作 query 完成
				this.baseResultDone(result);
				// 資料更新時間
				this.$store.state.status.marginUpdateTime = data.d.UPDATE_TIME ? new Date(data.d.UPDATE_TIME) : new Date();
			}
		},
		onMarginAfterHoursData(data){
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = this.baseOnTradeData(`${baID}|account.rights.afterhours`, data);
		},
		// 收到保證金比率資料
		onMarginRateData(data) {
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = this.baseOnTradeData(`${baID}|margin.rate.query`, data);

			// 僅處理當前關注子帳
			if (baID === this.baID && data.d.SYMBOL) {
				this.$store.state.data.marginRateData = data.d;
				// 資金沒有送 lt:true，收到資料就當作 query 完成
				// this.baseResultDone(result);
			}
		},
		// 收到商品保證金資料
		onMarginAmountData(data) {
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = this.baseOnTradeData(`${baID}|margin.query.amount`, data);
			// 僅處理當前關注子帳
			if (baID === this.baID && data.d.SYMBOL) {
				this.$store.state.data.marginAmountData = data.d;
			}
		},
		// 扩增便利性栏位
		extendColumn(rightsObj) {
			let val = +Big(rightsObj.BEGIN_BALANCE || 0).plus(rightsObj.FUND_TRANS || 0);
			this.$set(rightsObj, '$STATIC_BALANCE', val);
			// pdsetting 無法使用 $，改用 _ 替代
			this.$set(rightsObj, '_STATIC_BALANCE', val);
		},
		// 將原始資料的 array 型態轉為 object map
		rightsArrayToMap(data) {
			let rightsMap = {};
			if (data.d.RIGHTS) {
				data.d.RIGHTS.forEach((obj)=>{
					rightsMap[obj.CURRENCY] = obj;
				});
			}
			if (data.d.RIGHTS_OB) {
				data.d.RIGHTS_OB.forEach((obj)=>{
					rightsMap[`OB-${obj.CURRENCY}`] = obj;
				});
			}
			return rightsMap;
		},
	},
	watch: {
		/** 資金帳號切換 -> 重查 */
        btaID(nv, ov){
            // 有切換帳號才重查，新登入不處理(交由loginReady時執行)。
            if(ov && nv != ov)
                this.queryMargin();
		},
		// 總表完成 && 登入完成
		mainformReadyAndLoginReady(nv) {
			if (nv)
				this.queryMargin({first: true});
			else
				this.$store.state.data.marginData = {};
		},
		// 幣別 Option 列表
		marginCurrencyList(nv) {
			// 當前帳務按鈕的狀態屬於某個幣別 (排除: 備兌 etc...)
			if (this.$store.state.config.currencyMap[this.rightsTabID]) {
				// 若 server 來的資金所有幣別未包含本地選擇的幣別時，主動切換至資金第一個幣別
				if (nv.length > 0 && nv.indexOf(this.rightsTabID) === -1)
			 		this.$store.state.status.rightsTabID = nv[0];
			}
			// 將國內與國外分開排序後，再組起來
			let inList = nv.filter(o=>o.indexOf('OB-')===-1);
			let obList = nv.filter(o=>o.indexOf('OB-')!==-1);
			inList = inList.sort((a,b)=>{return a > b ? 1 : -1;});
			obList = obList.sort((a,b)=>{return a > b ? 1 : -1;});
			let currencyList = [].concat(inList).concat(obList);

			// 由於 SingleSelect 支持把第一個值塞回 v-model 變數，製作 option list 時，要同步把 selected 塞進去，否則 SingleSelect 會把第一個選項填回 v-model 變數，導致非預期的異常
			this.$store.state.status.currencyOptionList = currencyList.map((obj)=>{
				let result = {value: obj, selected: obj===this.$store.state.status.selectedCurrency};
				if (obj.indexOf('OB-')!==-1) {
					result.label = obj.indexOf("***")!==-1 ? "國外 基幣" : `國外 ${obj.replace('OB-','')}`;
				}
				else {
					result.label = (this.twMode ? "國內 " : "") + (obj==="***" ? "基币" : obj);
				}
				return result;
			});
		},		
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		baID() {
			return this.$store.state.login.baID;
		},
		btaID() {
			return this.$store.state.login.btaID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
		traderID() {return this.$store.state.login.traderID;},
		mainformReadyAndLoginReady() {
			return this.$store.state.status.mainformReady && this.$store.state.selectedWSConn.loginReady;
		},
		marginData() {
			return this.$store.state.data.marginData;
		},
		afterhoursMarginData(){
			return this.$store.state.data.afterhoursMarginData;
		},
		/** 從 pdsetting 上設定的 幣別顯示順序清單 */
		pdsettingCurrencyOrder() {
			try {return this.$store.state.config.tradePdSetting.display.currency_order;}catch(e){}
		},
		/** 從 server 來的資金所包含的幣別 ex. ["CNY", "USD", ...] */
		marginCurrencyList() {
			return this.$store.state.server.marginCurrencyList;
		},
	},
}
</script>
