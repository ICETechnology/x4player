<template>
    <div class="trading-btn-ctn flex-1 flex-row flex-start" @click="onClickBtn">
		<span class="flex-1 label">{{$ln(tradeTabName)}}</span>
		<i class="material-icons">arrow_drop_down</i>
    </div>
</template>

<script>
import TradingSelector from "@/components/TradingSelector.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {
		// 自動開啟選單
		if (this.autoOpenSubMenu)
			this.onClickBtn();
	},
	beforeDestroy() {},
	components: {
		TradingSelector,
	},
    methods: {
		onClickBtn() {
			eventBus.$emit("POPUP-DIALOG", TradingSelector);
			this.$store.state.sync.autoOpenSubMenu = false;
		},
	},
	watch: {
		tradeTabName(nv) {
			console.log(nv);
		},
		/** 自動開啟選單 */
		autoOpenSubMenu(nv) {
			if (nv)
				this.onClickBtn();
		}
	},
    computed: {
		/** 交易所ID */
		tradeTabName() {
			return this.$store.state.status.tradeTabName;
		},
		autoOpenSubMenu() {
			return this.$store.state.sync.autoOpenSubMenu;
		},
	},
}
</script>

<style scoped>
.trading-btn-ctn {
	height: 40px;
	padding: 0 5px;
	border-radius: 3px;
	background-color: orange;
}
.trading-btn-ctn .label {
	width: 100%;
	white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>