<template>
	<div class="tvc-report-ctn hidden" />
</template>

<script>
export default {
	props: ['widget'],
	data() {
		return {
			rptIDtoOrderLine: {},
		}
	},
	beforeMount() {},
	beforeDestroy() {
		eventBus.$off("AVAILABLE-REPORT-APPEND");
		eventBus.$off("AVAILABLE-REPORT-REMOVE");
		for (let key in this.rptIDtoOrderLine)
			this.rptIDtoOrderLine[key].remove();
	},
	mounted() {
		// 對當前合約所有有效回報建立OrderLine
		this.availableReportList.forEach(rpt => {
			this.append(rpt);
		});
		// 即時新增的有效回報
		eventBus.$on("AVAILABLE-REPORT-APPEND", rpt=>{
			console.log('[TVCReport] AVAILABLE-REPORT-APPEND');
			this.append(rpt);
		});
		// 即時移除的有效回報
		eventBus.$on("AVAILABLE-REPORT-REMOVE", rpt=>{
			console.log('[TVCReport] AVAILABLE-REPORT-REMOVE');
			this.remove(rpt);
		});
	},
	components: {},
	methods: {
		append(rpt) {
			// 不支持 OCO
			if (rpt.$IS_OCO) return;
			let txtSide = rpt.$SIDE === 'BUY' ? '買進' : '賣出';
			let txtPosition = M4C.Report.getPositionEffectText(rpt);
			let txtOrderType = M4C.Report.getOrderTypeText(rpt);
			// 有觸發價格時，要+顯示委託價文字
			let txtPrice = (rpt.$CONDITION_VALUE && rpt.$ORDER_PRICE) ? rpt.$ORDER_PRICE : '';
			// 標示價格 : 觸發價 > 委託價
			let markupPrice = rpt.$CONDITION_VALUE || rpt.$ORDER_PRICE;
			let orderLine = this.rptIDtoOrderLine[rpt.REPORT_KEY.report_id] = this.widget.activeChart().createOrderLine()
					.onMove((data)=>{
						// 移動後的價格
						let newPrice = orderLine.getPrice();
						console.log('[TVCReport] OrderLine onMove: ', newPrice);
						eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: 'REPRICE', modifyPrice: newPrice, modifyTrgPrice1: newPrice}});
						// 直接先跳回移動前的價格 (要等回報來才能更新價格)
						orderLine.setPrice(markupPrice);
					})
					.onModify("onModify called", (text)=>{
						eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: 'REDUCE'}});
					})
					.onCancel("onCancel called", (text)=>{
						eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: rpt, action: 'CANCEL'}});
					})
					// .setLineLength(3)
					// .setLineStyle(0)
					.setText(`${txtSide}${txtPosition}${txtOrderType}${txtPrice}`)
					.setQuantity(rpt.$AVAILABLE_QTY)
					.setPrice(markupPrice);
			// 有效數量變動
			this.$watch(()=>{return rpt.$AVAILABLE_QTY}, (nv)=>{
				this.updateQty(rpt);
			});
			// 委託價格變動
			this.$watch(()=>{return rpt.$CONDITION_VALUE || rpt.$ORDER_PRICE}, (nv)=>{
				this.updatePrice(rpt);
			});
		},
		// 移除
		remove(rpt) {
			// 不支持 OCO
			if (rpt.$IS_OCO) return;
			let orderLine = this.rptIDtoOrderLine[rpt.REPORT_KEY.report_id];
			if (orderLine)
				orderLine.remove();
			delete this.rptIDtoOrderLine[rpt.REPORT_KEY.report_id];
		},
		// 更新數量
		updateQty(rpt) {
			try {
				this.rptIDtoOrderLine[rpt.REPORT_KEY.report_id].setQuantity(rpt.$AVAILABLE_QTY);
			} catch(err) {
				console.log('[TVCReport] updateQty error : ', err);
			}
		},
		// 更新價格
		updatePrice(rpt) {
			try {
				let markupPrice = rpt.$CONDITION_VALUE || rpt.$ORDER_PRICE;
				this.rptIDtoOrderLine[rpt.REPORT_KEY.report_id].setPrice(markupPrice);
			} catch(err) {
				console.log('[TVCReport] updatePrice error : ', err);
			}
		},
	},
	watch: {
	},
	computed: {
		sid() {
			return vuex.selectedSymbol.ID;
		},
		availableReportList() {
			return vuex.data.availableReportList.filter(rpt=>rpt.$SYMBOL === this.sid);
		},
	},
}
</script>

<style scoped>
</style>