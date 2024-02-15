<template>
    <div class="close-cancel-ctn flex-col w80vw">
		<div class="head flex-center mgtb3">{{$ln(`平仓`)}}</div>
		<div class="flex-col pdlr5 mgtb3">
			<div class="flex-1">{{$ln("持仓部位反向平仓。平仓完成后，您的持仓为0，确认执行?")}}</div>
			<div class="flex-row mgtb2" @click="cancel = !cancel" v-if="rptList.length">
				<span class="material-icons">{{cancel ? "check_box" : "check_box_outline_blank"}}</span>
				<span class="flex-start">{{this.$ln("同时删除全部委托")}}</span>
			</div>
		</div>
		<div class="foot flex-row">
			<div class="flex-center flex-1 fd-content-bdc cancel-btn" @click="$emit('close')">{{$ln('取消')}}</div>
			<div class="flex-center flex-1 fd-content-bdc confirm-btn" @click="onBtnConfirm">{{$ln('确认')}}</div>
		</div>
    </div>
</template>

<script>
export default {
	data() {
		return {
			cancel: false,
		}
	},
    methods: {
		onBtnConfirm() {
			// 全平。
			let oi = {
				'ACTION': 'NEW',							// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,						// 合約代碼
				'POSITION_EFFECT': "CLOSE",					// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': "MARKET",						// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': "IOC",						// ROD/IOC/FOK
				'ORDER_PRICE': 0,							// 委託價 (市價帶 0)
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
			// 多倉可平數量大於0
			if (this.psd.OFFSETABLE_BUY_QTY > 0) {
				oi.SIDE = "SELL";
				oi.ORDER_QTY = Number(this.psd.OFFSETABLE_BUY_QTY);
				M4C.Order.sendOrder(oi);
			}
			// 空倉可平數量大於0
			if (this.psd.OFFSETABLE_SELL_QTY > 0) {
				oi.SIDE = "BUY";
				oi.ORDER_QTY = Number(this.psd.OFFSETABLE_SELL_QTY);
				M4C.Order.sendOrder(oi);
			}
			// 備兌空倉可平數量大於0
			if (this.psd.OFFSETABLE_COVERED_SELL_QTY > 0) {
				oi.SIDE = "BUY";
				oi.POSITION_EFFECT = 'CWC'; // 備兌平倉
				oi.ORDER_QTY = Number(this.psd.OFFSETABLE_COVERED_SELL_QTY);
				M4C.Order.sendOrder(oi);
			}
			// 全撤
			if (this.cancel && this.rptList.length) {
				this.rptList.map( rpt => {
					let cancelOi = {
					'REPORT_ID': rpt.key,
					'SYMBOL': this.sid,
					'ACTION': 'CANCEL',
					'AP_PLUGIN': this.useComName || this.selfComName,
					};
					M4C.Order.sendOrder(cancelOi);
				});
			}
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		},
	},
	watch: {},
    computed: {
		rptList () {
			return this.$store.state.data.availableReportList.filter( rpt => {
				if(rpt.$isOCO)
					return rpt.OCO[0].SYMBOL == this.sid;
				else
					return rpt.SYMBOL == this.sid;
			});
		},
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 當前商品的部位
		psd() {
			return this.$store.state.selectedSymbol.positionSum;
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	},
}
</script>

<style scoped>
</style>