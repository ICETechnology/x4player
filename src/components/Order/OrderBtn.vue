<template>
	<!-- 委託按鈕 -->
	<div class="order-btn-ctn flex-col">
		<!-- 三顆按鈕情境 -->
		<div v-if="show3Btn" class="flex-1 flex-row list-block btn3">
			<!-- 買進 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col clr-white bgc-B order-btn tcef" :class="{disabled: isInvalid || param.side == 'SELL'}" @click="onBtnOrder('BUY', buyOrderPrice)">
					<div :class="{'font-size-mini': !isDesktop}" :key="buyBtnTopText">{{buyBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}">{{buyBtnText}}</div>
				</Button>
			</div>
			<!-- 平倉 (TW不顯示, 一般模式證券不顯示) -->
			<div class="flex-1 flex-center" v-if="showNormalCloseBtn">
				<Button class="ht4 rd2 flex-col order-btn clr-white bgc-333 tcef" :class="{disabled: disableClose || isInvalid}" @click="onBtnOrder('CLOSE', closeOrderPrice)">
					<!-- <div class='font-size-mini'>{{closeBtnTopText}}</div> -->
					<div :class="{'font-size-little': !isDesktop}">{{closeBtnText}}</div>
				</Button>
			</div>
			<!-- 賣出 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col clr-white bgc-btn-sell order-btn tcef" :class="{disabled: isInvalid || param.side == 'BUY'}" @click="onBtnOrder('SELL', sellOrderPrice)">
					<div :class="{'font-size-mini': !isDesktop}" :key="sellBtnTopText">{{sellBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}" >{{sellBtnText}}</div>
				</Button>
			</div>
		</div>
		<!-- 四顆按鈕情境 -->
		<div v-if="!show3Btn" class="flex-1 flex-row list-block btn4">
			<!-- 買開 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col clr-white bgc-B order-btn tcef" :class="{disabled: isInvalid}"
					@click="onBtnOrder('BUY', buyOrderPrice, null, 'OPEN')">
					<div :class="{'font-size-mini': !isDesktop}" :key="buyBtnTopText">{{buyBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}">{{$ln('买开')}}</div>
				</Button>
			</div>
			<!-- 買平 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col order-btn clr-white bgc-B tcef" :class="{disabled: disableBuyClose || isInvalid}" 
					@click="onBtnOrder('CLOSE', buyOrderPrice, null, 'BUY')">
					<div :class="{'font-size-mini': !isDesktop}" :key="buyBtnTopText">{{buyBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}">{{$ln('买平')}}</div>
				</Button>
			</div>
			<!-- 賣開 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col clr-white bgc-btn-sell order-btn tcef" :class="{disabled: isInvalid}"
					@click="onBtnOrder('SELL', sellOrderPrice, null, 'OPEN')">
					<div :class="{'font-size-mini': !isDesktop}" :key="sellBtnTopText">{{sellBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}">{{$ln('卖开')}}</div>
				</Button>
			</div>
			<!-- 賣平 -->
			<div class="flex-1 flex-center">
				<Button class="ht4 rd2 flex-col order-btn clr-white bgc-btn-sell tcef" :class="{disabled: disableSellClose || isInvalid}" 
					@click="onBtnOrder('CLOSE', sellOrderPrice, null, 'SELL')">
					<div :class="{'font-size-mini': !isDesktop}" :key="sellBtnTopText">{{sellBtnTopText}}</div>
					<div :class="{'font-size-little': !isDesktop}">{{$ln('卖平')}}</div>
				</Button>
			</div>
		</div>
		<!-- 熔斷價格檢查提示 -->
		<OrderPriceAlert v-if="!twMode" ref="orderPriceAlert" />
		<!-- 委託價超越漲跌停價格檢查提示 (CN的scTAS) -->
		<OverUpDnLimitAlert v-if="!twMode" ref="overUpDnLimitAlert" />
	</div>
</template>

<script>
import OrderPriceAlert from "@/components/Order/OrderPriceAlert.vue";
import OverUpDnLimitAlert from "@/components/Order/OverUpDnLimitAlert.vue";

export default {
	props: ["param", 'useComName', 'isDaytrade', 'displayRangeMarket'],
	data() {
		let param = this.param || {};
		return {
			/** 點擊買賣方向 : "BUY" / "SELL" / "CLOSE" */
			btnSide: "",
			/** 強制指定平倉方向 -> 買平=BUY, 賣平=SELL */
			forceSide: "",
			/** 平倉選擇平多或平空 */
			closeChooseSide: null,
			/** 当前资金帐号 */
			selectedAcc: "",
			/** 台灣交易所 - 倉別 */
			tw_PositionEffect: "AUTO",
		}
	},
	beforeMount() {
		// 初始化變數
		this.$order.orderType = this.propParam.orderType || this.$order.orderType;
		this.$order.inputOrderPrice = this.propParam.orderPrice || 0,
		this.$order.inputStopPrice = this.propParam.stopPrice || 0;
		this.$order.inputTouchPrice = this.propParam.touchPrice || this.propParam.orderPrice || 0;
		this.$order.inputOrderQty = Math.abs(this.propParam.orderQty || this.$store.getters.getDefaultQty || 1);
		this.$order.covered = false;
		// init 就決定 ticksize (如果隨跳動取 ticksize 太重)
		this.tickSize = M4C.Symbol.getTickSize(this.sid, this.qo.p);
	},
    mounted() {
		// 啟動階段初始化一次
		this.onOrderType(this.orderType);
		this.selectedAcc = this.$store.state.login.accountID;
	},
	beforeDestroy() {},
	components: {
		OrderPriceAlert,
		OverUpDnLimitAlert,
	},
    methods: {
		/** 切換委託價格別 */
		onOrderType(type) {
			// 委託價是非數字時以qop資料替代
			let lastInputOrderPrice = isNaN(this.inputOrderPrice) || !this.inputOrderPrice ? this.qop : this.inputOrderPrice;
			this.$order.inputProtectionPrice = isNaN(this.inputProtectionPrice) || !this.inputProtectionPrice ? this.qop : this.inputProtectionPrice;

			// 初始化價格
			this.$order.inputOrderPrice = 0;
			this.$order.inputTouchPrice = this.$order.inputStopPrice = null;
			switch(type) {
				case "LIMIT":
					this.$order.inputOrderPrice = lastInputOrderPrice;
					break;
				// 一定範圍市價
				case "MWP":
				case "MARKET":
					break;
				case "STPLMT":
					this.$order.inputOrderPrice = this.$order.inputStopPrice = lastInputOrderPrice;
					break;
				case "STOP":
					this.$order.inputStopPrice = lastInputOrderPrice;
					break;
				case 'MIT':
					this.$order.inputTouchPrice = lastInputOrderPrice;
					break;
				case 'LIT':
					this.$order.inputOrderPrice = this.$order.inputTouchPrice = lastInputOrderPrice;
					break;
				default:
					this.$order.inputOrderPrice = lastInputOrderPrice;
					break;
			}
			this.$store.state.order.orderType = type;
		},
		/** 平倉選擇 */
		closeChooser(side, orderPrice) {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `平仓选择`,
				content: `请选择平多方或是平空方`,
				confirmText: `平空方`,
				cancelText: `平多方`,
				confirm: ()=> {
					this.onBtnOrder(side, orderPrice, "BUY");
				},
				cancel: ()=> {
					this.onBtnOrder(side, orderPrice, "SELL");
				}
			});
		},
		getOrderInfo(side, orderPrice, closeChooseSide, forceSide){
			// 平倉選擇 (平多="SELL", 平空="BUY")
			this.closeChooseSide = closeChooseSide;
			// 按下哪一個按鈕 "BUY" / "SELL" / "CLOSE"
			this.btnSide = side;
			// 強制指定平倉方向 -> 買平=BUY, 賣平=SELL
			this.forceSide = forceSide;
			// computed 出 orderInfo (需在 this.btnSide 以下)
			let orderInfo = this.orderInfo;
			
			// 買賣可平倉量相同時(一般模式) -> 進入平倉選擇情境 (第一次呼入)
			if (side === "CLOSE" && !closeChooseSide && this.psd.$OBQTY === this.psd.$OSQTY && this.orderBoxMode===0) {
				this.closeChooser(side, orderPrice);
				return;
			}
			// 平倉選擇情境 第二次呼入
			orderInfo.SIDE = closeChooseSide || orderInfo.SIDE;
			return orderInfo;
		},
		/** 下單 */
		onBtnOrder(side, orderPrice, closeChooseSide, forceSide) {
			let self = this;
			// 防連點機制
			// if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 平倉選擇 (平多="SELL", 平空="BUY")
			this.closeChooseSide = closeChooseSide;
			// 按下哪一個按鈕 "BUY" / "SELL" / "CLOSE"
			this.btnSide = side;
			// 強制指定平倉方向 -> 買平=BUY, 賣平=SELL
			this.forceSide = forceSide;
			// computed 出 orderInfo (需在 this.btnSide 以下)
			let orderInfo = this.orderInfo;
			
			// 買賣可平倉量相同時(一般模式) -> 進入平倉選擇情境 (第一次呼入)
			if (side === "CLOSE" && !closeChooseSide && this.psd.$OBQTY === this.psd.$OSQTY && this.orderBoxMode===0) {
				this.closeChooser(side, orderPrice);
				return;
			}
			// 平倉選擇情境 第二次呼入
			orderInfo.SIDE = closeChooseSide || orderInfo.SIDE;

			// 熔斷機制檢查 https://trello.com/c/Ofxk8bCU
			if (!this.twMode && this.$refs.orderPriceAlert) {
				let result = this.$refs.orderPriceAlert.check({orderInfo});
				if (result) {
					console.log('熔斷機制提示 : ', result);
					eventBus.$emit("CONFIRM-DIALOG", {
						title: '下单价格检查',
						htmlContent: this.$ln(`下单价格可能触发熔断，是否继续下单？`),
						confirm: ()=>{
							self.continueOrder({orderInfo});
						},
					});
					return;
				}
			}
			// 委託價超過漲跌停價檢查機制 https://trello.com/c/Oexn9nua
			if (!this.twMode && this.$refs.overUpDnLimitAlert) {
				let result = this.$refs.overUpDnLimitAlert.check({orderInfo});
				if (result) {
					console.log('委託價超過漲跌停價機制提示 : ', result);
					eventBus.$emit("CONFIRM-DIALOG", {
						title: '下单价格检查',
						htmlContent: `委托价格偏离过大(${result})，是否继续？`,
						confirm: ()=>{
							self.continueOrder({orderInfo});
						},
					});
					return;
				}
			}
			// 平倉按鈕時，倉別強制為 CLOSE (https://trello.com/c/yTUh5N4i)
			orderInfo.POSITION_EFFECT = side === 'CLOSE' ? side : orderInfo.POSITION_EFFECT;
			this.continueOrder({orderInfo});
		},
		// 繼續往下下單
		continueOrder({orderInfo}) {
			//是否跳出確認視窗
			if (this.$store.state.order.confirm){
				// 提示确认视窗
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: orderInfo, from: this.param.from}, {transName: 'float'});
			}
			else {
				M4C.Order.sendOrder(orderInfo);
				// 是否關閉下單盒
				if (this.$store.state.order.closeOrderBox && this.twMode) {
					eventBus.$emit("CLOSE-DIALOG");
				}
			}
		},
	},
	watch: {
		orderType(nv) {
			this.onOrderType(nv);
		},
		/** 傳入參數變更 */
		'param.orderPrice'(nv) {
			this.$order.inputOrderPrice = nv;
			this.$store.state.order.orderType = this.propParam.orderType;
		},
		/** 切換商品 */
		sid() {
			this.$order.inputOrderPrice = this.qo.p;
		},
		// 市況最新價改變
		qop(nv, ov) {
			// 切換至未訂閱的商品時，因新訂閱，最新價會從無變有，此時要更新委託價至最新價(預設)
			if (!ov && nv && this.$order.inputOrderPrice == '')
				this.$order.inputOrderPrice = nv;
		},
	},
    computed: {
		isStock() {return this.sid.split(".")[1] === "S"},
		qtyStep() {return this.isStock? 100: 1},
		propParam() {
			// 支援未傳入參數情境 (桌機內嵌情境)
			return this.param || {orderType: 'LIMIT', orderPrice: this.qo.p};
		},
		// 下單盒模式 (0:普通, 1:高級)
		orderBoxMode() {
			return this.param && this.param.orderBoxMode != null ? this.param.orderBoxMode : this.$store.state.config.orderBoxMode;
		},
		$order() {
			return this.$store.state.order;
		},
		inputOrderPrice() {
			return this.$store.state.order.inputOrderPrice;
		},
		inputOrderQty() {
			return this.$store.state.order.inputOrderQty;
		},
		inputStopPrice() {
			return this.$store.state.order.inputStopPrice;
		},
		inputTouchPrice() {
			return this.$store.state.order.inputTouchPrice;
		},
		covered() {
			return this.$store.state.order.covered;
		},
		underlyingQo(){return this.$store.state.opt.underlyingSQO},
		underlyingQop(){return this.underlyingQo.p},
		sid() {return this.param? this.param.symbol || this.$store.state.selectedSymbol.ID: this.$store.state.selectedSymbol.ID;},
		qo() {return M4C.Quote.getQuoteObject(this.sid);},
		psd() {return this.$store.state.selectedSymbol.positionSum;},
		minfo() {return this.$store.state.selectedSymbol.MInfo;},
		twMode() {return this.$store.state.config.twMode;},
		qop() {
			return this.qo.p || this.qo.r || this.qo.pc || 0;
		},
		orderType() {
			return this.$store.state.order.orderType;
		},
		/** 资金帐号清单 */
		accountOptions() {
			return this.$store.state.login.accounts.map(acc => {
				return {label: acc.CUST_NAME, value:acc.ACCOUNT_ID};
			})
		},
		/** 價格別文字 */
		orderTypeText() {
			let str = this.$store.state.config.mapOrderTypeLabel[this.orderType] || this.orderType;
			return this.$ln(str);
		},
		/** 是否停用買進按鈕 */
		disableBuy() {
			return this.propParam.disableBuy || this.covered;
		},
		/** 停用賣出按鈕 */
		disableSell(){
			// 證券商品多0空0要停用賣出按鈕
			if (this.isStock && !this.psd.$BQTY && !this.psd.$SQTY)
				return true;
			// 證券商品存在部位時，固定啟用賣出按鈕 (忽略 disableSell)
			if (this.isStock && this.psd.$BQTY)
				return false;
			return this.propParam.disableSell;
		},
		/** 是否停用所有平倉按鈕 */
		disableClose() {
			return this.disableBuyClose && this.disableSellClose;
		},
		/** 是否停用買方平倉按鈕 */
		disableBuyClose() {
			// 買賣可用平倉數量皆為 0 時 -> 停用平倉按鈕 https://trello.com/c/DIDZtIFJ, https://trello.com/c/ybDlXzPS
			if (this.psd.$OSQTY == 0)
				return true;
			// 開啟備兌 && 無備兌倉時 -> disable
			return this.propParam.disableClose || !this.psd.$SQTY;
		},
		/** 是否停用賣方平倉按鈕 */
		disableSellClose() {
			// 買賣可用平倉數量皆為 0 時 -> 停用平倉按鈕 https://trello.com/c/DIDZtIFJ, https://trello.com/c/ybDlXzPS
			if (this.psd.$OBQTY == 0)
				return true;
			// 開啟備兌 && 無備兌倉時 -> disable
			return this.propParam.disableClose || !this.psd.$BQTY || (this.covered && !this.hasCoveredQty);
		},
		/** 買進按鈕內容 */
		buyBtnText() {
			let psd = this.psd;
			let str = (!psd.$BQTY && !psd.$SQTY) ? "买进" : (psd.$BQTY >= psd.$SQTY ? "加买" : "锁仓");
			// tw一律显示买进
			str = this.twMode ? "买进": str;
			return this.$ln(str);
		},
		/** 賣出按鈕內容 */
		sellBtnText() {
			let psd = this.psd;
			let str = (!psd.$BQTY && !psd.$SQTY) ? "卖出" : (psd.$SQTY >= psd.$BQTY ? "加卖" : "锁仓");
			// 備兌時一律顯示備兌開倉
			str = this.covered ? "备兑开仓" : str;
			// TW or 證券 : 一律显示卖出
			str = this.twMode || this.isStock ? "卖出": str;
			return this.$ln(str);
		},
		/** 平倉按鈕內容 */
		closeBtnText() {
			let psd = this.psd;
			let str = (!psd.$BQTY && !psd.$SQTY) ? "平仓" : (psd.$NET_OFFSETABLE_QTY === 0 ? "平仓选择" : "平仓");
			// 備兌時，且存在備兌倉部位時，顯示備兌平倉
			if (this.covered && this.hasCoveredQty)
				str = "備兌平倉";
			return this.$ln(str);
		},
		/** 跳數 x TickSize */
		jumpDiff() {
			return +Big(this.tickSize).times(this.$store.state.order.jumpCnt);
		},
		/** 買進委託價格 */
		buyOrderPrice() {
			return this.$store.state.order.buyOrderPrice;
		},
		/** 賣出委託價格 */
		sellOrderPrice() {
			return this.$store.state.order.sellOrderPrice;
		},
		/** 平倉委託價格 */
		closeOrderPrice() {
			let psd = this.psd;
			let side = psd.$NET_OFFSETABLE_QTY > 0 ? "BUY" : (psd.$NET_OFFSETABLE_QTY < 0 ? "SELL" : this.closeChooseSide);
			switch (this.orderType) {
				case 'LIMIT':
				case 'STPLMT':
				case 'LIT':
					return parseFloat(this.inputOrderPrice);
				case 'HIT':
					// 對手價 & 淨多單 => 买1价 - N跳
					if (side === "BUY")
						return +Big(this.qo.bp1 || this.qop).minus(this.jumpDiff);
					// 對手價 & 淨空單 => 卖1价 + N跳
					else if (side === "SELL")
						return +Big(this.qo.sp1 || this.qop).plus(this.jumpDiff);
				case 'JOIN':
					// 排隊價 & 淨多單 => 卖1价 + N跳
					if (side === "BUY")
						return +Big(this.qo.sp1 || this.qop).plus(this.jumpDiff);
					// 排隊價 & 淨空單 => 买1价 - N跳
					else if (side === "SELL")
						return +Big(this.qo.bp1 || this.qop).minus(this.jumpDiff);
				default:
					return 0;
			}
		},
		/** 當前商品有備兌倉數量 */
		hasCoveredQty() {
			return this.psd.OFFSETABLE_COVERED_BUY_QTY > 0 || this.psd.OFFSETABLE_COVERED_SELL_QTY > 0;
		},
		/** 委託單內容 */
		orderInfo() {
			// 一般單
			let oiObj = {
				'ACTION': 'NEW',							// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,
				'SIDE': this.oiSide,						// 買BUY/賣SELL
				'POSITION_EFFECT': this.oiPositionEffect,	// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.orderType,			// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.oiTimeInForce,		// ROD/IOC/FOK
				'ORDER_PRICE': this.oiOrderPrice,
				'ORDER_QTY': parseFloat(this.inputOrderQty),
				'SMO_TYPE': this.$store.state.order.orderTypeFromDCore ? 'SMO' : 'NONE',
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
			// 若有停損價格
			if (this.oiStopPrice != null)
				oiObj.STOP_PRICE = this.oiStopPrice;
			// 觸價市價/觸價限價
			if (this.oiTouchPrice != null)
				oiObj.TOUCH_PRICE = this.oiTouchPrice;
			// GTD 單加押日期
			if (this.$store.state.order.inputTimeInForce == "GTD")
				oiObj.EXPIRE_DATE = new Date(this.$store.state.sync.datePick.date).day10().replaceAll('/', '-');
			// 額外加押 OrderType (ex. 觸價後送一定範圍市價)
			if (this.oiOrderType)
				oiObj.ORDER_TYPE = this.oiOrderType;
			return oiObj;
		},
		/** 委託單 : 買賣別 */
		oiSide() {
			let result = this.btnSide;
			// 平倉
			if (this.btnSide === "CLOSE") {
				// 四顆按鈕情境：有指定的平倉方向
				if (this.forceSide) {
					result = this.forceSide;
				}
				// 三顆按鈕情境：自動判斷平倉方向
				else {
					result = this.psd.$NET_OFFSETABLE_QTY > 0 ? "SELL" : "BUY";
				}
			}
			return result;
		},
		/** 委託單 : 倉別 */
		oiPositionEffect() {
			let psd = this.psd;
			// TW情境
			if (this.twMode && !this.isOpt) {
				return this.dayTrade ? "DAYTRADE" : this.tw_PositionEffect;
			}
			// 證券一律給AUTO
			if (this.isStock) {
				return "AUTO";
			}
			// 備兌情境
			if (this.covered) {
				if (this.btnSide === "SELL")
					return "CWO";	// 備兌開倉
				else if (this.btnSide === "CLOSE")
					return "CWC";	// 備兌平倉
			}
			// 平倉選擇情境
			if (this.btnSide === "CLOSE")
				return "CLOSE";
			// 買賣按鈕一律帶 "OPEN" by https://trello.com/c/pYl8PPwm
			if (this.btnSide === "BUY" || this.btnSide === "SELL")
				return "OPEN";
			return "AUTO";
		},
		/** 委託單 : 校期别 (自動判斷) */
		oiTimeInForce() {
			// 高級下單盒情境
			if (this.orderBoxMode===1) {
				return this.$order.inputTimeInForce;				
			}
			// 一般下單盒情境 (自動判別)
			switch(this.orderType) {
				case 'MARKET':
				case '5LvlMKT':
				case 'BST':
				case 'MWP':
					return this.isSupportIoc ? 'IOC' : 'ROD';
				default:
					return "ROD";
			}
		},
		// 委託單 : 觸發條件
		oiCondition() {
			// GTD 單的 SMO.CONDITION 帶 STOP
			if (this.oiTimeInForce === 'GTD')
				return 'STOP';
			switch(this.orderType) {
				case "STOP":			// 停損市價
				case "STPLMT":			// 停損限價
					return 'STOP';
				case "MIT":				// 觸價市價
				case "LIT":				// 觸價限價
					return "IFTOUCHED";
				default:
					break;
			}
		},
		/** 委託單 : 委託價 */
		oiOrderPrice() {
			// 上海證券交易所/註冊制 : 保護限價
			if (this.isSSEProtection)
				return this.$order.inputProtectionPrice;
			// 對手價/本方價時(都視為交易所支持)，價格直接帶 0 https://trello.com/c/RAwjVfaL
			if (this.orderType === 'HIT' || this.orderType === 'JOIN')
				return 0;
			switch (this.btnSide) {
				case "BUY": return this.buyOrderPrice;
				case "SELL": return this.sellOrderPrice;
				case "CLOSE": return this.closeOrderPrice;
				default: return 0;
			}
		},
		// 委託單 : 停損價
		oiStopPrice() {
			if (this.orderType === "STOP" || this.orderType === "STPLMT")
				return this.inputStopPrice;
		},
		// 觸價
		oiTouchPrice() {
			if (this.orderType === 'MIT' || this.orderType === 'LIT')
				return this.inputTouchPrice;
		},
		// 委託單 : 觸發價
		oiTrgPrice() {
			// GTD 單的 SMO.CONDITION 帶 STOP
			if (this.oiTimeInForce === 'GTD')
				return parseFloat(this.inputOrderPrice);
			switch (this.orderType) {
				case 'STOP':	// 停損市價
				case 'STPLMT':	// 停損限價
					return parseFloat(this.inputStopPrice);
				case 'MIT':		// 觸價市價
				case 'LIT':		// 觸價限價
					return parseFloat(this.inputTouchPrice);
			}
		},
		// 額外的 OrderType 欄位
		oiOrderType() {
			// 台灣版 & 有顯示並勾選一定範圍市價
			if (this.twMode && this.displayRangeMarket && this.$store.state.order.useRangeMarket) {
				switch(this.$store.state.order.orderType) {
					case 'STOP':	// 停損市價
					case 'TSTOP':	// 移動停損市價
					case 'MIT':		// 觸價市價
						return 'RANGED';
				}
			}
		},
		/** 判斷ordertype是否為市價類委託 */
		isMktType() {
			let MKTList = ['MARKET', 'STOP', 'MIT'];
			return MKTList.indexOf(this.orderType) != -1;
		},
		// 當前是上交所
		isSSE() {
			return this.sid.indexOf('I.S.SSE') === 0;
		},
		// 買賣按鈕上方要要顯示固定文字時
		fixBtnTopText() {
			if (this.isMktType)
				return this.$ln(`市价`)
			let orderType = this.$order.orderType;
			// // 上交所時，對手價與排隊價要直接顯示
			// if (this.isSSE && (orderType === 'HIT' || orderType === 'JOIN'))
			if (orderType === 'HIT' || orderType === 'JOIN')
				return this.$store.state.config.mapOrderTypeLabel[this.$order.orderType];
			// 市價轉限價/最優市價/五檔市價/五檔市價轉限價 要直接顯示
			switch(orderType) {
				case 'MTL':
				case 'BST':
				case '5LvlMKT':
				case '5LvlMTL':
					return this.$store.state.config.mapOrderTypeLabel[this.$order.orderType]; 
			}
		},
		/** 買進按鈕上方文字 */
		buyBtnTopText() {
			if (this.showPriceDiff)
				return this.showBuyPrice;
			if (this.fixBtnTopText)
				return this.fixBtnTopText;
			return this.showBuyPrice || this.$ln(`市价`);
		},
		/** 賣出按鈕上方文字 */
		sellBtnTopText() {
			if (this.showPriceDiff)
				return this.showBuyPrice;
			if (this.fixBtnTopText)
				return this.fixBtnTopText;
			return this.showSellPrice || this.$ln(`市价`);
		},
		showBuyPrice() {
			let price = this.buyOrderPrice || this.inputOrderPrice;
			// 價格為0時不再轉換，直接回傳
			if(!price) return price;
			return this.$symbolPrice(this.sid, price);
		},
		showSellPrice() {
			let price = this.sellOrderPrice || this.inputOrderPrice;
			// 價格為0時不再轉換，直接回傳
			if(!price) return price;
			return this.$symbolPrice(this.sid, price);
		},
		/** 效期別選單 */
		tifOptions(){
			// 一定範圍市價不允許 ROD 選項
			if (this.orderType === 'MWP') {
				return [
					{label: 'IOC', value: 'IOC', selected: true},
					{label: 'FOK', value: 'FOK'},
				];
			}
			else {
				return [
					{label: 'ROD', value: 'ROD', selected: true},
					{label: 'IOC', value: 'IOC'},
					{label: 'FOK', value: 'FOK'},
				];
			}
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		$commas() {return this.$store.state.fn.$commas;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		/** 顯示3顆按鈕(一般模式或是證券商品)，另外加入tw必定顯示判斷 */
		show3Btn() {
			return this.orderBoxMode===0 || this.isStock || (this.twMode && !this.isOpt);
		},
		/** 顯示一般模式的平倉按鈕(非台灣模式且是高級模式或是非證券商品) */
		showNormalCloseBtn() {return !this.twMode && this.orderBoxMode===1 || !this.isStock;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		// 當沖
		dayTrade() {return this.twMode && !this.isOpt && !this.isDiffSymbol? this.$store.state.order.dayTrade: false;},
		// 是否為期權商品
		isOpt() {return M4C.Option.isOpt(this.sid);},
		// 是否為價差商品
		isDiffSymbol() {return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);},
		isInvalid() {
			return this.inputOrderPrice === "" || !this.inputOrderQty || isNaN(this.inputOrderQty);
		},
		// 啟用價差價格 (委託價可以為 0)
		showPriceDiff() {
			// if (this.isDiffSymbol) {
				if (this.orderType === 'LIMIT' || this.orderType === 'LIT' || this.orderType === 'STPLMT')
					return true;
			// }
		},
		// 上海證券交易所/註冊制 : 保護限價
		isSSEProtection() {
			return M4C.Order.isSSEProtection({'sid': this.sid, 'orderType': this.$order.orderType});
		},

		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerID] || {};
		},
		brokerSystem() {
			return this.brokerInfo.system || 'default';
		},
		// 交易所層級的總表
		exgOrderTypes() {
			try{return M4C.Symbol.getExgMainformInfo(this.sid).OrderTypes;}catch(e){}
		},
		// 交易所層級的委託類型資料。
		exgOrdertypeObj() {
			try{return this.exgOrderTypes[this.brokerSystem];}catch(e){}
		},
		// 該商品市價是否有支援IOC
		isSupportIoc() {
			let odObjList = this.exgOrdertypeObj;
			if (odObjList && Array.isArray(odObjList)) {
				let odObj = odObjList.find(od => od.name === "MARKET");
				if (odObj && odObj.types) {
					return odObj.types.find(tif => tif === "IOC");
				}
			}
		},
	},
}
</script>

<style>
.btn3 .order-btn {
	width: 6em;
}
.btn4 .order-btn {
	width: 4.8em;
}
</style>