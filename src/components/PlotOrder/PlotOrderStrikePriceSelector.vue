<!-- 策略下單盒 - 下方委託條件總成 - 履約價選擇器 -->
<template>
    <div class="po-sp-selector-ctn flex-row">
		<SingleSelect :options="strikePriceOptionList" v-model="selectedSP" />
    </div>
</template>

<script>
export default {
	props: ["strategySP", "strikePriceList", "closedPrice", "idx", "selectedStrategy", "contractStrike", 'from'],
	data() {
		return {
			selectedSP: 0,
		}
	},
	beforeMount() {
		this.initSelectedSP();
		// console.log(`PlotOrderStrikePriceSelector[${this.idx}].selectedSP by mounted : `, this.selectedSP);
	},
    mounted() {
		this.$emit("onStrikePriceChange", this.selectedSP);
	},
	beforeDestroy() {},
	components: {},
    methods: {
		initSelectedSP() {
			// 從連續IOC編輯畫面來的，直接帶金額進去
			if(this.contractStrike && this.from == "ContiIOC"){
				this.selectedSP = this.contractStrike;
			}				
			else{
				let result;
				if (this.strategySP==="H")
					result = this.strikePriceList[this.closestIndex];
				else if (this.strategySP==="L")
					result = this.strikePriceList[this.closestIndex-1];
				else if (this.strategySP==="S") {
					let diffH = Math.abs(this.closedPrice - this.strikePriceList[this.closestIndex]);
					let diffL = Math.abs(this.closedPrice - this.strikePriceList[this.closestIndex-1]);
					result = diffH < diffL ? this.strikePriceList[this.closestIndex] : this.strikePriceList[this.closestIndex-1];
				}
				this.selectedSP =  result || this.strikePriceList[0];
			}			
		},
		setSelectedSP(p) {
			this.selectedSP = p;
			// console.log(`PlotOrderStrikePriceSelector[${this.idx}].selectedSP by setSelectedSP : `, this.selectedSP);
		},
	},
	watch: {
		/** 切換策略 */
		'selectedStrategy.key'(nv) {
			this.initSelectedSP();
		},
		selectedSP(nv) {
			// console.log(`PlotOrderStrikePriceSelector[${this.idx}].selectedSP by watch : `, nv);
			this.$emit("onStrikePriceChange", nv);
		},
		strikePriceList() {
			this.initSelectedSP();
		},
	},
    computed: {
		/** 標的物價平下一檔履約價index */
		closestIndex() {
			// console.log(`PlotOrderStrikePriceSelector.strikePriceList : `, this.strikePriceList, `, closedPrice : `, this.closedPrice);
			if (this.closedPrice < Number(this.strikePriceList[0]))
				return 0;
			else if (this.closedPrice > Number(this.strikePriceList[this.strikePriceList.length-1]))
				return this.strikePriceList.length-1;
			for (let i=1; i<this.strikePriceList.length; i++) {
				if (this.closedPrice > parseFloat(this.strikePriceList[i-1]) && this.closedPrice <= parseFloat(this.strikePriceList[i])) {
					return i;
				}
			};
		},
		// 每次 strikePriceList 變化 -> 產生新的 optionList
		strikePriceOptionList() {
			let self = this;
			return this.strikePriceList.map(p=>{
				return {label: p, value: p, selected: p === self.selectedSP};
			});
		}
	},
}
</script>

<style scoped>
.po-sp-selector-ctn .single-select-ctn {
	width: 100%;
}
</style>