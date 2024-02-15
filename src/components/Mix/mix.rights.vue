<template>
    <div class="flex-column mix-rights-ctn">
		<TabGroup ref="tg" tab-key="TG-Rights" class="" :tabList="tabList" :selectedIdx="selectedIdx" @onActiveTab="onActiveTab"
			:hiddenTab="true" :suspend="suspend"></TabGroup>
    </div>
</template>

<script>
export default {
	props: ["suspend"],
	data() {
		return {
			selectedIdx: 0,
			// 以幣別為 key 的響應式資金資料
			allMarginData: this.$store.state.data.marginData,
		}
	},
	beforeMount() {
		// 支持預設顯示上次記憶的Tab
		this.selectedIdx = this.tabList.findIndex(obj => obj.param === this.rightsTabID);
		if (this.tabList[this.selectedIdx])
			this.tabList[this.selectedIdx].selected = true;
	},
    methods:{
		onActiveTab(obj) {
			this.$store.state.status.rightsTabID = obj.tab.param;
		},
	},
	watch: {
		/** 頁簽ID改變切換 */
		rightsTabID(tabID) {
			let selectedIdx = this.tabList.findIndex(obj => obj.param === tabID);
			this.$refs.tg.onTabClick(selectedIdx);
		},
	},
    computed: {
		/** 當前選到的頁簽ID */
		rightsTabID() {
			return this.$store.state.status.rightsTabID;
		},
		/** 所有資金幣別 */
		tabList() {
			let list = [];
			// 有資料的幣別才顯示 (目前只看當前權益數，有需要可能再加)
			for (let key in this.allMarginData) {
				if (Number(this.allMarginData[key].CURRENT_BALANCE) != 0) {
					list.push({label: key, comClass: "Margin", param: key},);
				}
			}
			// 完全無幣別資料時
			if (list.length === 0) {
				list.push({label: this.rightsTabID, comClass: "Margin", param: this.rightsTabID});
			}
			return list;
		}
    }
}
</script>

<style>
</style>