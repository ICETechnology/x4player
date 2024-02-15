<template>
	<div class="flex-col">
		<div class="flex-row bsv">
			<div class="flex-row flex-1">　</div>
			<div class="flex-row flex-2">
				<div class="flex-item bgc-up" :style="getBsv(this.sumBv)"></div>
				<div class="flex-item bgc-dn" :style="getBsv(this.sumSv)"></div>
			</div>
			<div class="flex-row flex-1">　</div>
		</div>
		<div class="flex-top flex-row posr" @click="isOptUp = !isOptUp" v-if="model=='N' && !$store.state.thunder.selectedPrice">
			<i class="material-icons md-18">{{isOptUp ? `expand_more` : `expand_less`}}</i>
			<i class="material-icons md-18 icon2 flex-center">{{isOptUp ? `expand_more` : `expand_less`}}</i>
		</div>
		<transition name="float"  v-if="model=='N' && !$store.state.thunder.selectedPrice">
			<div class="footer flex-col" v-if="isOptUp">
				<OrderBSBtn class="space-around mgb1" ipt-style="button" order-type="MARKET" :tif="timeInForce" shortText="true" 
					v-model="$store.state.thunder.orderQty" :useComName="selfComName" />
				<div class="cancel flex-1 flex-row space-around ">
					<Button class="foot-btn clr-up flex-center w25vw ht4 rd6" @click="cancelBuyOrder">{{$ln('撤买')}}{{allBuyQty ? `(${allBuyQty})` : ''}}</Button>
					<Button class="foot-btn flex-center w25vw ht4 rd6" @click="cancelAllOrder">{{$ln('全撤')}}{{(allBuyQty+allSellQty) ? `(${allBuyQty+allSellQty})` : ''}}</Button>
					<Button class="foot-btn clr-dn flex-center w25vw ht4 rd6" @click="cancelSellOrder">{{$ln('撤卖')}}{{allSellQty ? `(${allSellQty})` : ''}}</Button>
				</div>
			</div>
		</transition>
		<transition-group name="switch">
			<div class="fight-foot flex-row space-between rd6 pd1 mglr5" v-if="model=='F' && $store.state.thunder.enterType != 'O' && !$store.state.thunder.selectedPrice" key="order">
				<Button class="foot-btn bgc-up clr-white flex-center w20vw ht2 rd6" @click="sendMarketOrder(1)">{{$ln('市买')}}</Button>
				<div class="foot-btn clr-white flex-center w20vw" @click="onReportBtn">
					<i class="material-icons font-size-xl">list</i>
				</div>
				<Button class="foot-btn bgc-dn clr-white flex-center w20vw ht2 rd6" @click="sendMarketOrder(-1)">{{$ln('市卖')}}</Button>
			</div>
			<div class="fight-foot flex-row space-between rd6 pd1 mglr5" v-if="model=='F' && $store.state.thunder.enterType == 'O'" key="ocoOrder">
				<Button class="foot-btn bgc-up clr-white flex-center w20vw ht2 rd6" :class="{'disabled': this.$store.state.thunder.ocoOrder.length < 2}"
					@click="sendOCO">{{$ln('送出')}}</Button>
				<Button class="foot-btn bgc-0D69D8 clr-white flex-center w20vw ht2 rd6" :class="{'disabled': this.$store.state.thunder.ocoOrder.length < 1}"
					@click="resetOCO">{{$ln('重设')}}</Button>
				<Button class="foot-btn bgc-1E1E1E clr-white flex-center w20vw ht2 rd6"
					@click="cancelOCO">{{$ln('取消')}}</Button>
			</div>
		</transition-group>
	</div>
</template>
<script>
import QuoteAgent from '@/components/QuoteAgent';
import OrderBSBtn from "@/components/OrderBSBtn.vue";
import ThunderOrder from "./ThunderOrder";
import ThunderReport from "./ThunderReport.vue";

export default {
	mixins: [QuoteAgent, ThunderOrder],
	data(){
		return {
			isOptUp: false,
		}
	},
	props:['allBuyQty', 'allSellQty', 'suspend', 'reportList', 'param'],
	components: {OrderBSBtn},
	methods: {
		sendOCO() {
			this.sendOrder({CB: this.resetOCO});
		},
		resetOCO() {this.$store.state.thunder.ocoOrder = [];},
		cancelOCO() {
			this.$store.state.thunder.ocoOrder = [];
			this.$store.state.thunder.enterType = 'LIMIT';
		},
		//計算買賣總量的%數
		getBsv(v){
			if(Number(v))
				return {'width': Big(v).div(this.sumV).times(100)+"%"};
			else return {'width': "0%"};
		},
		onReportBtn(){
			eventBus.$emit("POPUP-DIALOG", ThunderReport, {fixdTop: true}, {transName: 'float'});
		},
		// 發市價委託
		sendMarketOrder(side) {
			this.$store.state.thunder.enterType = 'MARKET';
			this.sendOrder({price: 0, side: side > 0? 'BUY': 'SELL', type: 'MARKET'});
		}
	},
	computed:{
		sid() {return this.$store.state.selectedSymbol.ID;},
		name() {return this.$store.state.selectedSymbol.Name;},
		CIDM4() {return this.$store.state.selectedSymbol.CIDM4;},
		model() {return this.param && this.param.model? this.param.model: this.$store.state.thunder.model},
		ssps() {return this.$store.state.selectedSymbol.positionSum;},
		sumSv() {
			let sum = 0;
			// 賣總量(初始資料)
			for (let j = 1; j < 11; j++) {
				sum += Number(this.qo['sv' + j]);
			}
			return sum;
		},
		sumBv() {
			let sum = 0;
			// 買總量(初始資料)
			for (let j = 1; j < 11; j++) {
				sum += Number(this.qo['bv' + j]);
			}
			return sum;
		},
		sumV() {
			return this.sumBv + this.sumSv;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
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
			try{return M4C.Symbol.getMainformInfo(this.sid.split('.').slice(0,3).join('.')).OrderTypes;}catch(e){return {};}
		},
		// 依交易商分類的交易所層級的委託類型資料。
		exgOrdertypeObj() {
			// 以 UFX 為例，若 OrderTypes.UFX 不存在時，使用 OrderTypes.default
			return this.exgOrderTypes[this.brokerSystem] || this.exgOrderTypes.default;
		},
		// 該商品市價是否有支援IOC
		isSupportIoc() {
			let odObjList = this.exgOrdertypeObj;
			if (Array.isArray(odObjList)) {
				let odObj = odObjList.find(od => od.name === "MARKET");
				if (odObj && odObj.types) {
					return odObj.types.find(tif => tif === "IOC");
				}
			}
		},
		// 依商品是否支援IOC回傳IOC或ROD
		timeInForce() {return this.isSupportIoc? "IOC": "ROD";},
	}
}
</script>
<style scoped>
.footer {
	padding: 5px 2px;
}
.bsv div{
	height:5px;
}
.qty-ipt{
	margin: 2px;
	border-radius: 0.5em !important;
}
.qty-ipt /deep/ .input-block{
	background-color: white;
	color: black;
	border-radius: 0.5em;
}
.qty-ipt /deep/ .input-block input{
	background: none;
	color:black;
}
.cancel .foot-btn{
	background-color:  white;
	color:black;
	font-weight: bold;
}
.order-type {
	font-size: 10px;
}
.icon2 {
	top: 5px;
	position: absolute;
	margin:auto;
}
.float-enter, .float-leave-to {
	height: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.float-enter-active, .float-leave-active{
	transition-duration: 0.3s;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.float-enter-to, .float-leave {
	height: 100px;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.switch-enter, .switch-leave-to {
	height: 0px;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.switch-enter-active, .switch-leave-active{
	transition-duration: 0.3s;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.switch-enter-to, .switch-leave {
	height: 30px;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.fight-foot {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 5px;
	background-color: rgba(0, 0, 0, 0.8);
}
.bgc-0D69D8 {
	background: #0D69D8;
}
.bgc-1E1E1E {
	background: #1E1E1E;
}
.desktop .foot-btn {
	width: 30%;
	max-width: 10em;
}
.desktop .fight-foot {
	max-width: 16em;
	margin: auto;
}
</style>