<template>
    <div class="stop-loss-ctn flex-col" :class="{'overflow-y-auto': isDesktop}">
		<MarginMini class="bgc-orange pdlr3 pdtb1d5" uiStyle="2" />
		<div class="flex-col pd4" >
			<div class="symbolRow flex-row space-between pd2">
				<SymbolCNM4 nameFontSize="flex-1" :flexRow="true" />
				<SymbolMiniQ :symbol="sid" :flexRow="true" class="nowrap" />
			</div>
			<SymbolPositionRow class="mgtb2" />
		</div>
		<div class="mode-switch flex-row space-around ">
			<span @click="mode='stoploss'" class="flex-col flex-center">
				<span class="flex-1 pdtb2" :class="{'clr-gray': mode!='stoploss'}">{{$ln('止盈止损')}}</span>				
				<span class="focus-line" :class="{focus: mode=='stoploss'}" />
			</span>
			<span @click="mode='homoto'" class="flex-col flex-center">
				<span class="flex-1 pdtb2" :class="{'clr-gray': mode!='homoto'}">{{$ln('保本单')}}</span>
				<span class="focus-line" :class="{focus: mode=='homoto'}" />
			</span>
		</div>
		<div class="stop-loss-body flex-col font-size-micro pdl4 pdt4 flex-1 overflow-y-auto" v-stop-propagation-y>
			<div class="flex-row">
				<div class="flex-1">
					<SymbolPositionRow mode="orderBlockSimplePos" :showDeGa="!twMode" class="position-info-ctn pdlr4 clr-gray2"/>
					<!-- 因台灣版不加delta、gamma資料所以另外加元素撐高度 -->
					<div class="simDeGa" v-if="twMode" />
        			<div class="divider-bottom mgtb2" />
					<StopLossOrderInfo class="flex-1 pdlr4" :mode="mode" :param="param" />
				</div>
				<OrderConditionStopLoss class="condition-ctn font-size-mini pdtb2 pdlr4 flex-1" :mode="mode" :param="param" />
			</div>
			<StopLossWarning class="flex-col rd2 pdr4 font-size-small" />
		</div>
		<div class="stop-loss-foot flex-row flex-bottom mgb10 pdlr4">
			<Button class="close-btn w100p ht2 rd1 clr-white" v-if="param" @click="onCloseClick" :class="{'disabled': !offsetableNetQty}">{{$ln("送出")}}</Button>
		</div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
import OrderConditionStopLoss from "@/components/Order/OrderConditionStopLoss.vue";
import StopLossOrderInfo from "@/components/StopLossOrderInfo.vue";
import StopLossWarning from "@/components/StopLossWarning.vue";

export default {
	mixins: [QuoteAgent],
	props: ['param', 'suspend'],
	data() {
		return {
			mode: "stoploss",
			isLoading: true, 
			side: 'BUY',
			effect: 'AUTO',
        }
	},
	beforeMount() {
		this.$store.commit("setSelectedSymbol", this.sid);
	},
    mounted() {
		this.$emit('title', this.$ln('止盈止损'));
	},
	beforeDestroy() {},
	components: {
		OrderConditionStopLoss,
		StopLossOrderInfo,
		StopLossWarning,
	},
    methods: {
		// 平倉
		onCloseClick() {
			this.side = this.offsetableNetQty > 0 ? "SELL" : "BUY";
			this.effect = "CLOSE";
			// 如果設定備兌平，調整POSITION_EFFECT參數
			if(this.$store.state.order.covered){
				this.effect = 'CWC';
			}
			this.sendOrder();
		},
		// 委託下單按鈕
		sendOrder() {
			let stopGainPrice = parseFloat(this.inputProfitPrice);
			let stopLossPrice = parseFloat(this.inputLossPrice);
			let effect = this.param? 'CLOSE': this.effect;
			let orderInfo;
			// 止損+止盈 智慧單
			if (this.mode == 'stoploss') {
				orderInfo = this.getOCOOrderObj(this.side, this.inputQty, stopGainPrice, stopLossPrice, effect);
			}
			// 保本單
			else if(this.mode == 'homoto') {
				orderInfo = this.getHomotoOrderObj();
			}

			if (this.$store.state.order.confirm){
				// 彈出下單確認頁
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {
					orderInfo: orderInfo, 
					onConfirmCallback: ()=> {eventBus.$emit("CLOSE-DIALOG");} //確認後關閉止盈止損
				}, {
					transName: 'float', 
					'$HEAD': {'title': this.$ln(`委托确认`)}
				});
			}
			else {
				M4C.Order.sendOrder(orderInfo);
			}
		},
		getHomotoOrderObj() {
			let orderInfo = {
				"ACTION": "NEW",
				"SYMBOL": this.sid,
				"SIDE": this.side,
				"POSITION_EFFECT": this.effect,
				"TC_ORDER_TYPE": this.oiOrderType1,
				"TIME_IN_FORCE": this.selectTimeInForce1,
				// 目前server支援市價、對手價、限價，其中除了限價外ORDER_PRICE須帶0
				"ORDER_PRICE": this.oiBuyOrderPrice,
				"ORDER_QTY": this.inputQty,
				"TS_LEVEL": this.priceJump1,
				"TRAILING_TYPE": "GUARANTEE",
				"TRAILING_VALUE": this.inputProfitPrice,
				"SMO_TYPE": 'SMO',
				'AP_PLUGIN': this.useComName || this.selfComName,
				// 由client 自訂的委託類型(保本單)
				"IS_HOMOTO": true,
			};
			// 一定範圍市價時另外帶ORDER_TYPE
			if(this.selectOrderType === "MWP")
				orderInfo.ORDER_TYPE = "RANGED";
			return orderInfo;
		},
		getOCOOrderObj(side, qty, stopGainPrice, stopLossPrice, effect){
			let orderInfo = {
				"ACTION": "NEW",
				'AP_PLUGIN': this.useComName || this.selfComName,
				"SMO_TYPE": 'SMO',
				"OCO": [{
					"SYMBOL": this.sid,
					"SIDE": side,
					"POSITION_EFFECT": this.effect,
					"TC_ORDER_TYPE": this.oiOrderType1,
					"TIME_IN_FORCE": this.selectTimeInForce1,
					// 目前server支援市價、對手價、限價，其中除了限價外ORDER_PRICE須帶0
					"ORDER_PRICE": this.oiBuyOrderPrice,
					"ORDER_QTY": qty,
					"STOP_PRICE": this.oiOrderType1=="STOP" || this.oiOrderType1 == "STPLMT"? stopGainPrice :undefined,
					"TOUCH_PRICE": this.oiOrderType1=="MIT" || this.oiOrderType1 == "LIT"? stopGainPrice :undefined,
				}, {
					"SYMBOL": this.sid,
					"SIDE": side,
					"POSITION_EFFECT": this.effect,
					"TC_ORDER_TYPE": this.oiOrderType2,
					"TIME_IN_FORCE": this.selectTimeInForce2,
					"ORDER_PRICE": this.oiSellOrderPrice,
					"ORDER_QTY": qty,
					"STOP_PRICE": this.oiOrderType2=="STOP" || this.oiOrderType2 == "STPLMT"? stopLossPrice :undefined,
					"TOUCH_PRICE": this.oiOrderType2=="MIT" || this.oiOrderType2 == "LIT"? stopLossPrice :undefined,
				}],
			};
			// 一定範圍市價時另外帶ORDER_TYPE
			if(this.selectOrderType === "MWP") {
				orderInfo.OCO[0].ORDER_TYPE = "RANGED";
				orderInfo.OCO[1].ORDER_TYPE = "RANGED";
			}
			return orderInfo;
		},
	},
	watch: {
		// 有市況時更新止盈止損價格
		$qoPrice(nv, ov) {
			if(!ov && nv) {
				this.isLoading = false;
			}
		},
	},
    computed: {
		// 預設止盈價
		inputProfitPrice() {return this.$store.state.order.inputOcoCondition1Price;},
		// 預設停損價
		inputLossPrice() {return this.$store.state.order.inputOcoCondition2Price;},
		// 委託類型
		selectOrderType() {return this.$store.state.order.orderType;},
		// 委託數量
		inputQty() {return this.$store.state.order.inputOrderQty;},
        // 從價格別自動判別效期別。
        selectTimeInForce1() {
            return this.$store.state.order.inputTimeInForce;
        },
		selectTimeInForce2() {
            return this.$store.state.order.inputTimeInForce;
        },
		// 價格跳數。
		priceJump1(){
			// 對手價跳數。
			if(this.selectOrderType == "HIT") return 1;
			// 超價跳數
			if(this.selectOrderType == "OVER") return this.overJump;
		},
		priceJump2(){
			// 對手價跳數。
			if(this.selectOrderType == "HIT") return 1;
			// 超價跳數
			if(this.selectOrderType == "OVER") return this.overJump;
		},
        // 由部位加值欄位取淨倉數量
		offsetableNetQty() {
            return this.ssps? this.ssps.$NET_OFFSETABLE_QTY: 0;
		},
		sid() {
			return this.param && this.param.SYMBOL? this.param.SYMBOL: this.$store.state.selectedSymbol.ID;
		},
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		// 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		orderTypeInfo() {
			if(this.selectOrderType == "OVER")
				return `${this.$ln(this.overBase)}${this.$ln('加')} ${this.overJump} ${this.$ln('跳')}`
		},
		$TickSize() {return this.$store.state.selectedSymbol.MInfo.TickSize;},
		// 委託對手價1
		oppositePrice1() {
			let bsPrice = this.offsetableNetQty > 0 ? -this.$TickSize: this.$TickSize;
			return this.$safeFloat(this.inputProfitPrice + Number(bsPrice));
		},
		// 委託對手價2
		oppositePrice2() {
			let bsPrice = this.offsetableNetQty < 0 ? -this.$TickSize: this.$TickSize;
			return this.$safeFloat(this.inputLossPrice + Number(bsPrice));
		},
		// 委託超價1
		overPrice1() {
			let diffPrice = this.$safeFloat(this.$TickSize * this.overJump);
				diffPrice = this.offsetableNetQty > 0 ? -diffPrice: diffPrice;
			return this.$safeFloat(this.inputProfitPrice + diffPrice);
		},
		// 委託超價2
		overPrice2() {
			let diffPrice = this.$safeFloat(this.$TickSize * this.overJump);
				diffPrice = this.offsetableNetQty < 0 ? -diffPrice: diffPrice;
			return this.$safeFloat(this.inputLossPrice + diffPrice);
		},
		// 超價跳數
		overJump() {return this.$store.state.order.overJump;},
		// 超價基低價格
		overBase() {return this.$store.state.order.overBase;},
		$Ticksize() {return this.$store.state.selectedSymbol.MInfo.$TickSize;},
		isMarket() {return this.selectOrderType === "MARKET" || this.selectOrderType === "MWP";},
		// 委託價別
		oiOrderType1() {
			// 保本單 除市價外其他皆以移動停損限價單委託。
			if(this.mode=="homoto") return this.isMarket? 'TSTOP': 'TSTPLMT';
			if(this.offsetableNetQty > 0) {
				if(this.inputProfitPrice < this.$qoPrice) return this.isMarket? "STOP": "STPLMT";
				else return this.isMarket? "MIT": "LIT";
			}
			else {
				if(this.inputProfitPrice > this.$qoPrice) return this.isMarket? "STOP": "STPLMT";
				else return this.isMarket? "MIT": "LIT";
			}
		},
		oiOrderType2() {
			if(this.offsetableNetQty > 0) {
				if(this.inputLossPrice < this.$qoPrice) return this.isMarket? "STOP": "STPLMT";
				else return this.isMarket? "MIT": "LIT";
			}
			else {
				if(this.inputLossPrice > this.$qoPrice) return this.isMarket? "STOP": "STPLMT";
				else return this.isMarket? "MIT": "LIT";
			}
		},
		oiBuyOrderPrice() {
			if(this.mode=="homoto") {
				switch(this.selectOrderType){
					case 'LIMIT':
						return this.inputProfitPrice;
					case 'HIT':
						return this.oppositePrice1;
					case 'OVER':
						return this.overPrice1;
					default:
						return 0;
				}
			}
			// 限價
			if(this.selectOrderType === 'LIMIT') return this.inputProfitPrice;
			// 停板價、限價是限價其餘委託價是旗標價所以帶0;
			else if(this.selectOrderType === 'PRICELIMIT') return this.qo.hl;
			// 超價
			else if(this.selectOrderType == "OVER") {
				let diffPrice = this.$Ticksize * this.overJump;
				if(this.side == "BUY") {return this.$safeFloat(this.inputProfitPrice + diffPrice);}
				else {return this.$safeFloat(this.inputProfitPrice - diffPrice);}
			}
			// 對手價
			else if(this.selectOrderType === "HIT") {
				if(this.side == "BUY") {return this.$safeFloat(this.inputProfitPrice + this.$Ticksize);}
				else {return this.$safeFloat(this.inputProfitPrice - this.$Ticksize);}
			}
			else return 0;
		},
		oiSellOrderPrice() {
			// 限價
			if(this.selectOrderType === 'LIMIT') return this.inputLossPrice;			
			// 停板價、限價是限價其餘委託價是旗標價所以帶0;
			else if(this.selectOrderType === 'PRICELIMIT') return this.qo.ll;
			// 超價
			else if(this.selectOrderType == "OVER") {
				let diffPrice = this.$Ticksize * this.overJump;
				if(this.side == "BUY") {return this.$safeFloat(this.inputLossPrice + diffPrice);}
				else {return this.$safeFloat(this.inputLossPrice - diffPrice);}
			}
			// 對手價
			else if(this.selectOrderType === "HIT") {
				if(this.side == "BUY") {return this.$safeFloat(this.inputLossPrice + this.$Ticksize);}
				else {return this.$safeFloat(this.inputLossPrice - this.$Ticksize);}
			}
			else return 0;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
    }
}
</script>

<style scoped>

.close-btn {
	background-color: #0065A4;
}
.condition-ctn {
	box-sizing: border-box;
	width:48%;
}
.pdtb0 {
	padding-top: 0;
	padding-bottom: 0;
}
.position-info-ctn /deep/ .symbol-position-row {
	padding: 0;
}
.mode-switch {
	background-color: #17202A;
}
.focus-line {
	width: 3em;
	height: 4px;
}
.focus {
	background-color: orange;
}
.prompt-text {
	border: 2px dashed #393939;
}
.simDeGa {
	min-height: 3em;
}
@media screen and (max-height: 620px) {
	.mgb10{
		margin-bottom: 1vw;
	}
}
</style>