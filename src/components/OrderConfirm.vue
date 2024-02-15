<template>
    <div class="order-confirm-ctn flex-col pdlr5 mgt2">
		<div class="order-confirm-body flex-col flex-1 posr">
			<ScrollBounce v-stop-propagation-y>
				<div class="order-data1">
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('委托帐号')}}</span>
						<div class="flex-1 content font-size-little flex-col">
							<span class="clr-orange">{{displayBrokerName}}</span>
							<span class="">{{displayTraderID}}</span>
						</div>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln(orderInfo1.SYMBOL2 ? '组合合约名称' : '合约名称')}}</span>
						<span class="flex-1 content font-size-little flex-col">
							<span>{{getSymbolName(orderInfo1.SYMBOL)}}</span>
							<span v-if="orderInfo1.SYMBOL2">{{getSymbolName(orderInfo1.SYMBOL2)}}</span>
						</span>
					</div>
					<div class="row-ctn flex-row" v-if="orderTypeText1 && !isOCO">
						<span class="label font-size-small">{{$ln('委托单别')}}</span>
						<span class="flex-1 content font-size-little"><span class="order-type-ctn">{{orderTypeText1}}</span></span>
					</div>
					<div class="row-ctn flex-row" v-if="orderInfo1.STOP_PRICE != null">
						<span class="label font-size-small">{{$ln('停损价格')}}</span>
						<span class="flex-1 content font-size-little">{{updatePrice(orderInfo1.STOP_PRICE)}}</span>
					</div>
					<div class="row-ctn flex-row" v-if="orderInfo1.TOUCH_PRICE != null">
						<span class="label font-size-small">{{$ln('触发价格')}}</span>
						<span class="flex-1 content font-size-little">{{updatePrice(orderInfo1.TOUCH_PRICE)}}</span>
					</div>
					<!-- 委託價格 -->
					<div class="row-ctn flex-row" v-if="displayOrderPrice1">
						<span class="label font-size-small">{{orderPriceLabel1}}</span>
						<span class="flex-1 content font-size-little"><span :class="{'order-type-ctn': isNaN(orderPriceText1)}">{{orderPriceText1}}</span></span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('委托数量')}}</span>
						<span class="flex-1 content font-size-little">{{orderInfo1.ORDER_QTY}}</span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('交易类型')}}</span>
						<span class="flex-1 content font-size-little">{{trandingType1}}</span>
					</div>
				</div>
				<div class="order-data2" v-if="orderInfo2">
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('合约名称')}}</span>
						<span class="flex-1 content font-size-little">{{getSymbolName(orderInfo2.SYMBOL)}}</span>
					</div>
					<div class="row-ctn flex-row" v-if="orderTypeText1 && !isOCO">
						<span class="label font-size-small">{{$ln('委托单别')}}</span>
						<span class="flex-1 content font-size-little"><span class="order-type-ctn">{{orderTypeText2}}</span></span>
					</div>
					<div class="row-ctn flex-row" v-if="orderInfo2.STOP_PRICE != null">
						<span class="label font-size-small">{{$ln('停损价格')}}</span>
						<span class="flex-1 content font-size-little">{{updatePrice(orderInfo2.STOP_PRICE)}}</span>
					</div>
					<div class="row-ctn flex-row" v-if="orderInfo2.TOUCH_PRICE != null">
						<span class="label font-size-small">{{$ln('触发价格')}}</span>
						<span class="flex-1 content font-size-little">{{updatePrice(orderInfo2.TOUCH_PRICE)}}</span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('委托价格')}}</span>
						<span class="flex-1 content font-size-little"><span :class="{'order-type-ctn': isNaN(orderPriceText2)}">{{orderPriceText2}}</span></span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('委托数量')}}</span>
						<span class="flex-1 content font-size-little">{{orderInfo2.ORDER_QTY}}</span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('交易类型')}}</span>
						<span class="flex-1 content font-size-little">{{trandingType2}}</span>
					</div>
				</div>
				<div class="market-watch-info order-data2" v-for="(watchObj, idx) in marketWatchObj" :key="idx">
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('合约名称')}}</span>
						<span class="flex-1 content font-size-little">{{getSymbolName(watchObj.SYMBOL)}}</span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('触发条件')}}</span>
						<span class="flex-1 content font-size-little"><span class="order-type-ctn">{{optCompareMap[watchObj.CONDITION]}}</span></span>
					</div>
					<div class="row-ctn flex-row">
						<span class="label font-size-small">{{$ln('触发价格')}}</span>
						<span class="flex-1 content font-size-little"><span class="order-type-ctn">{{$updatePrice(watchObj.SYMBOL, watchObj.PRICE)}}</span></span>
					</div>
				</div>
				<!-- 以一定範圍市價送出 -->
				<div v-if="displayRangeMarket" class="mgl1 mgb3 flex-start">
					<CheckBox v-model="$store.state.order.useRangeMarket" class="">{{$ln('市价单使用〖一定范围市价〗送出')}}</CheckBox>
				</div>
			</ScrollBounce>
		</div>
		<div class="mgl2">
			<CheckBox v-if="isThunder" v-model="thurderConfirm"><span class="mgl0d5">{{$ln('下次不再显示确认視窗(战斗闪电)')}}</span></CheckBox>
			<CheckBox v-else v-model="orderConfirm"><span class="mgl0d5">{{$ln('下次不再显示确认視窗(下單盒)')}}</span></CheckBox>
		</div>
		<div class="flex-center mgtb3 font-size-little">{{$ln(orderWarning)}}</div>
		<div class="flex-center mgtb3 font-size-little clr-orange" v-if="isSplitOrder">{{$ln(`根据拆单设定，此委托将拆单处理!`)}}</div>
        <div class="mgb10 flex-row flex-center">
            <Button class="font-size-big btn-cancel mgr2" @click="onBtnCancel">{{$ln("取消")}}</Button>
            <Button class="font-size-big btn-confirm mgl3" @click="onBtnOrder">{{$ln("送出委托")}}</Button>
        </div>
    </div>
</template>

<script>
/**
 * 智慧單(OCO)：傳入 orderInfo，呈現拆分 orderInfo1/orderInfo2，下單時僅送出原 orderInfo
 * 分開複式單：傳入 orderInfo1/orderInfo2，下單時同時將兩筆單送出
 * 合併複式單：傳入 orderInfo，呈現拆分 orderInfo1/orderInfo2，下單時僅送出原 orderInfo
 */
export default {
	props: ['param'],
	data() {
		return {
			orderWarning: "",
			isSplitOrder: false,
			optCompareMap: {
				'>': '大於',
				'>=': '大於等於',
				'=': '等於',
				'<=': '小於等於',
				'<': '小於',
			},
			marketTypeList: ['MARKET', 'STOP', 'TSTOP', 'MIT', 'MWP'],
			thurderConfirm: false,
			orderConfirm:false,
        }
	},
	beforeMount() {
		// 委託數量超出限制=>不顯示委託確認視窗，改顯示超出限制訊息。
		if(!M4C.Order.orderQtyCheck(this.orderInfo)) {
			eventBus.$emit("CLOSE-DIALOG");
			return;
		}
		// 檢查權利金是否小於手續費(tw選擇權需求)
		M4C.Order.premiumCheck(this.orderInfo, true)
		this.$emit("title", `委托确认`);
	},
	mounted() {
		// 支持市价转设定价
		if (!this.twMode && this.orderInfo.ACTION === 'NEW')
			M4C.Order.getConvertMarketPrice(this.orderInfo);
		// 一般市價單
		if (this.orderInfo1.TC_ORDER_TYPE == "MARKET" && !this.orderInfo2 && !this.orderConvertMarketPrice) {
			this.orderWarning = `提示：市价可以造成滑点过大`;
		}
		// 雲端洗價條件單顯示訊息
		if (this.orderInfo.SMO_TYPE === 'SMO') {
			this.orderWarning = `提示：本次挂单将通过云端服务器，不保证成交，且可能出现滑价`;
		}
		/** 
		 * 顯示 : 根据拆单设定，此委托将拆单处理
		 * 不使用computed方式是因為在送出時order核心也呼叫一次shouldSplit，但這樣會因短時間內呼叫而判斷成全平或全刪情境。
		 * 導致關閉視窗時短暫顯示需要拆單的提示文字 */
		if (M4C.Order.Split)
			this.isSplitOrder =  M4C.Order.Split.shouldSplit(this.orderInfo);
		// 有顯示以一定範圍市價送出時 -> 更新 TC_ORDER_TYPE
		if (this.displayRangeMarket)
			this.updateTCOrderType();
		console.log(`OrderConfirm.orderInfo :`, JSON.stringify(this.param.orderInfo));
		// 初始化是否顯示確認視窗
		this.thurderConfirm = !this.$store.state.thunder.settings.other.orderConfirm;
		this.orderConfirm = !this.$store.state.order.confirm;
	},
    methods: {
		getSymbolName(sid) {
			return M4C.Symbol.getCNM4(sid, " ");
		},
		onBtnCancel() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onBtnOrder() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			// 一般單/智慧單/合併複式單
			let result = M4C.Order.sendOrder(this.orderInfo);
			// 分拆複式單
			if (this.param.orderInfo2)
				result = M4C.Order.sendOrder(this.param.orderInfo2);
			if (result)
				// 關閉自己
				eventBus.$emit("CLOSE-DIALOG");
				// 是否關閉下單盒
				if (this.$store.state.order.closeOrderBox && this.twMode && this.isMixOrder) {
					eventBus.$emit("CLOSE-DIALOG");
				}
			if (this.param.onConfirmCallback)
				this.param.onConfirmCallback();
		},
		/** 倉別文字 */
		getPositionEffect(str) {
			switch(str) {
				case 'AUTO': return "自动";
				case 'OPEN': return "新仓";
				case 'CLOSE': return "平仓";
				case 'DAYTRADE': return "当冲";
				case 'CTD': return "平今";
				case 'CYD': return "平昨";
				case 'CWO': return "备兑开仓";
				case 'CWC': return "备兑平仓";
				case 'PCTD': return "優先平今";
				case 'PCYD': return "優先平昨";
			}
		},
		// 處理特定交易所平倉時，以設定決定優先平今、平昨。
		parseOi(oi) {
			let isCloseShfeOrIne = (oi) =>{
				let exg = M4C.Symbol.getExchangeName(oi.SYMBOL);
				let isShfeOrIne = exg === "SHFE" || exg === "INE";
				let isClose = oi.POSITION_EFFECT === "CLOSE";
				return isShfeOrIne && isClose;
			}
			if(isCloseShfeOrIne(oi)){
				oi.POSITION_EFFECT = this.$store.state.order.closeShfeIne;
			}
			return oi;
		},
        getTradingType(orderInfo) {
			let oi = this.parseOi(orderInfo);
			// 方向
			let side = oi.SIDE === "BUY"? "买入": "卖出";
			// 倉別
			let pos_effect = this.getPositionEffect(oi.POSITION_EFFECT);
			// 效期別
			let time_in_force = oi.TIME_IN_FORCE;
			// 支持市價自動轉價
			if (oi.TC_ORDER_TYPE === 'MARKET' && this.orderConvertMarketPrice)
				time_in_force = this.orderConvertMarketPrice.timeInForce;
			let abOrderText = '';
			if(orderInfo.MARKET_WATCH) {
				abOrderText = `(${this.$ln('触A下B')})`;
			}
			return this.$ln(side) + this.$ln(pos_effect) + this.$ln(time_in_force) + abOrderText;
		},
		updatePrice(val) {
			return this.$updatePrice(this.sid, val);
		},
		// 依據勾選以一定範圍市價送出來更新 TC_ORDER_TYPE
		updateTCOrderType() {
			this.orderInfo.TC_ORDER_TYPE = this.$store.state.order.useRangeMarket ? 'MWP' : 'MARKET';
		},
	},
	watch: {
		// 切換勾選使用一定範圍市價時 -> 更新 TC_ORDER_TYPE
		'$store.state.order.useRangeMarket'(nv) {
			this.updateTCOrderType();
		},
		thurderConfirm(nv){
			this.$store.state.thunder.settings.other.orderConfirm = !nv;
		},
		orderConfirm(nv){
			this.$store.state.order.confirm = !nv;
		}
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		$order() {
			return this.$store.state.order;
		},
		/** 相容帶入 orderInfo 或 orderInfo1 */
		orderInfo() {
			return this.param.orderInfo1 || this.param.orderInfo;
		},
		/** 是否為 OCO 智慧單 */
		isOCO() {
			return this.orderInfo.OCO;
		},
		orderInfo1() {
			return this.isOCO ? this.orderInfo.OCO[0]: this.orderInfo;
		},
		orderInfo2() {
			return this.isOCO ? this.orderInfo.OCO[1]: this.param.orderInfo2;
		},
		sid() {
			return this.orderInfo1.SYMBOL;
		},
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		// 價差商品
		isPriceDiff() {
			return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
		/** 交易類型1 */
		trandingType1(){
			return this.getTradingType(this.orderInfo1);
		},
		/** 交易類型2 */
		trandingType2(){
			return this.getTradingType(this.orderInfo2);
		},
		orderTypeText1() {
			if(this.orderInfo1.IS_HOMOTO) return this.$ln("保本单");
			// 市價轉設定價情境
			if (this.orderInfo1.TC_ORDER_TYPE === 'MARKET' && this.orderConvertMarketPrice)
				return this.convertMarketOrderTypeText;
			if (this.isOCO && this.orderInfo1.ORDER_PRICE)
				return;
			return this.$ln(this.$store.state.config.mapOrderTypeLabel[this.orderInfo1.TC_ORDER_TYPE]);
		},
		orderTypeText2() {
			if (this.isOCO && this.orderInfo2.ORDER_PRICE)
				return;
			return this.$ln(this.$store.state.config.mapOrderTypeLabel[this.orderInfo2.TC_ORDER_TYPE]);
		},
		// 委託價格標籤
		orderPriceLabel1() {
			return this.isSSEProtection ? this.$ln('保护限价') : this.$ln('委托价格');
		},
		/** 委託價格為 0 時，直接顯示委託單別 ex. "五檔市價" */
		orderPriceText1() {
			if (this.orderInfo1.TC_ORDER_TYPE === 'MARKET' && this.orderConvertMarketPrice) {
				return `${this.convertMarketOrderTypeText} ${this.jumpsText || ''}`;
			}
			// 複式選擇權 & 價差期貨 => 要看 ORDER_TYPE 決定是否直接顯示委託價格數值
			if (this.param.multiOption || this.isPriceDiff) {
				if (this.orderInfo1.TC_ORDER_TYPE === 'LIMIT' || this.orderInfo1.TC_ORDER_TYPE === 'LIT' || this.orderInfo1.TC_ORDER_TYPE === 'STPLMT')
					return this.orderInfo1.ORDER_PRICE;
			}
			let price = 0;
			if (this.orderInfo1.ORDER_PRICE != 0)
				price = this.updatePrice(this.orderInfo1.ORDER_PRICE);
			let orderPriceText = "";
			// 洗價單如果是一定範圍市價，另外帶ORDER_TYPE(TCORE也是另外指定)
			if (this.orderInfo1.ORDER_TYPE == 'RANGED' || this.orderInfo1.TC_ORDER_TYPE === 'MWP')
				orderPriceText = `${this.$ln('一定范围市价')}`;
			else if(this.marketTypeList.indexOf(this.orderInfo1.TC_ORDER_TYPE) != -1) {
				orderPriceText = this.$ln(`市价`);
			}
			return orderPriceText || price;
		},
		/** 委託價格為 0 時，直接顯示委託單別 ex. "五檔市價" */
		orderPriceText2() {
			let price = 0;
			if (this.orderInfo2.ORDER_PRICE > 0)
				price = this.updatePrice(this.orderInfo2.ORDER_PRICE);
			let orderPriceText = "";
			// 洗價單如果是一定範圍市價，另外帶ORDER_TYPE(TCORE也是另外指定)
			if (this.orderInfo2.ORDER_TYPE == 'RANGED' || this.orderInfo2.TC_ORDER_TYPE === 'MWP')
				orderPriceText = `${this.$ln('一定范围市价')}`;
			else if(this.marketTypeList.indexOf(this.orderInfo2.TC_ORDER_TYPE) != -1) {
				orderPriceText = this.$ln(`市价`);
			}
			return orderPriceText || price;
		},
		$updatePrice() {return this.$store.state.fn.$updatePrice;},

		// 有市價轉換設定
		orderConvertMarketPrice() {
			return this.$store.state.order.convertMarketPrice;
		},
		// 市價轉設定價文字
		convertMarketOrderTypeText() {
			return this.$store.state.config.mapOrderTypeLabel[this.orderConvertMarketPrice.orderType];
		},
		jumpsText() {
			if (this.orderConvertMarketPrice.jumps) return `加 ${this.orderConvertMarketPrice.jumps} 跳`;
		},
		// 觸A下B的監看設定資料
		marketWatchObj() {return this.orderInfo1.MARKET_WATCH;},
		/** 台灣期交所 TWF */
		isTWF() {
			return this.minfo.Exchange === "TWF";
		},
		// 顯示[以一定範圍市價]送出 https://trello.com/c/tQcEARNp , https://trello.com/c/ONvKsPZl
		displayRangeMarket() {
			return this.twMode && this.isTWF && this.param.from==='FastOrder' && this.orderInfo1.ORDER_PRICE===0;
		},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.$store.state.login.brokerID];
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.$store.state.login.accountID);
		},
		// 上海證券交易所/註冊制 : 保護限價
		isSSEProtection() {
			let orderType = this.orderInfo1.TC_ORDER_TYPE;
			// 市價時，要看設定轉成什麼價，才去判斷是否符合註冊制
			if (orderType === 'MARKET')
				orderType = this.orderConvertMarketPrice ? this.orderConvertMarketPrice.orderType : orderType;
			return M4C.Order.isSSEProtection({'sid': this.sid, orderType});
		},
		isSSEMarket() {
			return this.orderInfo1.SYMBOL.indexOf('I.S.SSE') === 0 && this.orderInfo1.TC_ORDER_TYPE === 'MARKET';
		},
		// 顯示委託價格1
		displayOrderPrice1() {
			if (this.orderInfo.TC_ORDER_TYPE === 'MTL')
				return false;
			return true;
		},
		isMixOrder() {
			let result = false;
			this.$store.state.popup.dialogList.forEach(element => {
				if(element.cls == 'Mixorder') {
					result = true;
				}
			});
			return result;
		},
		isHomoto() {return this.param.isHomoto;},
		// 是否來自閃電下單畫面
		isThunder(){
			return this.orderInfo.AP_PLUGIN=="ThunderTable" || this.orderInfo.AP_PLUGIN=="ThunderFoot"
		}
    }
}
</script>

<style lang='scss' scoped>
.order-data1, .order-data2{
	border-top: 1px solid rgb(155,155,155);
	padding: 3vh 1vw;
	@extend .flex-col;
}
.row-ctn {
	@extend .pdtb2;
}
.label {
	min-width: 34vw;
	color: rgb(155,155,155);
}
.order-type-ctn {
	border: 1px solid #444;
	border-radius: 1vw;
	padding: 1vw 3vw;
}

/** 桌機版 */
.desktop .order-data1 {
	border-top: 0px;
	padding: 0 4px 10px 4px;
}
.desktop .order-data2 {
	padding: 10px 4px;
}
.desktop .label {
	min-width: 128px;
}
.desktop .order-type-ctn {
	border-radius: 4px;
	padding: 4px 12px;
}

</style>