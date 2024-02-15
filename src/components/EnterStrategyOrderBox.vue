<template>
    <div class="enter-strategy-orderbox-ctn flex-col">
    	<div class="flex-row">
			<div class="flex-1 flex-center">
				<SymbolCNM4 nameFontSize="font-size-xl" />
			</div>
			<div class="flex-1 flex-center">
				<SymbolMiniQ />
			</div>
    	</div>
		<div class="border mgt5 mglr3" />
		<!-- 进场策略/ -->
		<div class="flex-center mgtb5">{{$ln(strategyName)}}</div>

		<div class="flex-center">
			<table>
				<tr>
					<td class="pdtb4 clr-gray pdr4">{{$ln(`上方触发价`)}}</td>
					<td class="pdtb4"><InputPrice v-model.number="inputTouchPrice1" /></td>
				</tr>
				<tr>
					<td class="pdtb4 clr-gray pdr4">{{$ln(`下方触发价`)}}</td>
					<td class="pdtb4"><InputPrice v-model.number="inputTouchPrice2" /></td>
				</tr>
				<tr>
					<td class="pdtb4 clr-gray pdr4">{{$ln(`手数`)}}</td>
					<td class="pdtb4"><InputQty v-model.number="inputQty" /></td>
				</tr>
			</table>
		</div>


		<div class="flex-row mglr5 pdl3 mgb5" v-if="displayDenySplit">
			<div class="label flex-start clr-gray"></div>
			<span class="flex-1 mgt1 pdr5 flex-center font-size-mini">{{$ln("OCO条件单不支持拆单")}}</span>
		</div>
		<div class="flex-1"/>
		<div class="flex-center mg5 pdlr5">{{$ln(`本策略采用OCO原端条件单，实际成交价可能与触发价有些差距`)}}</div>
		<div class="flex-center mgb5 pdb5">
			<Button class="btn-confirm" @click="onBtnOrder">{{$ln(`送出`)}}</Button>
		</div>
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
export default {
	mixins: [QuoteAgent],
	props: ["param"],
	data() {
		return {
			inputTouchPrice1: 0,
			inputTouchPrice2: 0,
			inputQty: 1,
		}
	},
	beforeMount() {},
    mounted() {
		this.inputTouchPrice1 = this.qo.p;
		this.inputTouchPrice2 = this.qo.p;
		this.inputQty = this.$store.getters.getDefaultQty || 1;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onBtnOrder() {
			let orderInfo = this.orderInfo;
			// 是否跳出確認視窗
			if (this.$store.state.order.confirm){
				// 提示确认视窗
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: orderInfo}, {transName: 'float'});
			}
			else {
				M4C.Order.sendOrder(orderInfo);
				// 關閉自己
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
			}
		}
	},
	watch: {},
    computed: {
		// 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		type() {
			return this.param.type;
		},
		/** 策略显示名称 */
		strategyName() {
			switch(this.type) {
				case 0: return `突破策略`;
				case 1: return `震荡策略`;
				case 2: return `区间做多`;
				case 3: return `区间做空`;
			}
		},
		side1() {
			return this.type === 0 || this.type === 2 ? "BUY" : "SELL";
		},
		side2() {
			return this.type === 1 || this.type === 2 ? "BUY" : "SELL";
		},
		orderType1() {
			return this.type === 3 ? "LIMIT" : "MARKET";
		},
		orderType2() {
			return this.type === 2 ? "LIMIT" : "MARKET";
		},
		orderPrice1() {
			return this.type === 3 ? this.inputTouchPrice1 : 0;
		},
		orderPrice2() {
			return this.type === 2 ? this.inputTouchPrice2 : 0;
		},
		smoCondition1() {	// [1震盪策略] 與 [3區間做空] => IFTOUCHED
			return this.type === 1 || this.type === 3 ? "IFTOUCHED" : "STOP";
		},
		smoCondition2() {	// [1震盪策略] 與 [2區間做多] => IFTOUCHED
			return this.type === 1 || this.type === 2 ? "IFTOUCHED" : "STOP";
		},
		tcOrderType1() {
			let typeMap = ["STOP", "MIT", "STOP", "LIT"];
			return typeMap[this.type];
		},
		touchPrice1() {if (this.type === 1 || this.type === 3) return Number(this.inputTouchPrice1);},
		stopPrice1() {if (this.type === 0 || this.type === 2) return Number(this.inputTouchPrice1);},
		tcOrderType2() {
			let typeMap = ["STOP", "MIT", "LIT", "STOP"];
			return typeMap[this.type];
		},
		touchPrice2() {if (this.type === 1 || this.type === 2) return Number(this.inputTouchPrice2);},
		stopPrice2() {if (this.type === 0 || this.type === 3) return Number(this.inputTouchPrice2);},
		orderInfo() {
			return {
				"ACTION": "NEW",
				'AP_PLUGIN': this.useComName || this.selfComName,
				"SMO_TYPE": "SMO",
				"OCO": [{
					"SYMBOL": this.sid,
					"SIDE": this.side1,
					"POSITION_EFFECT": "OPEN",
					"TC_ORDER_TYPE": this.tcOrderType1,
					"TIME_IN_FORCE": this.orderType1 === "MARKET" ? "IOC" : "ROD",
					"ORDER_PRICE": Number(this.orderPrice1),
					"ORDER_QTY": this.inputQty,
					"TOUCH_PRICE": this.touchPrice1,
					"STOP_PRICE": this.stopPrice1,
				}, {
					"SYMBOL": this.sid,
					"SIDE": this.side2,
					"POSITION_EFFECT": "OPEN",
					"TC_ORDER_TYPE": this.tcOrderType2,
					"TIME_IN_FORCE": this.orderType2 === "MARKET" ? "IOC" : "ROD",
					"ORDER_PRICE": Number(this.orderPrice2),
					"ORDER_QTY": this.inputQty,
					"TOUCH_PRICE": this.touchPrice2,
					"STOP_PRICE": this.stopPrice2,
				}]
			};
		},
		// 是否显示 "OCO条件单不支持拆单" 的提示讯息
		displayDenySplit() {
			if (!this.twMode) {
				if (this.sid.indexOf('I.F') === 0 && this.$store.state.order.futSplitQty !== 0) return true;
				if (this.sid.indexOf('I.O') === 0 && this.$store.state.order.optSplitQty !== 0) return true;
			}
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	},
}
</script>

<style scoped>
.border {
	border-bottom: 2px solid #54575B;
}
</style>