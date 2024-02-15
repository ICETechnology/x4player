<template>
    <div class="option-symbol-selector flex-col pdlr5 pdb5 scrolling-y" v-stop-propagation-y>
		<div v-for="(exgObj, i) in exgList" :key="`OptionSymbolSelector-Exg-${i}`">
			<div class="clr-gray font-bold mgtb3">{{getExgName(exgObj)}}</div>
			<div class="flex-row list-block">
				<Button class="btn outline mgtb2 flex-start pdlr3" v-for="(symbolObj, idx) in exgObj.Node" :key="`OptionSymbolSelector-${idx}`"
					:class="{selected: isSymbolSelected(symbolObj)}" @click="onBtnClick(symbolObj)">
					{{getSymbolName(symbolObj)}}
				</Button>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 交易所名称 */
		getExgName(exgObj) {
			return M4C.Symbol.getExgNameByExgId(exgObj.ENG);
		},
		/** 商品名称 */
		getSymbolName(symbolObj) {
			return symbolObj[`${this.langCode}_M`] || symbolObj[this.langCode];
		},
		/** 點擊商品 */
		onBtnClick(symbolObj) {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定當前選擇的 symbolObj
			let osid = this.$store.state.opt.selectedSymbol = M4C.Option.getOptPureSymbol(symbolObj);
			let info = this.$store.state.opt.underlyingSInfo = M4C.Symbol.getMainformInfo(osid);
			let usid = this.$store.state.opt.underlyingS = info.Underlying.S;
			this.$store.state.opt.underlyingSQO = M4C.Quote.getQuoteObject(usid);
			// 關閉彈窗
			eventBus.$emit("CLOSE-DIALOG");
		},
		/** 該商品是否為選擇中商品 */
		isSymbolSelected(symbolObj) {
			return this.selectedSymbol === M4C.Option.getOptPureSymbol(symbolObj);
		},
	},
	watch: {},
    computed: {
		langCode() {
			return this.$store.state.lang.mainformLangKey;
		},
		/** 當前選擇商品代碼 */		
		selectedSymbol() {
			return this.$store.state.opt.selectedSymbol;
		},
		exgList() {
			return M4C.Symbol.getClassification("OPT");
		},
	},
}
</script>

<style scoped>
.btn {
	/* 為了讓內容稱開高度，不可使用 box-sizing: border-box，導致 border 與 padding 會影響 size，因此需要調整 */
	width: 36.5vw;
	height: 11vw;
}

.desktop .btn {
	width: 7.77em;
	height: 2.34em;
}
.desktop .btn:hover {
	border-color: aqua;
}
</style>