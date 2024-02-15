<template>
	<div class="FULL mix-optcloud-ctn">
		<ScrollBounce class="FULL">
			<!-- 置頂廣告 -->
			<ADTop />
			<div class="mgl5 flex-col">
				<!-- 關注文字 -->
				<span class="mgtb3">{{$ln('关注')}}</span>
				<!-- 橫式自選報價 -->
				<HorizontalSelfSelect class="horizontal-selfselect"/>
			</div>
			<div class="">
				<!-- 期權雲菜單 -->
				<OptionCloudSwipeMenu @clickCallback='onOptMenu' theme="dark" :lang="langCode" />
			</div>
			<div>
				<!-- 期權雲輪播組件 -->
				<IndicatorCarousel @clickCallback="onCarouseClick" theme="dark" :lang="langCode" />
			</div>
			<!-- 分類文章 -->
			<!-- <Article class="mgt5" /> -->
			<div class="flex-1 resource-list-ctn posr" :style="{height: `${resourceHeight}px`}">
				<ResourceList theme="dark" :lang="langCode" @onHeightChange="onHeightChange" @onResourceClick="onResourceClick" />
			</div>
		</ScrollBounce>
	</div>
</template>

<script>
import Vue from 'vue';
import OptCloudDialog from "@/components/OptCloudDialog.vue";
import ResourcePluginDialog from "@/components/ResourcePluginDialog.vue";
import ADTop from "@/components/ADTop.vue";
import Article from "@/components/Article.vue";
import HorizontalSelfSelect from "@/components/HorizontalSelfSelect.vue";
export default {
	props: ['suspend'],
	data() {
		return {
			resourceHeight: 300,
		};
	},
	created() {},
	beforeMount() {
		console.log(`Vue.version : `, Vue.version);
		// 支持從 AC 的 data.d["pd.setting"].optioncloud.plugin 取得 OptionCloud 使用的參數
		console.log(`OptionCloud config : `, this.$store.state.wsConnMap.quote.acPdSetting.optioncloud.plugin);
		Vue.use(OptionCloud, this.$store.state.wsConnMap.quote.acPdSetting.optioncloud.plugin);
		// 啟用 RP 並帶入參數
		Vue.use(AlgoResource, this.$store.state.wsConnMap.quote.acPdSetting.resource.plugin);
	},
	mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "homepage");
		// 取得 OptionCloud 的版本號
		this.$store.state.device.optionCloudVersion = OptionCloud.version;
		// 取得 AlgoResource 的版本號
		this.$store.state.device.resourcePluginVersion = AlgoResource.version;
	},
	beforeDestroy() {},
	components: {
		ADTop,
		Article,
		HorizontalSelfSelect,
	},
	methods: {
		/** 期權雲選單點擊 */
		onOptMenu(param) {
			eventBus.$emit("POPUP-DIALOG", OptCloudDialog, {clsName: "OptCloudDialog", id: param.id, name: param.name});
		},
		/** 點擊 編輯 關注卡片 */
		onDisplayBord() {
			eventBus.$emit("POPUP-DIALOG", OptCloudDialog, {clsName: "OptCloudDialog", id: "WatchListBoard"});
		},
		onHeightChange(num) {
			this.resourceHeight = num;
		},
		/** 點擊 RP 文章 */
		onResourceClick(id) {
			eventBus.$emit("POPUP-DIALOG", ResourcePluginDialog, {clsName: "ResourcePluginDialog", id: id}, {transName: 'float', noHead: true});
		},
		/** 輪播點擊 */
		onCarouseClick(obj){
			// 開啟對應的期權雲組件
			this.onOptMenu(obj);
		},
	},
	watch: {},
	computed: {
		/** 要帶給 vue-option-cloud 的語系代號 */
		langCode() {
			switch(this.$store.state.lang.language) {
				case "zh":		return "zh-CN";
				case "zh-TW":	return "zh-TW";
				case "en":		return "en";
			}
		},
	}
};
</script>

<style scoped>
.mix-optcloud-ctn >>> .menu-container {
	color: white;
	background-color: #111820;
}
.horizontal-selfselect {
	min-height: 160px;
}
</style>