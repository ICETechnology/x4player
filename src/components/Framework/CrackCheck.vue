<template>
	<BlockMessage v-if="bmParam.display" :param="bmParam" :clickConfirm="clickConfirm" @confirm="onClick"></BlockMessage>
</template>
<script>
import BlockMessage from "@/components/Framework/BlockMessage.vue";
export default {
	data() {
		return {
			isRoot: "",
			isDevEnable: "",
			// BlockMessage參數
			bmParam: {
				display: false,
				head: '',
				body: '',
				showConfirmBtn: true,
				showCancelBtn: false,
				showLoadingIcon: false,
			},
		}
	},
	components: {BlockMessage},
	props: ['value', 'clickConfirm'],
	mounted() {
		// 破解提示訊息(轉語系)
		this.bmParam.body = this.$ln('root_notify_description');
		// 如果是app
		if(this.$store.state.device.isAPP) {
			// 檢查是否root或是破解
			if(this.iRoot)
				this.iRoot.isRooted(this.onSuccessCallback, this.onFailureCallback);
			// 檢查是否有開啟開發者模式
			if(this.devoptionschecker)	
				this.devoptionschecker.check(this.onDevCheckResult, this.onDevCheckFailure);
		}
		else
			this.callDestory();
	},
	methods: {
		// 確定
		onClick(){
			this.bmParam.display = false;
			this.$emit('input', false);
		},
		// 越獄、root檢查結果。true: 有破解，false: 無破解。
		onSuccessCallback(res) {
			console.log("[Crack check] isRoot check result is ", res)
			// 檢查結果是true時，啟動訊息。
			this.isRoot = res;
		},
		// 檢查失敗
		onFailureCallback(e) {
			console.warn("[Crack check] isRoot check error by ", e);
			this.isRoot = false;
		},
		// 開發者模式是否開啟
		onDevCheckResult(res) {
			console.log("[Crack check] DevCheck result is ", res.devOptionsEnabled)
			// 回傳的是物件結果。欄位devOptionsEnabled代表是否有開啟開發者模式
			this.isDevEnable = res.devOptionsEnabled;
		},
		// 檢查失敗
		onDevCheckFailure(e) {
			console.warn("[Crack check] DevCheck error by ", e);
			this.isDevEnable = false;
		},
		// 消滅整個組件
		callDestory(){
			console.log("[Crack check] callDestory");
			this.$emit('input', false);
		}
	},
	watch: {
		checkResult(nv, ov) {
			// 檢查確認有破解或開發者模式，顯示訊息
			if(nv)
				this.bmParam.display = nv;
		},
		// 檢查結束，根據結果處理組件
		checkFinished(nv , ov) {
			// 沒有破解或開啟開發者模式就消滅組件
			if(nv && !this.checkResult) {
				this.callDestory();
			}
		}
	},
	computed: {
		// 破解檢查插件
		iRoot() {return window.IRoot;},
		// 開發者模式檢查插件
		devoptionschecker() {
			try{return window.cordova.plugins.devoptionschecker;}catch(e){}
		},
		// 檢查結果
		checkResult() {return this.isRoot || this.isDevEnable;},
		// 檢查結束
		checkFinished() {return this.isRoot !== "" && this.isDevEnable !== ""},
	}
}
</script>
