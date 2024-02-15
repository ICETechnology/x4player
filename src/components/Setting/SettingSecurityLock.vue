<!-- 生物辨識(臉部/指紋) https://github.com/NiklasMerz/cordova-plugin-fingerprint-aio -->
<template>
	<div class="mix-setting-ctn mgt2 flex-col" v-touching="`.touching-effect`">
		<div class="setting-list-ctn flex-col overflow-auto flex-1">
			<ScrollBounce class="FULL" v-stop-propagation-y>
				<div class="flex-col pdt2">
					<!-- 手勢登入 -->
					<div class="flex-row pdlr3 pdtb1 mglr2 mgb1 touching-effect hover-line security-lock-card" :class="{ 'border-active': activeCheck == 'pattern' }" v-if="enablePatternLock" @click="onGrpLineClick('SetPatternLock', `手勢登入`)">
							<i class="material-icons md-36 mgr2 check-icon" :class="{ active: activeCheck == 'pattern' }">gesture</i>
						<div class="flex-1 flex-col">
							<div class="flex-1 flex-vertical-center security-lock-title" :class="{ active: activeCheck == 'pattern' }">{{$ln(`手勢登入`)}}</div>
							<div class="flex-1 security-lock-text">{{$ln(`畫出連線圖形進行驗證`)}}</div>
						</div>
						<div class="flex-end"><i class="material-icons md-24" :class="{ active: activeCheck == 'pattern' }">keyboard_arrow_right</i></div>
					</div>
					<!-- 生物辨識 -->					
					<div class="flex-row pdlr3 pdtb1 mglr2 mgb1 touching-effect hover-line security-lock-card" :class="{ 'border-active': activeCheck == 'finger' }" v-if="showFingerprintManager" @click="onGrpLineClick('SetFingerprintLock', `生物辨識`)">
							<i class="material-icons md-36 mgr2 check-icon" :class="{ active: activeCheck == 'finger' }">sentiment_satisfied</i>
						<div class="flex-1 flex-col">
							<div class="flex-1 flex-vertical-center security-lock-title" :class="{ active: activeCheck == 'finger' }">{{$ln(`生物辨識`)}}</div>
							<div class="flex-1 security-lock-text">{{$ln(`使用你的面孔或指紋進行驗證`)}}</div>
						</div>
						<div class="flex-end"><i class="material-icons md-24" :class="{ active: activeCheck == 'finger' }">keyboard_arrow_right</i></div>
					</div>
				</div>
				<div>
					<div class="inactive-security flex-center" v-if="!activeCheck">{{$ln(`尚未啟用`)}}</div>
					<div class="cancel-security flex-center" v-if="activeCheck" @click="cancelSecurityLock">{{$ln(`取消快速登入`)}}</div>
				</div>
			</ScrollBounce>
		</div>
	</div>
</template>

<script>
import SetPatternLock from "@/components/SetPatternLock.vue";
import SetFingerprintLock from "@/components/SetFingerprintLock.vue";
import Fingerprint from 'cordova-plugin-fingerprint-aio/www/Fingerprint.js';

export default {
	props: [],
	data() {
		return {
			// 顯示生物辨識功能
			showFingerprintManager: false,
		}
	},
	components: {},
	beforeMount() {},
    mounted() {
		this.$emit('title', this.$ln('快速登入'));
		// 判斷設備是否可用生物辨識功能
		let vm = this;
		Fingerprint.isAvailable(isAvailableSuccess, isAvailableError);
		// 可以
		function isAvailableSuccess(result) {
			// 公開設定若使用 fingerprintLock
			if(vm.$store.state.config.publicPdSetting.function.fingerprintLock)
				vm.showFingerprintManager = true;
		}
		// 不可以
		function isAvailableError(error) {
			vm.showFingerprintManager = false;
			if(vm.activeCheck == 'finger') {
				vm.$store.state.securityLogin = {type: '', value: ''};
			}
		}
	},
	beforeDestroy() {},
    methods: {
		// 點擊快速登入選項
		onGrpLineClick(com, title) {
			switch(com) {
				case "SetPatternLock":
					eventBus.$emit("POPUP-DIALOG", SetPatternLock, "", {transName: 'float'});
					break;
				case "SetFingerprintLock":
					eventBus.$emit("POPUP-DIALOG", SetFingerprintLock, "", {transName: 'float'});
					break;
			}
		},
		// 取消快速登入
		cancelSecurityLock() {
			eventBus.$emit("CONFIRM-DIALOG", {
				content: this.$ln('確定要取消快速登入功能？'),
				cancelText: "取消",
				confirmText: "確認",
				confirm: function(){
					// 取消任何快速登入
					this.$store.state.securityLogin = {type: '', value: ''};
				}.bind(this),
			});
		},
	},
	watch: {
	},
    computed: {
		// 顯示手勢登入功能
		enablePatternLock() {
			try {return this.$store.state.config.publicPdSetting.function.patternLock;}catch(e){}
		},
		// v-bind 勾選快速登入樣式
		activeCheck () {
			return this.$store.state.securityLogin.type;
		}
	},
}
</script>

<style scoped>
.inactive-security {
	text-align: center;
	margin: 50px auto;
}
.cancel-security {
	text-align: center;
	margin: 50px auto;
	color: rgb(76, 217, 100);
	border: rgb(76, 217, 100) 1px solid ;
	border-radius: 5px;
	width: 40%;
	padding: 10px;
}
.check-icon {
	line-height: 45px;
}
.security-lock-card {
	border-radius: 15px;
	border: gray 1px solid ;
}
.security-lock-title {
	line-height: 45px;
	font-size: 18px;
}
.security-lock-text {
	line-height: 45px;
	color: gray;
	border-top: gray 1px solid ;
	width: 90%;
}
.active {
	color: rgb(76, 217, 100);
}
.border-active {
	border: rgb(76, 217, 100) 1px solid ;
}
</style>