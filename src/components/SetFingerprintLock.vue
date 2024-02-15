<template>
    <div class="set-fingerprint-lock flex-col">
		<!-- 提示文字部分，若太長則捲動 -->
		<div class="flex-1 posr">
			<ScrollBounce class="FULL" v-stop-propagation-y>
				<div class="flex-item h100p">
					<div class="flex-1 pd5" v-html="step1Html" />
					<!-- 本地測試用 -->
					<!-- <div class="flex-1 pd5">
						<div class="flex-col">
							<div class="flex-row flex-start clr-orange">
								<i class= "material-icons md-36">verified_user</i>
								<div class="mgl2 font-size-large">確定啟用生物辨識？</div>
							</div>
							<div class="mgt5">啟用後，您可使用本裝置的生物辨識資訊進行快速登入。</div>
							<div class="mgt5">透過您行動裝置內建生物辨識資料 (Touch ID、Face ID、Android 生物特徵資料) 進行身份及交易驗證，快速登入本行情交易服務，以提供您多元的數位金融查詢與交易功能。</div>
							<div class="mgt5">因本應用不會留存您的生物特徵資料，如您欲變更生物特徵資料，請您於行動裝置系統進行設定。</div>
						</div>
					</div> -->
				</div>
			</ScrollBounce>
		</div>
		<!-- 按鈕部分，確認或取消 -->
		<div class="flex-row space-between mgt5 pdlr5">
			<Button class="iceben pdtb1 pdlr3 mgb1" :class="{disabled: this.$store.state.securityLogin.type == 'finger'}" @click="onBtnCheck(true)">{{$ln('啟用生物辨識')}}</Button>
			<Button class="iceben pdtb1 pdlr3 mgb3 bgc-333" :class="{disabled: this.$store.state.securityLogin.type != 'finger'}" @click="onBtnCheck(false)">{{$ln('取消生物辨識')}}</Button>
		</div>
    </div>
</template>

<script>
import SetFingerprintLockSuccess from "@/components/SetFingerprintLockSuccess.vue";

export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() { this.$emit('title', '生物辨識'); },
	mounted() {
	},
	beforeDestroy() {
	},
	components: {
		SetFingerprintLockSuccess,
	},
	methods: {
		// 點擊確認或取消
		onBtnCheck(boolean) {
			if(boolean == true) {
				this.$store.state.securityLogin = {type: 'finger', value: boolean};
			} else {
				this.$store.state.securityLogin = {type: '', value: ''};
			}
			eventBus.$emit("CLOSE-DIALOG");
			setTimeout(()=>{
				eventBus.$emit("POPUP-DIALOG", SetFingerprintLockSuccess, { active: boolean }, {transName: 'float'});
			},100);
		},
	},
	watch: {
	},
	computed: {
		step1Html() {
			try {return this.$store.state.config.publicPdSetting.function.fingerprintLock.step1Html;}catch(e){}
		},
	}
}
</script>

<style scoped>
</style>