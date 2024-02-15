<template>
    <div class="report-card-detail flex-col pd5">
		<ReportCardSD :rpt="param.rpt" />
		<div class="flex-1"/>
    </div>
</template>

<script>
import ReportCardSD from "@/components/ReportCardSD.vue";
export default {
	props: ['param'],
	data() {
		return {}
	},
	beforeMount() {
		this.$emit('title', '回报明细资料');
	},
    mounted() {},
	beforeDestroy() {},
	components: {ReportCardSD},
    methods: {},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>