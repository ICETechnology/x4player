<template>
    <div class="flex-column mix-trading-ctn">
		<TabGroup ref="tg" tabKey="TG-Trade" :tabList="tabList" :suspend="suspend"></TabGroup>
    </div>
</template>

<script>
export default {
	props: ["suspend"],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods:{},
	watch: {},
    computed: {
		tradeTabList() {
			return this.$store.state.config.CONFIG.TRADE_TAB_LIST;
		},
		tabList() {
			let list = [...this.tradeTabList];
			// 支持組合持倉情境
			if (this.supportCombinePosition)
				return list.filter(tabObj => tabObj.comClass != "PositionCardList");
			// 不支持組合持倉情境
			else
				return list.filter(tabObj => tabObj.comClass != "MixPosition");
		},
		// 純證券帳號
        isPureStock() {return this.$store.state.login.isStock && !this.$store.state.login.isFut && !this.$store.state.login.isOption},
		// 當前帳號支援組合持倉功能 (SIM 不支持, 證券帳號不支持)
		supportCombinePosition() {
            // 該貼牌有設定啟用組合持倉 && 不是SIM && 不是純證券帳號
            return !this.$store.state.login.isSIM && this.$store.state.config.CONFIG.ENABLE_COMBINEPOSITION && !this.isPureStock;
		},
	}
}
</script>

<style>
</style>