<template>
    <div class="trading-account-btn-ctn bgc-head tcef flex-row pdtb1" @click="onBtnClick">
		<div class="flex-center mglr2">
			<i class="material-icons md-24">account_circle</i>
		</div>
		<div class="flex-1 flex-col overflow-hidden">
			<div class="flex-1 clr-orange broker-name font-size-mini ellipsis">{{displayBrokerName}}</div>
			<div class="flex-1">{{displayTraderID}}</div>
		</div>
    </div>
</template>

<script>
import TradingAccountManager from "@/components/TradingAccountManager.vue";
export default {
	props: [],
	data() {
		return {
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
		TradingAccountManager,
	},
    methods: {
		onBtnClick: function() {
			eventBus.$emit("POPUP-DIALOG", TradingAccountManager, {}, {transName: 'float'});
		}
	},
	watch: {
	},
    computed: {
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		brokerKey() {
			return this.selectedBTO ? (this.selectedBTO.brokerKey || this.selectedBTO.brokerID) : '';
		},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.brokerKey];
		},
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.selectedBTO.selectedAccountID);
		},
    }
}
</script>

<style scoped>
.trading-account-btn-ctn {
	border-radius: 1vw;
	height: 10.5vw;
	white-space: nowrap;
}
</style>