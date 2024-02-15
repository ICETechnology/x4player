<template>
    <div class="search-self-select font-size-little FULL">
		<div class="FULL mg2 item-container scrolling-y">
			<div class="" v-for="obj in totalList">
				<div class="clr-gray2 pd1 font-size-mini" v-if="obj.contracts.length>0">{{$ln(obj.label)}}</div>
				<div class="item pd1 pdl5 tcef flex-row" v-for="sid in obj.contracts" @click="onContractClick(sid)" :class="{'pointer-events-none': !isAvailable(sid)}">
					<span class="flex-1 flex-start mgr5">{{displayExchangeName(sid)}}</span>
					<span class="flex-1d5">{{displayContractName(sid)}}</span>
				</div>
			</div>
		</div>
		<Stamp v-if="!existData" stampStatus="EMPTY" />
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		displayExchangeName(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			try{return M4C.Symbol.getExgNameByExgId(minfo.Exchange);}catch(e){}
		},
		displayContractName(sid) {
			if (!sid) return;
			return M4C.Symbol.isHotSID(sid) ? M4C.Symbol.getCNameCIDHot(sid) : M4C.Symbol.getCNameCIDM4(sid, " ");
		},
		onContractClick(sid) {
			// 設定v-model值。
			if(typeof this.param.setSid === 'function') {
				this.param.setSid(sid);
			}
			// 沒參數或參數中沒有lock值才設定selectedSymbol
			if(!this.param || !this.param.lock){
				// 設定關注商品
				this.$store.commit("setSelectedSymbol", sid);
				// 如果是熱門月額外設定顯示
				if(sid.split('.').indexOf('HOT') >= 0) {
					this.$store.commit("setSelectedSymbolDisplayAsHot");
				}
			}
			// 關閉本畫面
			eventBus.$emit("CLOSE-DIALOG");
			// app版才彈出商品行情頁
			if((!this.param || !this.param.isStopSub) && !this.isDesktop && this.param.from!=='ContractsSwitch'){
				// 執行彈出商品行情頁。
				setTimeout(() => {
					eventBus.$emit("POPUP-DIALOG", "QuotePage");
				}, 10);
			}
		},
		// 有支援的商品
		isAvailable(sid) {return this.$checkSupportedItem(sid);},
	},
	watch: {},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		/** 庫存合約列表 */
		positionsumList() {
			return this.$store.state.data.normalPositionSumList.map(psd=>psd.SYMBOL);
		},
		/** 库存+自選群組 內容 (響應式 by $store.state.data.ssgList) */
		totalList() {
			let list = this.$store.state.data.ssgList.map(obj => {
				return {label: obj.label, contracts: obj.param};
			});
			list.push({label: this.$ln('我的库存'), contracts: this.positionsumList});
			return list;
		},
		existData() {
			let result = false;
			this.totalList.forEach((obj)=>{
				if (obj.contracts.length > 0)
					result = true;
			});
			return result;
		},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
}
</script>

<style scoped>
.item.selected {
	background-color: #0065A4;
}
.item:hover {
	background-color: #0065A4;
}
.item-container {
	box-sizing: border-box;
	border-radius: 0.3em;
}
</style>