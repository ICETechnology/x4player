<template>
	<div class="flex-row flex-center order-BS-btn-wrapper">
		<Button v-if="!mode" class="flex-center flex-col obtn bgc-B w25vw ht4 rd6 clr-white" @click="onBtnOrder('BUY', buyOrderPrice)" v-html="bBtnHtml"/>
		<div v-if="!mode" class="flex-row flex-center inputs-ctn" :class="{'ipt-btn rd6 ht4': iptStyle=='button'}">
			<div class="w25vw">
				<div class="price-label" > {{ qoPrice }} </div>
				<InputQty v-model="inputOrderQty" class="font-size-normal posr" />
			</div>
		</div>
	
		<Button v-if="!mode" class="flex-center flex-col obtn bgc-btn-sell w25vw ht4 rd6 clr-white" @click="onBtnOrder('SELL', sellOrderPrice)" v-html="sBtnHtml"/>
		<div class="flex-1 flex-row fast-mode space-around" v-if="mode=='fast'">
			<Button class="rd1 bgc-up clr-white pdlr5 w10vw mgr2" @click="onBtnOrder('BUY')">{{$ln('快买')}}</Button>
			<Button class="rd1 bgc-dn clr-white pdlr5 w10vw" @click="onBtnOrder('SELL')">{{$ln('快卖')}}</Button>
		</div>
	</div>
</template>

<script>
export default {
	props: ["iptStyle", "orderType", "tif", "value", "mode", 'useComName', 'qoPrice'],
	data() {
		return {
			/** 委託量 v-model */
			inputOrderQty: 1,
			/** 台灣交易所 - 倉別 */
			tw_PositionEffect: "AUTO",
			/** 当冲 */
			dayTrade: false,
			side: '',
		}
	},
	beforeMount() {},
    mounted() {
		// 初始化數量
		this.inputOrderQty = this.value || this.$store.getters.getDefaultQty || 1;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onBtnOrder(side, orderPrice) {
			this.side = side;
			let orderInfo = {
				'ACTION': 'NEW',						// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,
				'SIDE': side,							// 買BUY/賣SELL
				// 更新，改以下單盒的邏輯判斷倉別(暫沒有加入備兌、平倉，因為目前沒用到)
				'POSITION_EFFECT': this.oiPositionEffect,// 設計稿設定默設定自動倉 // 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.oiOrderType,		// 市價單MARKET/限價單LIMIT/對手價OPPOSITE(HIT)
				'TIME_IN_FORCE': this.tif || 'ROD',		// 設計稿設定默設定IOC // ROD/IOC/FOK
				'ORDER_PRICE': this.type === "MARKET"? 0: orderPrice,
				'ORDER_QTY': parseFloat(this.inputOrderQty),
				'AP_PLUGIN': this.useComName || this.selfComName,
				'SMO_TYPE': 'NONE',
				// 數量故意設字串可用於測試 order回應錯誤 / 無對應回報 / 委託無回應 情境
				// 'ORDER_QTY': `${this.inputOrderQty}`,
			};
			// 外層如果是以對手價帶入，則委託確認示對手價。
			if(this.orderType == "HIT"){
				orderInfo.ORDER_PRICE = side == 'BUY'? this.sellOrderPrice: this.buyOrderPrice;
				// 仍無委託價時 (ex.盤前無買賣價)，提示並阻擋委託
				if (!orderInfo.ORDER_PRICE) {
					eventBus.$emit("CONFIRM-DIALOG", {
						content: this.$ln("市场无持续报价"),
						confirmOnly: true
					});
					return;
				}
			}
			// 是否為台灣版
			if(this.twMode) {
				// 下單盒頁面
				eventBus.$emit("ORDER", {
					positionEffect: 'OPEN',
					orderPrice: side == 'BUY'? Number(this.buyOrderPrice) : this.sellOrderPrice,
					orderQty: this.inputOrderQty,
					side: this.side
				});
			} else{
				// 是否跳出確認視窗
				if (this.$store.state.order.confirm){
					eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: orderInfo}, {transName: 'float', '$HEAD': {'title': this.$ln(`委托确认`)}});
				}
				else{
					M4C.Order.sendOrder(orderInfo);
				}
			}
		},
		// 主要處理當啟用一定範圍市價時將MARKET改為RANGED
		getOrderType(type){
			if(this.useRangeMarket && this.isMWP && type === "MARKET")
				return "MWP";
			if(type === "HIT")
				return "LIMIT";
			else return type;
		},
	},
	watch: {
		inputOrderQty(nv, ov){
			if(nv != ov)
				this.$emit("input", nv);
		}
	},
    computed: {
		sid() {return this.$store.state.selectedSymbol.ID;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		oiOrderType() {return this.getOrderType(this.type);},
		useRangeMarket() {return this.$store.state.thunder.useRangeMarket;},
		orderTypeList() {return M4C.Symbol.getOrderType(this.sid).split(';');},
		// 是否可用一定範圍市價
		isMWP() {return this.orderTypeList.indexOf("MWP") != -1},
		type() {
			return this.orderType || this.$store.state.order.orderType;
		},
		/** 關注商品代碼 */
		sid() {return this.$store.state.selectedSymbol.ID;},
		/** 關注商品QuoteObject */
		qo() {return this.$store.state.selectedSymbol.QO;},
		/** 買進按鈕內容 */
		bBtnHtml() {
			return `
				<div>${this.type === "MARKET"? `${this.$ln('市价')}`: this.$symbolPrice(this.sid, this.buyOrderPrice) || ''}</div>
				<div>${this.$ln('买进')}</div>`;
		},
		/** 賣出按鈕內容 */
		sBtnHtml() {
			return `
				<div>${this.type === "MARKET"? `${this.$ln('市价')}`: this.$symbolPrice(this.sid, this.sellOrderPrice)  || ''}</div>
				<div>${this.$ln('卖出')}</div>`;
		},
		/** 買進委託價格 */
		buyOrderPrice() {
			return this.qo.bp1;
		},
		/** 賣出委託價格 */
		sellOrderPrice() {
			return this.qo.sp1;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		isStock() {return this.sid.split(".")[1] === "S"},
		twMode() {return this.$store.state.config.twMode;},
		/** 委託單 : 倉別 */
		oiPositionEffect() {
			// TW情境
			if (this.twMode) {
				return this.dayTrade ? "DAYTRADE" : this.tw_PositionEffect;
			}
			// 證券一律給AUTO
			if (this.isStock) {
				return "AUTO";
			}
			// 買賣按鈕一律帶 "OPEN" by https://trello.com/c/pYl8PPwm
			if (this.side === "BUY" || this.side === "SELL")
				return "OPEN";
			return "AUTO";
		},
	},
}
</script>

<style scoped>
.price-label{
	text-align: center;
	margin-bottom: 2px;
}
.label {
	white-space: nowrap;
	overflow: hidden;
}
.inputs-ctn {
	/* width: 40%; */
	height: 10vw;
}
/* 圓形按鈕 */
.app-ctn .order-BS-btn-wrapper .inputs-ctn .cbtn {
	margin: 2px;
	border-radius: 5vh;
	width: 10vw;
	height: 10vw;
	color: black;
	background: #EEE;
}
.app-ctn .order-BS-btn-wrapper .inputs-ctn input {
	text-align: center;
	width: 12vw;
	height: 10vw;
	padding: 0;
	border: 0;
	border-radius: 6px;
}
.ipt-btn {
	background-color: white;
}
.ipt-btn /deep/ .cbtn {
	background: none;
	margin: 0;
	position: absolute;
}
.ipt-btn /deep/ .input-qty-ctn {
	border: none;
}
.ipt-btn /deep/ .input-qty-ctn, .ipt-btn /deep/ .input-qty-ctn input {
	background-color: rgba(0,0,0,0) !important;
	color: black !important;
}
.ipt-btn /deep/ .input-qty-ctn>div:first-of-type.cbtn {
	left: 0vw;
}
.ipt-btn /deep/ .input-qty-ctn>div:last-of-type.cbtn {
	right: 0vw;
}
.desktop .inputs-ctn{
	width: 30%;
	max-width: 10em;
}
.desktop .obtn {
	width: 30%;
	max-width: 10em;
}
.desktop .inputs-ctn /deep/ .input-qty{
	border-radius: 50% !important;
}
@media screen and (orientation: landscape) {
	/* 圓形按鈕 */
	.app-ctn .order-BS-btn-wrapper .inputs-ctn .cbtn {
		margin: 2px;
		border-radius: 5vw;
		width: 10vh;
		height: 10vh;
		color: black;
		background: #EEE;
	}
	.app-ctn .order-BS-btn-wrapper .inputs-ctn input {
		text-align: center;
		width: 12vh;
		height: 10vh;
		padding: 0;
		border: 0;
		border-radius: 6px;
	}
	.inputs-ctn {
		width: 34vh;
		height: 10vh;
	}
	.fast-mode>.button-ctn{
		height: 9vh;
		padding: 0 5vh;
	}
}
</style>