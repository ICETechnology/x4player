<template>
    <div class="mix-head-order-report flex-column">
		<MyHead class="head" :backType="1"></MyHead>
		<MixOrderReport class="flex-1" :param="param"></MixOrderReport>
    </div>
</template>

<script>
import MixOrderReport from "@/components/Mix/mix.order.report.vue";

export default {
	props: ['param'],
	data() {
		return {
            sid: '',
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
		MixOrderReport,
	},
}
</script>
 
<style>
.head {
	background-color: #333;
}
</style>