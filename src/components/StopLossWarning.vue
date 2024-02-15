<template>
    <div class="stop-loss-warning-ctn">
        <div class=" flex-col mgb1 prompt-text rd1 pd4 mgt4 mglr4 font-size-small" :class="{pdtb5: !isOrderWarning && offsetableNetQty}">
			<div v-if="displayDenySplit">
				{{$ln("OCO条件单不支持拆单")}}
			</div>
			<div>
            	{{$ln(`止盈止损采取OCO云端条件单, 实际成交价可能与触发价有些差距`)}}
			</div>
		</div>
		<div class="stop-loss-warning flex-col pd4 mglr4 font-size-small">
			<span class="flex-center clr-warn order-warning" v-if="offsetableNetQty && isOrderWarning">{{$ln('风险提示')}} : {{$ln(isOrderWarning)}}</span>
			<span class="flex-center clr-warn order-warning font-bold" v-if="!offsetableNetQty">{{$ln("无可平仓口数!")}}</span>
		</div>
    </div>
</template>
<script>
export default {
    data() {
        return {}
    },
    props: [],
    methods: {},
    computed: {
        minfo() {return this.$store.state.selectedSymbol.MInfo;},
		qo() {return this.$store.state.selectedSymbol.QO;},
		qop() {
			return this.qo.p || this.qo.r || this.qo.pc || 0;
		},
        // 由部位加值欄位取淨倉數量
		offsetableNetQty() {
            return this.ssps? this.ssps.$NET_OFFSETABLE_QTY: 0;
		},
        // 有效(淨倉)數量
		availableQty() {
			return this.ssps? Math.abs(this.offsetableNetQty): 1;
		},
        // 關注商品的持倉資料
        ssps() {return this.$store.state.selectedSymbol.positionSum;},
        // 止盈價格
        inputProfitPrice() {return this.$store.state.order.inputOcoCondition1Price;},
        // 止損價格
        inputLossPrice() {return this.$store.state.order.inputOcoCondition2Price;},
		// 止盈止損價立即成交警示訊息
		isOrderWarning() {
			let warning = "";
			// 多頭 && 止盈价格 < 最新价
			if (this.offsetableNetQty > 0 && Number(this.inputProfitPrice) < this.$store.state.selectedSymbol.QO.p) {
				warning = "您设定的价格，止盈委托可能会立即触发成交！";
			}
			// 空頭 && 止盈价格 > 最新价
			else if (this.offsetableNetQty < 0 && Number(this.inputProfitPrice) > this.$store.state.selectedSymbol.QO.p) {
				warning = "您设定的价格，止盈委托可能会立即触发成交！";
			}
			// 多頭 && 止损价格 > 最新价
			else if (this.offsetableNetQty > 0 && Number(this.inputLossPrice) > this.$store.state.selectedSymbol.QO.p) {
				warning =  "您设定的价格，止损委托可能会立即触发成交！";
			}
			// 空頭 && 止损价格 < 最新价
			else if (this.offsetableNetQty < 0 && Number(this.inputLossPrice) < this.$store.state.selectedSymbol.QO.p) {
				warning =  "您设定的价格，止损委托可能会立即触发成交！";
			}
			return warning;
		},
		// 台灣模式
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		sid() {
			return this.$store.state.selectedSymbol.ID;
		},
		orderQty() {return this.$store.state.order.inputOrderQty;},
		// 是否显示 "OCO条件单不支持拆单" 的提示讯息
		displayDenySplit() {
			if (!this.twMode) {
				if (this.sid.indexOf('I.F') === 0 && this.$store.state.order.futSplitQty !== 0 && this.orderQty > 1) return true;
				if (this.sid.indexOf('I.O') === 0 && this.$store.state.order.optSplitQty !== 0 && this.orderQty > 1) return true;
			}
		},
    },
}
</script>
<style scoped>
.prompt-text {
	border: 2px dashed #393939;
}
</style>