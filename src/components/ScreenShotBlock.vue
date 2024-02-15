<template>
	<BlockMessage v-if="bmParam.display" :param="bmParam" @confirm="onEnable" @cancel="onClose"></BlockMessage>
</template>
<script>
import BlockMessage from "@/components/Framework/BlockMessage.vue";
export default {
	data() {
		return {
			// BlockMessage參數
			bmParam: {
				display: false,
				head: '',
				body: '',
				showConfirmBtn: true,
				confirmText: '不再显示',
				showCancelBtn: true,
				cancelText: '开启截图',
				showLoadingIcon: false,
			},
		} 
	},
	props: ["value", "mode"],
	components: {BlockMessage},
	beforeMount() {
		// 提示訊息轉語系
		this.bmParam.body = this.$ln('screen_shot_description');
	},
	mounted() {
		// 有帶mode時不往下處理
		if(this.mode) return
		// android及首次開啟顯示選擇訊息
		if(this.plugin && this.isAndroid && this.$store.state.device.screenShotProtect === "")
			this.bmParam.display = true;
		else {
			if(this.plugin) {
				// IOS或已開啟截圖時設定開啟截圖
				if(this.$store.state.device.screenShotProtect === "" || this.$store.state.device.screenShotProtect) {
					this.enableSS();
				}
				// 其他情境屏蔽螢幕截圖
				else 
					this.disableSS();
			}
			this.destorySelf();
		}
	},
	methods: {
		// 開啟截圖
		enableSS() {
			if(this.plugin) {
				if (typeof this.plugin.enable === "function") {
					// andorid 8以上只能處圖截圖設定
					this.plugin.enable(this.reSolveSetting,  this.rejectSetting);
				} else {
					this.$store.state.notify(`error`, "Plugin not support screenshot");
					// 記錄plugin不支援的手機UA
					console.log('[ScreenShotBlock]', "Plugin not support screenshot on ", navigator.userAgent);
				}
			}
			else
				console.log('[ScreenShotBlock]', "no available Plugin");
		},
		// 關閉截圖
		disableSS() {
			if(this.plugin) {
				if (typeof this.plugin.disable === "function") {
					this.plugin.disable(this.reSolveSetting,  this.rejectSetting);
				} else {
					this.$store.state.notify(`error`, "Plugin not support screenshot");
					// 記錄plugin不支援的手機UA
					console.log('[ScreenShotBlock]', "Plugin not support screenshot on ", navigator.userAgent);
				}
			}
			else
				console.log('[ScreenShotBlock]', "no available Plugin");
		},
		// 設定完成
		reSolveSetting(result) {console.log('[ScreenShotBlock]', 'setting OK!');},
		// 設定被拒
		rejectSetting(error) {console.log('[ScreenShotBlock]', 'setting reject!', error)},
		// 保持開啟截圖
		onClose() {
			// 執行開啟截圖
			this.enableSS();
			this.$store.state.device.screenShotProtect = true;
			this.destorySelf();
		},
		// 關閉截圖
		onEnable() {
			// 執行屏蔽截圖
			this.disableSS();
			this.$store.state.device.screenShotProtect = false;
			this.destorySelf();
		},
		// 消滅自已
		destorySelf() {
			// 通知上層消滅自己
			this.$emit('input', false);
		},
	},
	watch: {
		value(nv, ov) {
			// 有mode時以不顯示UI的方式處理設定螢幕截圖。
			if(this.mode) {
				if(nv)
					this.enableSS();
				else
					this.disableSS();
			}
		},
	},
	computed: {
		// 截圖保護插件
		plugin() {try {return window.plugins.preventscreenshot;} catch(e) {}},
		// 是否為android系統
		isAndroid() {return this.$store.state.device.isAndroid;},
	},
}
</script>