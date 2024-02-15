<template>
	<div class="FULL" v-stop-propagation-y>
		<OptionCloudDescription :lang="langCode" :id="param.id" @clickBackBtn="onClickBackBtn" @clickArticle="onClickArticle"
			:theme="isDesktop ? 'x4desktop' : 'dark'" />
	</div>
</template>
<script>
import ArticleContent from "@/components/ArticleContent.vue";
export default {
	props: ["param"],
	mounted() {
		this.$emit('title', this.param.name);
		// 解除鎖定直向 (為了讓視頻可轉橫向播放)
		screen.orientation.unlock();
	},
	beforeDestroy() {
		// 鎖定直向
		window.lockScreen('portrait');
	},
    methods: {
		/** 點擊返回按鈕 */
		onClickBackBtn() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		/** 點擊彈出文章 */
		onClickArticle(param) {
			eventBus.$emit("POPUP-DIALOG", ArticleContent, {article: {auth_key: param.id}}, {transName: 'float'});
		},
	},
	watch: {},
    computed: {
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
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
