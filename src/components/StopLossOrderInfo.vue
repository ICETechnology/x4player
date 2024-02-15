<template>
    <div class="stop-loss-orderInfo-ctn flex-col">
        <!-- 為了效期別空一列 -->
        <div class="flex-row mgb3">  </div>
        <div class="flex-row mgb3" v-if="orderTypeInfoText">
            <span class="label flex-start"></span>
            <span class="flex-1 content">{{orderTypeInfoText}}</span>
        </div>
        <div class="flex-col mgb3" v-if="mode!='homoto'">
            <span class="profit-info label">{{$ln("止盈触发价")}}:</span>
            <span class="flex-1 content mgt1" :class="[{'clr-up': calcProfitPrice > 0}, {'clr-dn': calcProfitPrice < 0}]">
                {{$safeFloat(calcProfitPrice, 1) || "--"}} ({{$safeFloat(calcPLPercent(inputProfitPrice)) || '--'}}%)
            </span>
        </div>
        <div class="loss-info flex-col mgb3" v-if="mode!='homoto'">
            <span class="profit-info label">{{$ln("止损触发价")}} :</span>
            <span class="flex-1 content mgt1" :class="[{'clr-up': calcLossPrice > 0}, {'clr-dn': calcLossPrice < 0}]">
                {{$safeFloat(calcLossPrice, 1) || "--"}} ({{$safeFloat(calcPLPercent(inputLossPrice)) || '--'}}%)
            </span>
        </div>
        <div class="loss-info flex-col mgb3" v-if="mode=='homoto'">
            <span class="profit-info label">{{$ln("触发盈利价差")}}:</span>
            <span class="flex-1 content mgt1" :class="[{'clr-up': diffProFitPrice > 0}, {'clr-dn': diffProFitPrice < 0}]">
                {{$safeFloat(diffProFitPrice, 1) || "--"}} ({{$safeFloat(diffProFitPercent) || '--'}}%)
            </span>
        </div>
        <div class="qty-info flex-row mgb3">
            <span class="label">{{$ln("手数")}} :</span>
            <span class="flex-1 flex-end content-text">{{inputQty}}</span>
        </div>
        <!-- 備兌 -->
		<div v-if="offsetableCoveredQty && isETF && !$store.state.login.isSIM" class="flex-row flex-start mgb3">
			<span class="font-size-small clr-gray2 flex-1">{{$ln(`备兑`)}}</span>
			<Toggle class="mgl1 toggle-mini" v-model="$store.state.order.covered" :mode="'mini'" />
		</div>
    </div>
</template>
<script>
export default {
    data() {
        return{}
    },
    props: ['mode', 'param'],
    methods: {
		// 計算損益百分比
		calcPLPercent(price) {
			if(!this.param || isNaN(price) || !this.offsetableNetQty) return 0.00;
			let timesBS = this.offsetableNetQty > 0 ? 1 : -1;
			let avgPrice = this.offsetableNetQty > 0 ? this.param.$BAVG : this.param.$SAVG;
			// 回傳持仓均价与止盈、停損价格的差距百分比
			return parseFloat((price - avgPrice) / avgPrice * 100 * timesBS).toFixed(2);
		},
		// 計算損益
		calcPLPrice(price) {
			if(!this.param || isNaN(price)) return "--"; //新倉沒有損益。
			// 空頭/多頭 決定增減方向
			let timesBS = this.offsetableNetQty > 0 ? 1 : -1;
			let priceAvg = this.offsetableNetQty > 0 ? this.param.$BAVG : this.param.$SAVG;
            let ts = M4C.Symbol.getTickSize(this.sid, priceAvg);
			let weight = this.$store.state.selectedSymbol.MInfo.Weight;
			let pointVal = weight * ts;
			// 指定的 止盈止損價 與 持倉均價 的差價
			let diffPrice = (price - priceAvg) / ts;
			// 盈虧
			let stopLossProfit = diffPrice * pointVal * this.inputQty * timesBS;
			
			return stopLossProfit;
		},
    },
    computed: {
        sid() {return this.$store.state.selectedSymbol.ID;},
        // 委託別
		orderType() {
			return this.$order.orderType;
		},
        // 由部位加值欄位取淨倉數量
		offsetableNetQty() {
            return this.ssps? this.ssps.$NET_OFFSETABLE_QTY: 0;
		},
        $order() {
			return this.$store.state.order;
		},
        // 關注商品的持倉資料
        ssps() {return this.$store.state.selectedSymbol.positionSum;},
        // 止盈價格
        inputProfitPrice() {return this.$order.inputOcoCondition1Price;},
        // 止損價格
        inputLossPrice() {return this.$order.inputOcoCondition2Price;},
        inputOrderPipValue() {return this.$order.inputOrderPipValue;},
        // 盈利價格差
        diffProFitPrice() {
            if(this.$order.inputOrderPipValue === 0) return 0;
            else return this.calcProfitPrice;
        },
        // 盈利價格差百分比
        diffProFitPercent() {
            if(this.$order.inputOrderPipValue === 0) return 0;
            else return this.calcPLPercent(this.$order.inputOcoCondition1Price);
        },
        // 以止盈價格計算損益
        calcProfitPrice() {
			return this.calcPLPrice(this.$order.inputOcoCondition1Price);
		},
        // 以止損價格計算損益
		calcLossPrice() {
			return this.calcPLPrice(this.$order.inputOcoCondition2Price);
		},
        // 委託數量
        inputQty() {
            return this.$order.inputOrderQty;
        },
        // 超價跳數
		overJump() {return this.$order.overJump;},
		// 超價基低價格
		overBase() {return this.$order.overBase;},
        // 委託類型
        selectOrderType() {return this.$order.orderType;},
        // 委託類型額外資訊
        orderTypeInfoText() {
			if(this.selectOrderType == "OVER")
				return `${this.$ln("对手价")}${this.$ln('加')} ${this.overJump} ${this.$ln('跳')}`;
		},
        closeSide() {return this.offsetableNetQty > 0 ? "SELL" : "BUY";},
        minfo() {return this.$store.state.selectedSymbol.MInfo;},
        // 可平備兌倉數量
        offsetableCoveredQty() {return this.ssps.OFFSETABLE_COVERED_SELL_QTY;},
		/** 当前商品是否为 ETF 期权 */
		isETF() {
			return (this.minfo.Exchange === "SSE" || this.minfo.Exchange === "SZSE") && this.minfo.Type === "O";
		},
    }
}
</script>
<style scoped>
.stop-loss-orderInfo-ctn>div{
    min-height: 3em;
}
</style>