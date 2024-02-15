<template>
    <div class="flex-center font-size-small">
		<span>{{$ln('还没有期货实盘帐号？')}}</span>
		<span class="mgl3 btn-apply tcef" @click="onBtnApply">{{$ln('手机线上开户')}}</span>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onBtnApply() {
			let self = this;
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 3000);
			if (!window.plugins || !window.plugins.RegisterOnline) {
				this.$store.state.notify(`error`, `找不到开户云介面 ! 请注意本功能需已支持开户云的 app 版本 !`);
				return;
			}
			let brokerId = this.applyonline.broker_id;
			let channel = this.applyonline.channel;
			console.log(`ApplyOnline RegisterOnline.register brokerId=${brokerId}, channel=${channel}`);
			// 開戶雲 API
			window.plugins.RegisterOnline.register({
				"brokerId": brokerId,
				"channel": channel,
			}, 
			// success callback
			function() {
				console.log("ApplyOnline success");
				this.$store.state.loading = false;
			}, 
			// failure callback
			function(error) {
				console.error("ApplyOnline error: " + error.message);
				self.$store.state.notify(`error`, error.message + ' (请检查设定代号是否正确)');
				self.$store.state.loading = false;
			});
			// 打開全局 loading
			this.$store.state.loading = true;
		}
	},
	watch: {},
    computed: {
		/** 開戶雲設定 */
		applyonline() {
			return this.$store.state.config.quotePdSetting.function.applyonline;
		},
	},
}
</script>

<style scoped>
.btn-apply {
	padding: 0 8px;
	color: #FA9917;
	border: 1px solid #666;
	border-radius: 12px;
}
</style>