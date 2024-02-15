<template>
	<div class="resource-plugin-dialog">
		<ResourceDetailEntry theme="dark" :lang="langCode" :id="param.id" @onDialogClose="onDialogClose" v-stop-propagation-y/>
	</div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
		}
	},
	beforeMount() {
		console.log(`ResourceDetailEntryDialog param.id: ${this.param.id}`);
	},
    mounted() {
		// 解除鎖定直向 (為了讓視頻可轉橫向播放)
		screen.orientation.unlock();
	},
	beforeDestroy() {
		// 鎖定直向
		window.lockScreen('portrait');
	},
	components: {
	},
    methods: {
		onDialogClose() {
			eventBus.$emit("CLOSE-DIALOG");
		}
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