<template>
	<!-- 欄位設定 -->
	<div class="ct-ctn flex-center flex-row">
		<i class="material-icons md-24 hover-icon" @click="onColumnConfig">playlist_add</i>
	</div>
</template>
<script>
import ColumnConfig from "./ColumnConfig.vue";
export default {
	data() {
		return {
			columnConfig: {},
		}
	},
	components: {ColumnConfig},
	props:["current", "default", "mode"],
	methods: {
		onColumnConfig() {
			this.columnConfig.current = this.current;
			this.columnConfig.default = this.default;
			this.columnConfig.mode = this.mode;
			eventBus.$emit("POPUP-DIALOG", ColumnConfig, this.columnConfig, {$HEAD: {title: this.$ln(`栏位设定`)}, transName: 'float', lock: true});
		},
	},
}
</script>