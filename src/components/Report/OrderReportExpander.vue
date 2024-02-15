<template>
    <div class="expand-ctn flex-col pd2">
		<!-- 有效單的展開內容 -->
    	<div v-if="supportItem" class="flex-row flex-center">
			<i v-if="!rpt.SYMBOL2" class="material-icons tcef md-30" @click.stop="onBtnChart">score</i>
			<div class="flex-end flex-1">
				<div class="rbtn w20vw mglr1 tcef" @click.stop="onBtnDetail">{{$ln(`明细`)}}</div>
				<div class="rbtn w20vw mglr1 tcef" v-if="isWorking" @click.stop="onBtnModify(rpt, 'CANCEL')">{{$ln(`删单`)}}</div>
				<div class="rbtn w20vw mglr1 tcef" v-if="isModifyAble && isWorking" @click.stop="onBtnModify(rpt, 'REPRICE')">{{$ln(`改价`)}}</div>
				<div class="rbtn w20vw mglr1 tcef" v-if="isModifyAble && isWorking" @click.stop="onBtnModify(rpt, 'REDUCE')">{{$ln(`改量`)}}</div>
			</div>
		</div>	
    </div>
</template>

<script>
import ReportCardDetail from '@/components/ReportCardDetail';
export default {
	props: ['rpt'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 改價
		onBtnModify(rpt, action){
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: action}});
		},
		onBtnDetail() {
			eventBus.$emit('POPUP-DIALOG', ReportCardDetail, {'rpt': this.rpt}, {transName: 'float'});
		},
		onBtnChart() {
			// 如果是觸A下B的委託，sid改取監看的商品(以免卡片上顯示A商品，USER點了之後顯示B商品的商品詳情)
			let sid = this.isABOrder && this.rpt.$IS_CLOUD? this.rpt.MARKET_WATCH[0].SYMBOL: this.sid;
			// 總表沒有這檔商品不支援其他操作功能。
			if(!this.supportItem) return;
			// 複式單 -> 不彈出商品詳情
			if (this.rpt.SYMBOL2) return;
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: sid});
		},
	},
	watch: {},
    computed: {
		sid() {
			return this.rpt.SYMBOL || this.rpt.OCO[0].SYMBOL;
		},
		isWorking() {
			return this.rpt.$ISWORKING;
		},
		exchangeName() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid);
			return minfo ? M4C.Symbol.getExgNameByExgId(minfo.Exchange) : "--";
		},
		/** 總表沒有這檔商品不支援。 */
		supportItem () {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		// 是否可改單(目前判斷觸A下B不可改單, 另增加OCO單)
		isModifyAble() {
			return !this.rpt.MARKET_WATCH && (!this.rpt.OCO || this.rpt.$IS_NormalOrder);
		},
		// 觸A下B委託
		isABOrder() {return this.rpt.MARKET_WATCH;},
	},
}
</script>

<style scoped>
.btn-detail {
	border: 1px solid #666;
	border-radius: 1vw;
}
</style>