<template>
	<div class="remove-local-cert w100p font-size-micro">
		<Button class="w100p btn-confirm-iceben flex-start" @click="onBtnRemoveCert">
			<i class="material-icons mglr2">delete</i>刪除憑證
		</Button>
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
		// 刪除本地憑證
		onBtnRemoveCert() {
			eventBus.$emit("CONFIRM-DIALOG", {
				title: '刪除本地憑證 (測試用)',
				content: "是否要刪除憑證 (同時重建 deviceID) ? 刪除後會自動重新啟動",
				confirm: function(){
					localStorage.removeItem(`${vuex.config.projectID}_$STORE_device>deviceID`);
					localStorage.removeItem(`${vuex.config.projectID}_$STORE_cert`);
					setTimeout(()=>{window.location.reload();}, 100);
				}.bind(this),
			});
		},
	},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>