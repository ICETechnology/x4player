<template>
	<div class="purchase-limit-list-ctn">
		<!-- 限購餘額資料 -->
		<div class="purchase-limit-list flex-row line mgb1" v-for="(obj, key) in PURCHASE_LIMIT" :key="key">
			<!-- 交易所(代碼ex: SH)須透過語系轉換 -->
			<div class="flex-top-left column-label clr-gray pdtb1 pdl2 mgr1 bgc-head">{{$ln(key)}}</div>
			<div class="flex-1 flex-col column-value pd1 bgc-head">
				<!-- 限購額度 -->
				<div class="flex-row font-size-mini pdb1">
					<div class="purchase-limit-lable mgr2 clr-gray flex-end">{{$ln('额度')}}</div>
					<div class="purchase-limit-value flex-1 flex-end">{{format(obj.AMT)}}</div>
				</div>
				<!-- 限購餘額 -->
				<div class="flex-row font-size-mini">
					<div class="purchase-limit-lable mgr2 clr-gray flex-end">{{$ln('剩余')}}</div>
					<div class="purchase-limit-value flex-1 flex-end clr-remining">{{format(obj.REMAINING)}}</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {}
	},
	methods: {
		format(v) {
			let val = parseFloat(v).toFixed(2);
			return isNaN(val) ? '--' : this.$commas(val);
		},
	},
	computed: {
		// 將數字三位一撇
		$commas() {return this.$store.state.fn.$commas;},
		// 本資金元件的幣別
		currency() {
			return this.$store.state.status.selectedCurrency;
		},
		// 以幣別為 key 的響應式資金資料
		allMarginData() {
			return this.$store.state.data.marginData;
		},
		// 限購餘額資料
		PURCHASE_LIMIT() {
			// 取資金中的資料
			try {
				return this.allMarginData[this.currency]['PURCHASE_LIMIT'];
			} catch(e) {
				return {};
			}
		},
	},
}
</script>
<style scoped>
.column-label {
	width: 3em;
}
.clr-remining {color: #0BA0FF;}
</style>