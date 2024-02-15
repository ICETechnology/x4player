<template>
    <div class="m4c-order hidden" />
</template>

<script>
export default {
	props: [],
	data() {
		return {
			orderInfo: null,
			// 委託無回應機制的 Timeout Map
			mapRKeyToOrderTimeout: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Order = this.$store.state.m4c.order = this;
		// 註冊資料分派 - 委託
		M4C.regDispatch({'s': 'TRADE', 'c': 'order', 'callback': this.onOrderData.bind(this)});
		// 註冊資料分派 - 即時回報
		M4C.regDispatch({'s': 'TRADE', 'c': 'report', 'callback': this.onRealtimeReport.bind(this)});
	},
    methods: {
		// 收到委託資料
		onOrderData(data) {
			let self = this;
			let qrKey = data.r;
			let dataD = data.d;
			// 委託直接回應失敗
			if (data.cd < 0 && dataD && dataD.USER_DATA) {
				// 移除委託無回應Timeout
				let rkey = dataD.USER_DATA.rkey || "";
				this.clearOrderTimeout(rkey);
				// 委託失敗提示
				this.$store.state.notify({
					icon: `error`,
					head: `委托失败`,
					body: `(${data.$CD}) ${data.$MSG}`,
				});
			}
		},
		// 收到即時回報資料
		onRealtimeReport(dataObj) {
			let rkey = "";
			if (dataObj && dataObj.d && dataObj.d.USER_DATA) {
				rkey = dataObj.d.USER_DATA.rkey || "";
			}
			// 移除委託無回應Timeout
			this.clearOrderTimeout(rkey);
		},
		/** 移除委託無回應Timeout (PS.無委託權限=>不提示委託無回應) */
		clearOrderTimeout(rkey) {
			if (rkey) {
				let orderTimeout = this.mapRKeyToOrderTimeout[rkey];
				if (orderTimeout) {
					console.log("M4C.Order clearOrderTimeout by rkey :", rkey);
					clearTimeout(orderTimeout);
				}
				delete this.mapRKeyToOrderTimeout[rkey];
			}
		},
		// 上期所、上海國際能源交易中心平倉(依設定調整參數)
		checkShfeOrIneClose(){
			if(this.isCloseShfeOrIne){
				if(this.isOCO) {
					this.orderInfo.OCO[0].POSITION_EFFECT = this.$store.state.order.closeShfeIne;
					this.orderInfo.OCO[1].POSITION_EFFECT = this.$store.state.order.closeShfeIne;
				}
				else
					this.orderInfo.POSITION_EFFECT = this.$store.state.order.closeShfeIne;
			}
			this.orderInfo.OFFSET_PREFER = this.$store.state.order.closeShfeIne === 'PCTD' ? 'TODAY' : 'YESTERDAY';
		},
		// 送出委託
		sendOrder(orderInfo) {
			// 未登入交易帳號 -> 彈出登入交易帳號視窗
			if (!M4C.Trader.checkLoginTrade())
				return;
			let self = this;
			// 取得 當前/最後 的 orderInfo 物件
			// 各種需要 confirm 的情境，以 orderInfo.$passXXX 的作法來滿足
			orderInfo = this.orderInfo = orderInfo? this.$store.state.fn.$disObserver(orderInfo): this.orderInfo;
			// 檢查風控相關資料(口數大於限制、選擇權權利金小於手續費=> tw 需求)
			if(!this.riskCheck(orderInfo)) return;

			// 送出前檢查 : 檢查是否有下單權限 (by pdsetting.tp/ntp)
			if (!this.checkTpNtp(orderInfo)){
				this.$store.state.notify({
					type: `error`,
					head: `权限问题`,
					body: `本账号无法交易此商品`,
				});
				return;
			}
			
			// 優先平今/優先平昨 狀況處理
			this.checkShfeOrIneClose();

			// 支持市價轉設定價 (非 MARKET 也重新 GET 以正确清空 this.$store.state.order.convertMarketPrice)
			if (!this.twMode && this.orderInfo.ACTION === 'NEW')
				M4C.Order.getConvertMarketPrice(this.orderInfo);
			// 支持市價轉設定價
			if (!this.twMode && orderInfo.ACTION === 'NEW' && orderInfo.TC_ORDER_TYPE === 'MARKET') {
				let result = this.processConvertMarketPrice({orderInfo});
				if (!result) return;
			}

			if (M4C.Order.Split && M4C.Order.Split.shouldSplit(orderInfo))
				M4C.Order.Split.sendSplitOrder(orderInfo);
			else 
				self.doSend();
			return true;
		},
		// 風控相關檢查
		riskCheck(orderInfo) {
			if(!this.orderQtyCheck(orderInfo)) return false;
			if(!this.premiumCheck(orderInfo)) return false;
			return true;
		},
		/** 委託數量檢查(確認最大數量=>tw 需求)
		 * 	檢查委託數量是否超過最大限制(目前以單次總量判斷。不以拆單來優先處理，是為了防止下單最大數量漏洞) 
		 *  委託口數大於每筆最大數量時會中斷後續發送委託
		*/ 
		orderQtyCheck(orderInfo) {
			// 委託內容
			let orderInfo1 = orderInfo.OCO? orderInfo.OCO[0]: orderInfo;
			let result = orderInfo1.ORDER_QTY > this.$store.state.order.maxQty;
			// 大於最大限制，中斷後續發送，並彈出確認視窗
			if(result) {
				let self = this;
				// 延遲彈出訊息，避免被呼叫的組件誤關
				setTimeout(() => {
					eventBus.$emit("CONFIRM-DIALOG", {
						title: "下單數量超過限制",
						content: self.$ln("每筆最大數量({0})口").format(self.$store.state.order.maxQty),
						confirmOnly: true,
					});	
				}, 16);
			}
			return !result;
		},
		/** 權利金低於手續費確認(twf選擇權且委託價是否小於1)=>富邦需求(不確定其他tw卷商是否適用)
		 * 	twf選擇權且權利金低於手續費會彈出確認視窗，確認後才繼續發送委託。
		 */
		premiumCheck(orderInfo, noSend) {
			// OCO、複委託不檢查(需求沒提到要不要處理)，檢查過的也不處理
			if(!orderInfo.SYMBOL|| orderInfo.OCO || orderInfo.SYMBOL2 || orderInfo.$passPremiumCheck) {
				delete orderInfo.$passPremiumCheck;
				return true;
			}
			// 市價類型清單
			let marketList = ['MARKET', 'STOP', 'TSTOP', 'MIT', 'MWP'];
			// 台灣選擇權簡易確認
			let isTWFOpt = orderInfo.SYMBOL.indexOf('I.O.TWF') != -1;
			let orderPrice = orderInfo.ORDER_PRICE;
			let isNotMarketType = marketList.indexOf(orderInfo.TC_ORDER_TYPE) < 0;
			// 以非市價單且委託價格小於0來判斷
			let premiumSmallThenFee = orderPrice < 1 && isNotMarketType;
			// twf選擇權且權利金低於手續費。
			let result = isTWFOpt && premiumSmallThenFee;
			// 權利金低於手續費判斷成立，會彈出訊息視窗，且視情況中斷後續發送委託，
			if(result) {
				let self = this;
				// 延遲彈出訊息，避免被呼叫的組件誤關
				setTimeout(() => {
					eventBus.$emit("CONFIRM-DIALOG", {
						title: "特殊風險警示",
						content: self.$ln("權利金可能低於手續費"),
						confirm: () => {
							orderInfo.$passPremiumCheck = true;
							// 略過委託確認情境時，點確認再執行一次委託。
							if(!noSend)
								self.sendOrder(orderInfo)
						}
					});	
				}, 16);
			}
			return !result;
		},
		// 支持市價轉設定價
		processConvertMarketPrice({orderInfo}) {
			if (!this.orderConvertMarketPrice)
				return true;
			let orderType = this.orderConvertMarketPrice.orderType;
			// 調整 TIME_IN_FORCE
			orderInfo.TIME_IN_FORCE = this.orderConvertMarketPrice.timeInForce;
			// 調整 TC_ORDER_TYPE
			switch (orderType) {
				case 'LATEST':
				case 'UDLIMIT':
				case 'HIT':
				case 'JOIN':
					orderInfo.TC_ORDER_TYPE = 'LIMIT';
					break;
				case '5LvlMKT':
				case '5LvlMTL':
					orderInfo.TC_ORDER_TYPE = orderType;
					break;
				default:
					this.$store.state.notify('error', `不支持的委托别 (${orderType})`);
					return false;
			}
			// 上交所/註冊制/保護限價 : HIT & JOIN 不能轉 LIMIT
			if (orderInfo.SYMBOL.indexOf('I.S.SSE') === 0 && (orderType==='HIT' || orderType==='JOIN')) {
				orderInfo.TC_ORDER_TYPE = orderType;
			}

			// 調整 ORDER_PRICE
			let qo = M4C.Quote.getQuoteObject(orderInfo.SYMBOL);
			let tickSize = M4C.Symbol.getTickSize(orderInfo.SYMBOL, qo.p);
			let jumpDiff = +Big(tickSize).times(this.orderConvertMarketPrice.jumps);
			// 當前合約 收盤價 > 結算價 > 最新價 > 參考價 > 前收盤價
			let qop = qo.c || qo.st || qo.p || qo.r || qo.pc;
			
			try {
				// 平鋪出所有組合
				if (orderType === 'LATEST' && orderInfo.SIDE === 'BUY')
					orderInfo.ORDER_PRICE = +Big(qop).plus(jumpDiff);
				else if (orderType === 'LATEST' && orderInfo.SIDE === 'SELL')
					orderInfo.ORDER_PRICE = +Big(qop).minus(jumpDiff);
				else if (orderType === 'HIT' && orderInfo.SIDE === 'BUY')
					orderInfo.ORDER_PRICE = +Big(qo.sp1 || qop).plus(jumpDiff);
				else if (orderType === 'HIT' && orderInfo.SIDE === 'SELL')
					orderInfo.ORDER_PRICE = +Big(qo.bp1 || qop).minus(jumpDiff);
				else if (orderType === 'JOIN' && orderInfo.SIDE === 'BUY')
					orderInfo.ORDER_PRICE = +Big(qo.bp1 || qop).minus(jumpDiff);
				else if (orderType === 'JOIN' && orderInfo.SIDE === 'SELL')
					orderInfo.ORDER_PRICE = +Big(qo.sp1 || qop).plus(jumpDiff);
				else if (orderType === 'UDLIMIT' && orderInfo.SIDE === 'BUY')
					orderInfo.ORDER_PRICE = qo.hl;
				else if (orderType === 'UDLIMIT' && orderInfo.SIDE === 'SELL')
					orderInfo.ORDER_PRICE = qo.ll;
				// 支持上交所註冊制保護限價
				else if (orderInfo.SYMBOL.indexOf('I.S.SSE') === 0) {
					if (orderType === '5LvlMKT' || orderType === '5LvlMTL') {
						if (orderInfo.SIDE === 'BUY')
							orderInfo.ORDER_PRICE = +Big(qo.sp5 || qo.sp4 || qo.sp3 || qo.sp2 || qo.sp1 || qop).plus(jumpDiff);
						else if (orderInfo.SIDE === 'SELL')
							orderInfo.ORDER_PRICE = +Big(qo.bp5 || qo.bp4 || qo.bp3 || qo.bp2 || qo.bp1 || qop).minus(jumpDiff);
					}
				}
			}catch(err){
				console.log("M4C.Order.processConvertMarketPrice [ORDER_PRICE] fail");
			}
			// 非 五檔市價/五檔市價轉限價 時
			if (orderType !== '5LvlMKT' && orderType !== '5LvlMTL') {
				// 轉不出有效價格時，不允許送出下單
				if (!orderInfo.ORDER_PRICE) {
					this.$store.state.notify('error', this.$ln(`无法取得有效价格`));
					return false;
				}
			}
			return true;
		},
		// 檢查是否有下單權限 (by pdsetting.tp/ntp) https://trello.com/c/y2YR6L1S
		checkTpNtp(orderInfo) {
			let sid = orderInfo.SYMBOL || (orderInfo.OCO ? orderInfo.OCO[0].SYMBOL : '');
			// orderInfo 內不包含 SYMBOL 時，表示可能為刪改單，此時不做權限檢查
			if (!sid) return true;
			let qo = M4C.Quote.getQuoteObject(sid);
			if (!qo) return true;	// 無市況情境先允許下單 (讓 server 踢)，以免被檔
			console.log(`M4C.Order.checkTpNtp`, `tp: ${this.tp}`, `ntp: ${this.ntp}`);
			let approve, t0, t1, t2, s0, s1, s2;
			// 下单商品的市况里tp的值必须跟pd.setting里取到的值相符才可以让user下单出去，如果pd.setting沒有设定tp的值, 则任何商品都可以下到该账号
			if (this.tp && qo.tp) {
				// 預設都不允許
				approve = false;
				t0 = Math.round(qo.tp/10000);
				t1 = Math.round(qo.tp%10000/100);
				t2 = Math.round(qo.tp%100);
				this.tp.forEach((code)=>{
					s0 = Math.round(code/10000);
					s1 = Math.round(code%10000/100);
					s2 = Math.round(code%100);
					if (t0===s0 && (t1===s1 || s1===99) && (t2===s2 || s2===99))
						approve = true;
				});
				return approve;
			}
			// ntp代表不允许交易的商品种类，定义先检查tp再检查ntp,tp有符合的值就可以交易, 不管ntp里是否有冲突
			if (this.ntp) {
				// 預設都允許
				approve = true;
				if (qo.tp) {
					t0 = Math.round(qo.tp/10000);
					t1 = Math.round(qo.tp%10000/100);
					t2 = Math.round(qo.tp%100);
					this.ntp.forEach((code)=>{
						s0 = Math.round(code/10000);
						s1 = Math.round(code%10000/100);
						s2 = Math.round(code%100);
						if (t0===s0 && (t1===s1 || s1===99) && (t2===s2 || s2===99))
							approve = false;
					});
				}
				return approve;
			}
			return true;
		},
		/** 將 orderInfo 組合 command 後送出 */
		doSend(oi){
			let orderInfo = oi || this.orderInfo;
			let rkey = "".random();
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'order';
			cmd.d = orderInfo;
			cmd.r = rkey;
			cmd.d.ACCOUNT_ID = this.$store.state.login.accountID;
			cmd.d.USER_DATA = {"rkey": rkey};
			cmd.d.AP_TOOL = this.$store.state.device.isDesktop? 'x4Desktop': 'x4App';

			// 是否存在本帳號的簽章
			if (this.$store.state.cert[cmd.d.ACCOUNT_ID])
				this.sigSend(cmd);
			// 支持重複送委託多少次 (for Test)
			else if (window.urlParam.orderRepeat && orderInfo.ACTION === 'NEW' && orderInfo.POSITION_EFFECT !== 'CLOSE') {
				let cnt = Number(window.urlParam.orderRepeat);
				let delay = window.urlParam.repeatDelay || 40;
				let self = this;
				let count = 0
				this.interval = setInterval(() => {
					if(count >= cnt) {
						clearInterval(self.interval);
					}
					else {
						M4C.send(cmd);
						count ++;
					}
				}, delay);
			}
			else
				M4C.send(cmd);

			eventBus.$emit("SEND-ORDER");
			
			// 委託單未收到對應回報的 Timeout 機制
			this.mapRKeyToOrderTimeout[cmd.r] = setTimeout((o) => {
				let name = o.SYMBOL ? M4C.Symbol.getCNM4(o.SYMBOL) : '';
				let bs = o.SIDE==="BUY" ?  this.$ln("买进") :  this.$ln("卖出");
				let qty = !o.ORDER_QTY ? "" : (" " + o.ORDER_QTY + ", ");
				let price =  this.$ln("价格") + ' ' + (o.ORDER_PRICE || this.$ln("市价"));

				this.$store.state.notify({
					type: `error`,
					head: this.$ln("委托无回应"),
					body: `${name} ${bs} ${qty} ${price}`,
				});
			}, 9988, cmd.d);
		},
		// 簽章後送出
		sigSend(cmd) {
			let accountID = cmd.d.ACCOUNT_ID;
			let $cert = this.$store.state.cert[accountID];
			let certContent = this.getCertContent(cmd);
			// 將明文簽出密文
			M4C.Cert.getSign(certContent).then((certSig)=>{
				cmd.d.CERT_NO = $cert.CERT_NO;			// 簽章序號
				cmd.d.CERT_SUBJECT = 'ORDER';			// 簽章主旨
				cmd.d.CERT_CONTENT = certContent;		// 簽章明文
				cmd.d.CERT_SIG = certSig;				// 簽章密文
				M4C.send(cmd);
			}).catch(err=>{
				// 委託失敗提示
				this.$store.state.notify({icon: `error`, head: `簽章失敗`, body: `(${err.CODE || '-99600'}) ${err.MSG || this.$ln('簽章異常')}`});
			});
		},
		getCertContent(cmd, isIOC){
			let accountID = cmd.d.ACCOUNT_ID;
			// 一般單 or SMO單
			let smoType = cmd.d.SMO_TYPE === 'SMO' ? 'SMO' : 'NORMAL';
			let symbol = cmd.d.SYMBOL || '--';
			let side = cmd.d.SIDE || '--';
			let orderType = cmd.d.TC_ORDER_TYPE || '--';
			let timeInForce = cmd.d.TIME_IN_FORCE || '--';
			let price = cmd.d.ORDER_PRICE || cmd.d.NEW_PRICE || cmd.d.TOUCH_PRICE || '--';
			// OCO 單
			if (cmd.d.OCO) {
				let oco1 = cmd.d.OCO[0];
				let oco2 = cmd.d.OCO[1];
				symbol = `${oco1.SYMBOL},${oco2.SYMBOL}`;
				side = `${oco1.SIDE},${oco2.SIDE}`;
				orderType = `${oco1.TC_ORDER_TYPE},${oco2.TC_ORDER_TYPE}`;
				timeInForce = `${oco1.TIME_IN_FORCE},${oco2.TIME_IN_FORCE}`;
				let price1 = oco1.ORDER_PRICE || oco1.NEW_PRICE || oco1.TOUCH_PRICE || '--';
				let price2 = oco2.ORDER_PRICE || oco2.NEW_PRICE || oco2.TOUCH_PRICE || '--';
				price = `${price1},${price2}`;
			}
			// 簽章明文
			return `${this.traderID}|${accountID}|${isIOC? 'CIOCStart': cmd.d.ACTION}|${symbol}|${side}|${orderType}|${timeInForce}|${price}|${isIOC?'CIOC':smoType}|${new Date().day10()} ${new Date().time11()}|${this.clientIP}`;
		},
		// 針對回報 Object/List 進行刪單
		cancelOrderByReport(rptList, useComName){
			for (let i = 0; i < rptList.length; i++){				
				M4C.Order.sendOrder({
					'ACTION': 'CANCEL',			// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
					'REPORT_ID': rptList[i].key,
					'AP_PLUGIN': useComName,
				});
			}
		},
		// 取得市價轉換指定價設定
		getConvertMarketPrice(orderInfo) {
			if (orderInfo.TC_ORDER_TYPE !== 'MARKET')
				return this.$store.state.order.convertMarketPrice = null;
			let cmp;
			let sid = orderInfo.SYMBOL || this.$store.state.selectedSymbol.ID;
			// 優先抓取該交易所 user 的設定
			let exgId = sid.split('.').slice(0,3).join('.');
			cmp = this.$store.state.convertMarketPrice[exgId];
			// 不存在設定時，使用 pdsetting 的預設
			try{cmp = cmp || this.pdsettingConvertMarketPrice.find(obj=>obj.exgId===exgId).orderTypeList[0];}catch(e){}
			if (cmp && !cmp.jumps)
				this.$set(cmp, 'jumps', 0);
			if (cmp && !cmp.timeInForce)
				this.$set(cmp, 'timeInForce', cmp.timeInForceList[0]);
			return this.$store.state.order.convertMarketPrice = cmp;
		},
		// 更新 : 是否啟用保護限價
		isSSEProtection({sid, orderType}) {
			console.log('M4C.Order.isSSEProtection : ', sid, orderType);
			sid = sid || this.$store.state.selectedSymbol.ID;
			// 支持上交所/註冊制/保護限價
			return sid.indexOf('I.S.SSE') === 0 && 
			(	orderType === 'HIT' || 		// 對方價
				orderType === 'JOIN' || 	// 本方價
				orderType === '5LvlMKT' || 	// 五檔市價
				orderType === '5LvlMTL'		// 五檔市價轉限價
			);
		},
	},
	watch: {},
    computed: {
		clientIP(){
			return M4C.Dispatcher.getClientIP();
		},
		traderID(){
			return this.$store.state.login.traderID;
		},
		$order() {
			return this.$store.state.order;
		},
		/** 當前選取的委託別 */
		orderType() {
			return this.$store.state.order.orderType;
		},
		pdsettingConvertMarketPrice() {
			try{return this.$store.state.config.quotePdSetting.function.convertMarketPrice;}catch(e){}
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
		isCloseShfeOrIne() {
			if(this.sid){
				let exg = M4C.Symbol.getExchangeName(this.sid);
				let isShfeOrIne = exg === "SHFE" || exg === "INE";
				let isClose = this.orderInfo1.POSITION_EFFECT === "CLOSE";
				return isShfeOrIne && isClose;
			}
		},
		orderInfo1() {return this.isOCO ? this.orderInfo.OCO[0] : this.orderInfo;},
		isOCO(){if(this.orderInfo) return this.orderInfo.OCO? true: false;},
		sid(){if(this.orderInfo) return this.orderInfo1.SYMBOL;},
		localSmoAgreementVersion() {
			return this.$store.state.config.localSmoAgreementVersion;
		},
		// 當前有市價轉設定價
		orderConvertMarketPrice() {
			return this.$store.state.order.convertMarketPrice;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
	},
}
</script>
