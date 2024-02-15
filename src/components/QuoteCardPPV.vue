<template>
	<div class="quote-ctn flex-1 flex-row space-between">
		<div class="flex-1 flex-col pdtb1d5">
			<!-- 最新價 (必須 touchstart.stop 才能避免全列亮起) -->
			<!-- PS. 若用 touchstart.stop 會造成在按鈕上左右滑動失效，因此目前沒有良好的作法可以只亮按鈕，不亮整列-->
			<div class="flex-1 flex-center font-size-big font-bold pdl1" 
				@touchstart="btnOnTouch=true" @touchend="btnOnTouch=false" @click.stop="onClickPrice"
				:class="[qo.$clr, configLightUp && lightUp ? 'lightUp' : '', btnOnTouch?'touching':'', {'btn': isNotSpot} , {'font-size-large': largeSize}]">{{$symbolPrice(sid, qo.p)}}</div>		
			</div>
		<div class="flex-1 flex-col font-size-micro mgl1" :class="{'font-size-small flex-1d5': largeSize}">
			<!-- 漲跌 (漲跌幅%) -->
			<div class="flex-1 flex-end pdr3 nowrap mgt0d5" :class="[qo.$clr,{'font-bold':largeSize}]">{{$symbolChgTxt(qo)}}</div>
			<!-- 成交量 -->
			<div class="flex-1 flex-end pdr3" :class="{'lightUp': lightUp}">{{displayV}}</div>
		</div>
	</div>
</template>
<script>
export default {
	props: ["sid", "qo", "sortedList"],
	data() {
		return {
			lightUp: false,
			btnOnTouch: false,
		}
	},
	mounted() {},
	methods: {
		onClickPrice() {
			// 台灣版的期貨現貨點價格不進下單盒。
			if(!this.isNotSpot) return;
			event.stopPropagation();
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			
			// 準備關注合約列表
			this.$store.commit("setContractsList", this.sortedList);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
	},
	computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxt() {return this.$store.state.fn.$symbolChgTxt;},
		// 買方寬度
		changeWidth() {
			let qo = this.qo;
			return `width: ${parseInt((qo.bv1 / (qo.sv1 + qo.bv1)) * 100)}%`;
		},
		// 成交量欄位
		qov() {
			return this.qo.v;
		},
		// 有設定要 by 即時Tick 亮起
		configLightUp() {
			return this.$store.state.config.CONFIG.QUOTE_PRICE_LIGHTUP;
		},
		/** 台灣模式 */
        twMode(){
            return this.$store.state.config.CONFIG.OPERATING_MODE === 'tw';
		},
		/** 通用函式 */
		fn() {
			return this.$store.state.fn;
		},
		/** 成交量 */
		displayV() {
			return this.twMode ? this.fn.$commas(this.qo.v) : this.fn.$volUnit(this.qo.v);
		},
		/** 期貨現貨不顯示btn樣式，非台灣版的不判斷 */
		isNotSpot() {
			return !this.twMode || (this.qo.tp && this.qo.tp.toString().indexOf("2010") !== 0);
		},
	},
	watch: {
		// 成交量改變
		qov(nv) {
			this.lightUp = true;
			if (this.lightUp) {
				setTimeout(()=>{this.lightUp = false;}, 1000);
			}
		},
	}

}
</script>
<style scoped>
.Buy-ctn, .Sell-ctn {width:48%; max-width: 48%;}
.price-ctn {
	position: absolute;
	top: -2vw;
	background-color: rgba(0,0,0,0.5);
}
.price-ctn.lightUp{
	background-color: rgba(0,0,0, 1);
}
/** 價格按鈕 */
.btn {
	border-radius: 1vw;
	background-color: #2A2A2A;
	text-shadow: 0 0 1px #000;
}
/** 價格按鈕亮起 */
.btn.lightUp {
	color: white !important;
	background: #DE781C !important;
}
.btn.touching {
	background: linear-gradient(to bottom, #555 0%, #444 100%);
}
</style>