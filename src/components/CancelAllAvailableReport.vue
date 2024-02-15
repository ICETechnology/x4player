<template>
    <div class="cancel-all-available-report-ctn tcef flex-center" @click="onClick" :class="{disabled: !availableReportList.length}">{{$ln(`全删`)}}</div>
</template>

<script>
export default {
    methods: {
		onClick() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: `全部删单`,
				content: `${this.$ln('确定对共')} ${this.availableReportList.length} ${this.$ln('笔有效委托全部删单')} ?`,
				confirm: ()=>{
					M4C.Order.cancelOrderByReport(this.availableReportList);
				},
			});
		},
	},
	watch: {},
    computed: {
		availableReportList() {
			return this.$store.state.data.availableReportList.filter((rpt)=>{
				return !rpt.$IS_CLOUD;
			});
		},
	},
}
</script>

<style scoped>
.cancel-all-available-report-ctn {
    width: 12vw;
    height: 12vw;
    border-radius: 50%;
    color: white;
    background-color: #DE6461;
    box-shadow: 0px 0px 5px 0px rgba(222, 100, 97, 0.5);
}
</style>