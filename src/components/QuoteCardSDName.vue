<template>
	<div class="flex-start flex-row">
		<span class="quotecard-sdname font-size-small" :class="{'font-size-big':largeSize}" >{{symbolName}} {{symbolCIDM4}}</span>
		<span v-if="displayAsHot" class="mglr2 font-size-mini flex-center" :class="{'font-size-little':largeSize}">{{$ln('主连')}}</span>
		<!-- <span v-if="hasOpt" class="mgr1 ico opt font-size-mini flex-center" @click="onClickOpt">{{$ln(`权`)}}</span> -->
	</div>
</template>

<script>
export default {
	props: ['sid', 'displayAsHot'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 點擊『權』按鈕 */
		onClickOpt() {
			event.stopPropagation();
			// 轉為對應的 OptSid 後，作為切到期權後預設要顯示的商品
			this.$store.state.opt.selectedSymbol = M4C.Symbol.getOSIDbyFSID(this.sid);
			// 切換至期權版面
			this.$store.state.bottomBar.activeKey = "option";
		},
	},
	watch: {},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		// "澳幣"
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		symbolCIDM4() {
			return M4C.Symbol.getCIDM4(this.sid);
		},
		minfo() {
			return M4C.Symbol.getMainformInfo(this.sid);
		},
		sids() {
			return this.sid.split('.');
		},
		/** 代碼 */
		symbol() {
			return this.minfo ? this.minfo.Symbol : this.sids[3];
		},
		/** 名稱 */
		contractName() {
			return M4C.Symbol.getContractName(this.sid) + ' ' + this.month4 + this.hotString;
		},
		/** 月份四碼 */
		month4() {
			let sid = this.sid;
			if (this.sids[4]==='HOT')
				sid = M4C.Symbol.toMonthSymbol(this.sid);
			let mth = sid.split('.')[4];
			return mth ? mth.substr(2) : '';
		},
		/** 是否包含期权商品 */
		hasOpt() {
			return M4C.Symbol.getOSIDbyFSID(this.sid);
		},
	},
}
</script>

<style scoped>
.ico {
	color: white;
	width: 15px;
	height: 15px;
	border-radius: 2px;
}
.hot {
	background-color: red;
}
.opt {
	background-color: #4A90E2;
}
</style>