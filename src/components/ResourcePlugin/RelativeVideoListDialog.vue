<template>
	<div class="resource-plugin-dialog">
		<RelativeVideoList theme="dark" :lang="langCode" :keyword="param.keyword" 
			@onDialogClose="onDialogClose"
			@onResourceClick="onResourceClick"
			v-stop-propagation-y />
	</div>
</template>

<script>
import ResourceDetailEntryDialog from "@/components/ResourcePlugin/ResourceDetailEntryDialog.vue";
export default {
	props: ["param"],
	data() {
		return {
		}
	},
	beforeMount() {
		console.log(`RelativeVideoListDialog param.keyword: ${this.param.keyword}`);
	},
    mounted() {
		// 鎖定直向
		window.lockScreen('portrait');
	},
	beforeDestroy() {
		// 解除鎖定直向 (為了讓視頻可轉橫向播放)
		screen.orientation.unlock();
	},
	components: {
	},
    methods: {
		onDialogClose() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onResourceClick(id) {
			eventBus.$emit("POPUP-DIALOG", ResourceDetailEntryDialog, {id: id}, {transName: 'float', noHead: true});
		},
	},
	watch: {
	},
    computed: {
		/** 要帶給 vue-option-cloud 的語系代號 */
		langCode() {
			switch(this.$store.state.lang.language) {
				case "zh":		return "zh-CN";
				case "zh-TW":	return "zh-TW";
				case "en":		return "en";
			}
		},
	},
}
</script>

<style scoped>
</style>