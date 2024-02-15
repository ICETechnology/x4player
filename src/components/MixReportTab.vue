<template>
    <div ref="ctn" class="mix-report-tab-ctn flex-row" @click="onClick">
		<span>{{tabLabel}}</span>
		<i class="material-icons md-24 clr-orange icon-drop-down">arrow_drop_down</i>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			optionList: [
				{label: "委托回报（所有）", optionLabel: "所有回报", reportType: "All"},
				{label: "委托回报（有效）", optionLabel: "有效回报", reportType: "Working"},
				{label: "委托回报（完全成交）", optionLabel: "完全成交", reportType: "TotalFilled"},
				{label: "委托回报（部分成交）", optionLabel: "部分成交", reportType: "PartialFilled"},
				{label: "委托回报（错误回报）", optionLabel: "错误回报", reportType: "Error"},
			],
		}
	},
	beforeMount() {},
    mounted() {
		// 預設所有回報
		this.$store.state.mixReport.reportType = this.reportType || this.optionList[0].reportType;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			// 從別的頁簽點擊時，不彈出選單
			if (!this.$refs.ctn.classList.contains('selected')) return;
			// 無清單就不彈出選項
			if (!this.selectOptList.length) return;
			eventBus.$emit("SINGLESELECT-DIALOG", {
				options: this.selectOptList,
				confirmBtn: false,
				onfinish: opts => {
					if (!opts) return;
					this.$store.state.mixReport.reportType = opts.value;
				}
			});
		}
	},
	watch: {},
    computed: {
		/** 頁簽顯示文字 */
		tabLabel() {
			let opt = this.optionList.find(opt => opt.reportType === this.reportType);
			if (!opt) opt = this.optionList[0];
			return this.$ln(opt.label);
		},
		/** 彈出選單 */
		selectOptList() {
			return this.optionList.map((opt)=>{
				return {label: opt.optionLabel, value: opt.reportType, selected: opt.reportType === this.reportType};
			});
		},
		/** 當前回報類別 */
		reportType() {
			return this.$store.state.mixReport.reportType;
		},
	},
}
</script>

<style scoped>
.icon-drop-down {
	margin-left: -5px;
	margin-right: -10px;
}
</style>