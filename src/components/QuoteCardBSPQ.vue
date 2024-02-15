<template>
	<div class="BSPQ-ctn flex-row flex-1 posr space-around pdlr1 font-size-small" :class="{'font-size-big':largeSize}" >
		<div class="Buy-ctn bgc-up flex-row space-between flex-center rd2 posr tcef" @click="onBtnClick(1)">
			<div class="vol-ctn FULL flex-col flex-top-left pdl2 font-size-micro space-between">
				<span>{{$ln('买')}}</span>
				<span>{{bv1}}</span>
			</div>
			<div class="bp1-ctn flex-center flex-1" :class="{'lightUp': bp1BtnLightUp,'font-bold':largeSize}">{{bp1}}</div>
		</div>
		<div class="Sell-ctn bgc-dn flex-row space-between flex-center rd2 posr tcef" @click="onBtnClick(-1)">
			<div class="sp1-ctn flex-center flex-1" :class="{'lightUp': sp1BtnLightUp,'font-bold':largeSize}">{{sp1}}</div>
			<div class="vol-ctn FULL flex-col flex-bottom-left pdr2 font-size-micro space-between">
				<span>{{$ln('卖')}}</span>
				<span>{{sv1}}</span>
			</div>
		</div>
		<span class="price-ctn rd2 pd1 font-size-micro" :class="{'lightUp': qopLightUp}">{{qop}}</span>
	</div>
</template>
<script>
export default {
	props: ["sid", "qo", "sortedList"],
	data() {
		return {
			qopLightUp: false,
			bp1BtnLightUp: false,
			sp1BtnLightUp: false,
		}
	},
	mounted() {},
	methods: {
		onBtnClick(BS){
			event.stopPropagation();
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);

			// 準備關注合約列表
			this.$store.commit("setContractsList", this.sortedList);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN', orderPrice: BS > 0? this.orgBP1: this.orgSP1, orderType: 'LIMIT'});
		},
		lightUp(key){
			let self = this;
			this[key] = true;
			setTimeout(() => {
				self[key] = false;
			}, 1000);
		},
		eztxt(val) {
			return val==='' || val==null ? '--' : val;
		},
	},
	computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		fastOrderBuy() {return this.$store.state.order.fastOrderBuy == 'B';},
		fastOrderSell() {return this.$store.state.order.fastOrderSell == 'S';},
		qop() {return this.$symbolPrice(this.sid, this.qo.p || this.qo.r || this.qo.cp);},
		bp1() {return this.$symbolPrice(this.sid, this.fastOrderBuy? this.qo.bp1: this.qo.sp1);},
		sp1() {return this.$symbolPrice(this.sid, this.fastOrderSell? this.qo.sp1: this.qo.bp1);},
		bv1() {return this.eztxt(this.fastOrderBuy? this.qo.bv1: this.qo.sv1);},
		sv1() {return this.eztxt(this.fastOrderSell? this.qo.sv1: this.qo.bv1);},
		// 帶入下單盒需要帶原始價格，不可帶乘數後價格
		orgBP1() {return this.fastOrderBuy? this.qo.bp1: this.qo.sp1;},
		orgSP1() {return this.fastOrderSell? this.qo.sp1: this.qo.bp1;},
	},
	watch: {
		qop(nv) { this.lightUp("qopLightUp");},
		bp1(nv) { this.lightUp("bp1BtnLightUp");},
		sp1(nv) { this.lightUp("sp1BtnLightUp");},
	}

}
</script>
<style lang='scss' scoped>
.Buy-ctn, .Sell-ctn {width:48%; max-width: 48%; height: 12vw; max-height: 12vw;}
.price-ctn {
	position: absolute;
	top: -2vw;
	background-color: rgba(0,0,0,0.5);
}
.price-ctn.lightUp{
	background-color: rgba(0,0,0, 1);
}
</style>