<template>
    <div class="rights-btn-ctn flex-1 flex-row flex-start" @click="onClickBtn">
		<span class="flex-1 label">{{$ln(rightsTabName)}}</span>
		<i class="material-icons">arrow_drop_down</i>
    </div>
</template>

<script>
import RightsSelector from "@/components/RightsSelector.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 同步帳務選單與顯示內容
		this.onRightsTabID();
	},
    mounted() {
		// 自動開啟選單
		if (this.autoOpenSubMenu)
			this.onClickBtn();
	},
	beforeDestroy() {},
	components: {
		RightsSelector,
	},
    methods: {
		onClickBtn() {
			eventBus.$emit("POPUP-DIALOG", RightsSelector);
			this.$store.state.sync.autoOpenSubMenu = false;
		},
		onRightsTabID() {
			// 资金 / 备兑
			let accountLayout = this.$store.state.config.CONFIG.LAYOUT['account'].layout;
			if (this.rightsTabID === "Warrant")
				accountLayout.body = "Warrant";
			else if (this.rightsTabID === "ExerciseRecord")
				accountLayout.body = "ExerciseRecord";
			else
				accountLayout.body = "MixRights";
		}
	},
	watch: {
		rightsTabName(nv) {
			console.log(nv);
		},
		/** 自動開啟選單 */
		autoOpenSubMenu(nv) {
			if (nv)
				this.onClickBtn();
		},
		/** 帳務選單改變 */
		rightsTabID(nv) {
			this.onRightsTabID();
		}
	},
    computed: {
		rightsTabID() {
			return this.$store.state.status.rightsTabID;
		},
		/** 交易所ID */
		rightsTabName() {
			return this.$store.state.status.rightsTabName;
		},
		autoOpenSubMenu() {
			return this.$store.state.sync.autoOpenSubMenu;
		},
	},
}
</script>

<style scoped>
.rights-btn-ctn {
	height: 40px;
	padding: 0 5px;
	border-radius: 3px;
	background-color: orange;
}
.rights-btn-ctn .label {
	width: 100%;
	white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>