<!-- 生物辨識(臉部/指紋) https://github.com/NiklasMerz/cordova-plugin-fingerprint-aio -->
<template>
	<div class="fingerprint-unlock hidden">
	</div>
</template>

<script>
import Fingerprint from 'cordova-plugin-fingerprint-aio/www/Fingerprint.js';

export default {
	props: ['active','title'],
	data() {
		return {
		}
	},
	beforeMount() {
	},
	mounted() {
	},
	beforeDestroy() {
	},
	components: {
	},
	methods: {
		fingerprintLogin() {
			let vm = this;			
			Fingerprint.isAvailable(isAvailableSuccess, isAvailableError);
			// 可以使用 cordova-plugin-fingerprint-aio 套件
			function isAvailableSuccess(result) {
				// 可使用指紋辨識
				vuex.status.fingerPrintAvailable = true;
				// 1.iPhone X ，支援臉部辨識 (臉部/ 指紋 則一)
				if(result == 'face') { 
					Fingerprint.show({
						title: '「 ' + vm.title + ' 」使用生物辨識',
						description: "請執行生物辨識驗證",
						cancelButtonTitle: "取消",
					}, successCallback, errorCallback);
					// 成功，回傳登入事件
					function successCallback(){
						vm.$emit('fingerprint-unlock');
					}
					// 取消生物辨識
					function errorCallback(error){
						vm.$emit('close-unlock');
					}
				// 2.Android P+，支援臉部辨識 (指紋優先選擇，再臉部)
				} else if(result == 'biometric') {
					// 先檢查指紋
					Fingerprint.registerBiometricSecret({
						title: '「 ' + vm.title + ' 」使用生物辨識',
						cancelButtonTitle: "取消",
						description: "請執行生物辨識驗證",
						invalidateOnEnrollment: true,
						disableBackup: true,
						secret: "secret",
					}, successCallback, errorCallback);
					// 成功，回傳登入事件
					function successCallback(){
						vm.$emit('fingerprint-unlock');
					}
					// 取消，或無法獲取設備中的指紋
					function errorCallback(error){
						// alert(error.message);
						// 取消
						if(error.message == 'BIOMETRIC_DISMISSED') {
							vm.$emit('close-unlock');
						// 無法獲取設備中的指紋，執行臉部辨識
						} else {							
							Fingerprint.show({
								title: '「 ' + vm.title + ' 」使用生物辨識',
								description: "請執行生物辨識驗證",
								cancelButtonTitle: "取消",
								disableBackup : true,
							}, successCallback, errorCallback);
							// 成功，回傳登入事件
							function successCallback(){
								vm.$emit('fingerprint-unlock');
							}
							// 取消臉部辨識
							function errorCallback(error){
								vm.$emit('close-unlock');
							}
						}						
					}
				// 3.其他 Android 和 iOS ，不支援臉部辨識 (支援指紋)
				} else if(result == 'finger') {
					// alert(vm.deviceType);
					// 有些 android 系統使用 loadBiometricSecret 會有 error.message(BIOMETRIC_NO_SECRET_FOUND)，所以這裡選用 show 方法
					// 但使用 show 的 ios 背景遮罩可能不會覆蓋全螢幕，所以使用 loadBiometricSecret
					// 設備是 Android 的狀況
					if(vm.deviceType == 'android') {
						// *** Show authentication dialogue
						Fingerprint.show({
							title: '將 Touch ID 用於「 ' + vm.title + ' 」',
							cancelButtonTitle: "取消",
							description: "請驗證您的指紋",
							cancelButtonTitle: "取消",
							disableBackup: true,
						}, successCallback, errorCallback);
						// 成功，回傳登入事件
						function successCallback(){
							vm.$emit('fingerprint-unlock');
						}
						// 取消指紋登入
						function errorCallback(error){
							vm.$emit('close-unlock');
						}
					// 設備是 iOS 的狀況
					} else if(vm.deviceType == 'ios') {
						// *** Register secret
						Fingerprint.registerBiometricSecret({
							title: '將 Touch ID 用於「 ' + vm.title + ' 」',
							cancelButtonTitle: "取消",
							description: "請驗證您的指紋",
							secret: "my-super-secret",
							invalidateOnEnrollment: true,
						}, successCallback, errorCallback);
						// 成功， loadBiometricSecret
						function successCallback(){
							// *** Show authentication dialogue and load secret
							Fingerprint.loadBiometricSecret({
								title: '將 Touch ID 用於「 ' + vm.title + ' 」',
								cancelButtonTitle: "取消",
								description: "請驗證您的指紋",
								secret: "my-super-secret",
								// invalidateOnEnrollment: true,
							}, successCallback, errorCallback);
							// 成功，回傳登入事件
							function successCallback(){
								vm.$emit('fingerprint-unlock');
							}
							// 取消指紋登入
							function errorCallback(error){
								vm.$emit('close-unlock');
							}
						}
						// 取消指紋登入
						function errorCallback(error){
							vm.$emit('close-unlock');
						}
					}
				}				
			}
			// 不可以使用 cordova-plugin-fingerprint-aio 套件
			function isAvailableError(error) {
			}
		}
	},
	watch: {
		active() {
			if(this.active) 
				this.fingerprintLogin();
		}
	},
	computed: {
		projectID() {
			return this.$store.state.config.projectID;
		},
        deviceType() {
            if (!this.$store.state.device.isAPP)
                return 'browser';
            if (this.$store.state.device.isAndroid)
                return 'android';
            else if (this.$store.state.device.isDeviceIOS)
                return 'ios';
            else
                return 'unknown';
        },
	}
}
</script>

<style scoped>
</style>