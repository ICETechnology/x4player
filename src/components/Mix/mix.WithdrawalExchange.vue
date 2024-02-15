<template>
	<TabGroup class="mix-withdrawal-xchange-tab-group" ref="mix-withdrawal-exchange-tg" tabKey="mix-withdrawal-exchange" disablePrevNext='true'
			:tabList="tabList"/>
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
			return this.$store.state.config.CONFIG.WithdrawalExchange_TAB_LIST;
		},
		tabList() {
			try {
				return [...this.tradeTabList];
			} catch(e) {
				return [];
			}
		},
	}
}
</script>