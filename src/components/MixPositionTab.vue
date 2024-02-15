<template>
    <div ref="ctn" class="mix-position-tab-ctn flex-row" @click="onClick">
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
				{label: "持倉", optionLabel: "持倉", positionType: "PositionCardList"},
				{label: "組合持倉", optionLabel: "組合持倉", positionType: "MixCombinePosition"},
			],
		}
	},
	beforeMount() {},
    mounted() {
		// 預設所有回報
		this.$store.state.mixPosition.positionType = this.positionType || this.optionList[0].positionType;
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
					this.$store.state.mixPosition.positionType = opts.value;
				}
			});
		}
	},
	watch: {},
    computed: {
		/** 頁簽顯示文字 */
		tabLabel() {
			let opt = this.optionList.find(opt => opt.positionType === this.positionType);
			if (!opt) opt = this.optionList[0];
			return this.$ln(opt.label);
		},
		/** 彈出選單 */
		selectOptList() {
			return this.optionList.map((opt)=>{
				return {label: opt.optionLabel, value: opt.positionType, selected: opt.positionType === this.positionType};
			});
		},
		/** 當前回報類別 */
		positionType() {
			return this.$store.state.mixPosition.positionType;
		},
	},
}
</script>

<style scoped>
.icon-drop-down {
	margin-right: -10px;
}
</style>