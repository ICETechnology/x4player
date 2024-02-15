<template>
    <div class="FULL login-trade-mix">
		<TabGroup class="FULL" :selectedIdx="0" :tabList="tabList" :disablePrevNext="true" />
    </div>
</template>

<script>
import LoginTradeNew from "@/components/LoginTradeNew.vue";
import LoginTradeSim from "@/components/LoginTradeSim.vue";

export default {
	props: [],
	data() {
		return {
            tabList: [
				{label: '实盘/仿真', comClass: LoginTradeNew},
				{label: '模拟交易',  comClass: LoginTradeSim},
			],
        }
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>