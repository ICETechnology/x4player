<template>
	<span class="search-block flex-center tcef flex-row hover-icon" @click="onBtnSearch">
		<span class="flex-1 flex-start">{{symbolName}}</span>
		<i class= "material-icons">search</i>
	</span>
</template>
<script>
export default {
	data() {
		return {
		}
	},
	props:["value", "lock", "isStopSub", "noValue"],
	mounted() {},
	methods: {
		setSid(sid){
			this.$emit('input', sid);
		},
		/** 搜尋圖示按鈕 */
		onBtnSearch() {
			// 防連點機制
			if (this.clickLock) return; 
			this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			let config = {};
			// 有用v-model才emit上層。
			if(this.value || this.value === "")
				config.setSid = this.setSid;
			// 依組件鎖定商品切換
			if(this.lock)
				config.lock = this.lock;
			if(this.isStopSub)
				config.isStopSub = this.isStopSub;
			// 彈出搜尋UI
			eventBus.$emit("POPUP-DIALOG", 'SearchPlus', config, {transName: 'float'});
		},
	},
	computed: {
		// 沒設定v-model使用的話以selectedSymbol當值。
		symbolName() {
			if(this.value) {
				if(this.value.indexOf('HOT') != -1)
					return M4C.Symbol.getCNameCIDM4(this.value) + this.$ln("主连");
				else
					return M4C.Symbol.getCNameCIDM4(this.value);
			}
			else if(this.noValue) {
				return this.$ln(this.noValue);
			}
			else {
				// 熱門月才轉
				if(this.$store.state.selectedSymbol.displayAsHot)
					return M4C.Symbol.getCNameCIDM4(M4C.Symbol.toHotSymbol(this.$store.state.selectedSymbol.ID)) + this.$ln("主连");
				else
					return M4C.Symbol.getCNameCIDM4(this.$store.state.selectedSymbol.ID);
			}
		},
	},
	watch: {}
}
</script>
<style scoped>
.search-block {
	border: 1px solid #8d8d8d33;
	/* 本組件應填滿，由 parent 決定大小位置 */
	width: 100%;
	max-width: 100%;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    padding: 1px 3px;
	box-sizing: border-box;
}
</style>