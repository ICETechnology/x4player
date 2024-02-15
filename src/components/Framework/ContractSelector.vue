<template>
	<ContractSelectorChild
		class="flex-start flex-row"
		:display-list="displaySelect"
		:node-list="nodeList"
		:default-select="selectIdxList"
		@contract-change="onContractChange"
	/>
</template>

<script>
export default {
	props: ["defaultSelectIndex", "classification", "storageKey", "displaySelect"],
	data() {
		return {
			// 取得指定的分類表
			nodeList: M4C.Symbol.getClassification(this.classification),
			// 從 localStorage 或 default 取得每一層 select 要停在哪個 index (Array)
			selectIdxList: this.defaultSelectIndex,
		};
	},
	created() {
		// 從 localStorage 取得每一層 select 要停在哪個 index
		let storage = localStorage.getItem(`ContractSelector.${this.storageKey}`);
		this.selectIdxList = storage ? JSON.parse(storage) : this.defaultSelectIndex;
	},
	methods: {
		// 合約層異動
		onContractChange: function(sid, idxList) {
			// 記憶當前每一層停留的index
			localStorage.setItem(`ContractSelector.${this.storageKey}`, JSON.stringify(idxList));
			// 向 parent 送出
			this.$emit('contract-change', sid);
		}
	},
};
</script>
<style scoped>
</style>