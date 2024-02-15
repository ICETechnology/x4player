<template>
    <div class="mix-order-report flex-1 flex-column">
		<SimpleOrder :sid="sid"></SimpleOrder>
		<TabGroup :tabList="tabList" tab-key="TG-RPT" keep-alive="true"></TabGroup>
    </div>
</template>

<script>
import SimpleOrder from "@/components/SimpleOrder.vue";

export default {
	props: ['param'],
	data() {
		return {
            sid: '',
			tabList: [
				{label: "持仓", comClass: "PositionTable", param: {mode: 1}},
				{label: "挂单", comClass: "ReportTable", param: {mode: 1}, "AlertByEvent": "RECEIVE-REALTIME-WORKING"},
				{label: "委托", comClass: "ReportTable", param: {mode: 2}, "AlertByEvent": "RECEIVE-REALTIME-REPORT"},
				{label: "成交", comClass: "ReportTable", param: {mode: 3}, "AlertByEvent": "RECEIVE-REALTIME-FILLED"},
			],
        }
	},
	beforeMount() {
		this.sid = this.param.sid;
		this.minfo = M4C.Symbol.getMainformInfo(this.sid);
	},
    mounted() {
		console.log(`TradeOrder.mounted`);
    },
    methods: {
    },
    computed: {
    },
	components: {
		SimpleOrder,
	},
}
</script>
 
<style>
</style>