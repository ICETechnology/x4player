<template>
	<div class="fast-order-ctn flex-row flex-1 pd5" :class="{'fixed-large-font-size': !fontSizeSync}">
		<DesktopTickChart class="chart-ctn mgr5 posr"/>
		<div class="order-ctn flex-col">
			<!-- 商品搜尋列 -->
			<SymbolSearch />
			<div class="flex-1 flex-col overflow-y-auto pdr2">
				<!-- 商品資料列 -->
				<SymbolContentRow class="flex-1" />
				<div class="divider-bottom" />
				<!-- 商品持倉列 -->
				<SymbolPositionRow class="flex-1 pdtb5" mode="desktopFastOrder"/>
			</div>
			<!-- 委託按鈕 -->
			<OrderBtn :param="{orderType: 'MARKET', orderBoxMode: 0}" :useComName="selfComName" />
		</div>
	</div>	
</template>
<script>
import SymbolContentRow from "@/components/SymbolContentRow.vue";
import OrderBtn from "@/components/Order/OrderBtn.vue";
export default {
	data() {
		return {
			
		}
	},
	props: ["param"],
	components: {
		SymbolContentRow,
		OrderBtn,
	},
	computed: {
		// 有帶參數才隨全域字型變動。
		fontSizeSync() {if(this.param) return this.param.fontSizeSync;},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	}
}
</script>
<style scoped>
.fixed-large-font-size, .desktop .fixed-large-font-size /deep/ .material-icons {
	font-size: 24px
}
.order-ctn {
	width: 20em;
	max-width: 28%;
}
/deep/ .order-block-ctn .button-ctn{
	width: 5em !important;
	height: 5em !important;
	border-radius: 50% !important;
}
/deep/ .search-block{
	width: 100%;
}
</style>