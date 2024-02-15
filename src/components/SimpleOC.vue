<template>
    <div class="FULL flex-col pd5">
		<div class="flex-1 overflow-hidden">
			<OptionCloudSwipeMenu @clickCallback='onOptMenu' theme="dark" :lang="langCode" />
		</div>
    	<div class="flex-1 posr overflow-hidden">
			<!-- 橫式自選報價 -->
			<HorizontalSelfSelect class="horizontal-selfselect" 
				@onQuoteCardClick="onQuoteCardClick"
				:notPopupDialog="existQuotePage" />
		</div>
    </div>
</template>

<script>
import Vue from 'vue';
import OptCloudDialog from "@/components/OptCloudDialog.vue";
import HorizontalSelfSelect from "@/components/HorizontalSelfSelect.vue";
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		Vue.use(OptionCloud, this.$store.state.wsConnMap.quote.acPdSetting.optioncloud.plugin);
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		HorizontalSelfSelect,
	},
    methods: {
		/** 期權雲選單點擊 */
		onOptMenu(param) {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-DIALOG", OptCloudDialog, {clsName: "OptCloudDialog", id: param.id, name: param.name});
			this.$parent.$emit('close')
		},
		onQuoteCardClick() {
			this.$parent.$emit('close')
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
		dialogList() {
			return this.$store.state.popup.dialogList;
		},
		/** 是否已經存在商品詳情彈窗，若已存在時，透過 notPopupDialog 讓 QuoteCardSD 不再彈窗以免出現兩個商品詳情 */
		existQuotePage() {
			return this.dialogList.length > 0 && this.dialogList[this.dialogList.length-1].cls === "QuotePage";
		},
	},
}
</script>
<style scoped>
</style>