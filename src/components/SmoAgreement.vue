<template>
    <div class="smo-agreement flex-col">
		<div class="flex-1 posr">
			<SmoAgreementContent class="pdlr5" @ready="displayBtns = true" @scrollReachBottom="enableAgreeBtn = true" />
		</div>
		<div class="flex-col pdlr5" v-show="displayBtns">
			<Button class="iceben pdtb1" :class="{disabled: !enableAgreeBtn}" @click="onBtnConfirm">{{$ln('同意，并启用')}}</Button>
			<span class="mgtb5 flex-center font-size-small" @click="onBtnCancel">{{$ln('不同意，退出')}}</span>
		</div>
    </div>
</template>

<script>
import SmoAgreementContent from "@/components/SmoAgreementContent.vue";
import SmoAgreementConfig from "@/components/SmoAgreementConfig.vue";
export default {
	props: [],
	data() {
		return {
			enableAgreeBtn: false,
			displayBtns: false,
		}
	},
	beforeMount() {},
    mounted() {
		this.$emit('title', '启用 - 云端洗价服务');
	},
	beforeDestroy() {},
	components: {SmoAgreementContent},
    methods: {
		// 同意啟用
		onBtnConfirm() {
			this.$store.state.config.smoSignedDate = new Date().getTime();
			// 更新本地記錄的同意書版本
			this.$store.state.config.localSmoAgreementVersion = this.$store.state.config.cloudSmoAgreementVersion;
			// 關閉本彈窗
			eventBus.$emit("CLOSE-DIALOG");
			// 彈出同意書設定畫面
			// setTimeout(()=>{
			// 	eventBus.$emit("POPUP-DIALOG", SmoAgreementConfig, "", {transName: 'float'});
			// }, 100);
			// 對所有連線要求持續性連線
			M4C.GTC.requestOpenAll();
			// 對所有連線送出更新同意書
			M4C.SmoAgreement.updateAgreementAll();
		},
		onBtnCancel() {
			eventBus.$emit("CLOSE-DIALOG");
			// 關閉持續性連線
			M4C.GTC.requestCloseAll();
		},
	},
	watch: {},
    computed: {
		cloudSmoAgreementVersion() {
			return this.$store.state.config.cloudSmoAgreementVersion;
		},
	},
}
</script>

<style scoped>
</style>