<template>
    <div class="mix-head-order-report flex-column">
		<MyHead class="head" :backType="1" :showText="$ln(`闪电下单`)"></MyHead>
		<SymbolRow :sid="sid" :simpleMode="true" :posPL="true"></SymbolRow>
		<SwipeUpQuoteInfo tab-key="mix-head-order-report">
			<Thunder :suspend="suspend"></Thunder>
		</SwipeUpQuoteInfo>
    </div>
</template>

<script>
import Thunder from "@/components/Thunder/Thunder.vue";
import SwipeUpQuoteInfo from "@/components/SwipeUpQuoteInfo.vue";

export default {
	props: ['param', 'suspend'],
	data() {
		return {
            sid: '',
        }
	},
	beforeMount() {
		this.sid = this.param.sid;
	},
    mounted() {
		console.log(`MixHeadSymbolposThunder.mounted`);
    },
	components: {
		Thunder,
		SwipeUpQuoteInfo
	},
}
</script>
<style scoped>
.mix-head-order-report{
	overflow: auto;
}
.mix-head-order-report /deep/ .swipe-up-ctn{
	display: flex;
	overflow: hidden;
}
</style>
