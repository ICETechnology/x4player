<template>
	<div class="auth-wechat hidden">{{lowerCaseUnionid}}</div>
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
		auth() {
			// 瀏覽器情境 (測試用)
			if (!this.$store.state.device.isAPP || this.clickSimCount >= 20) {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: "测试专用情境",
					content: this.$ln('以模拟方式取得模拟微信帐号'),
					confirm: () => {
						if (!this.unionid)
							this.$store.state.wechat.unionid = ''.random(28).toLowerCase();	// 系統要求一律轉小寫
					}
				});
			}
			// APP 情境
			else {
				M4C.Wechat.getUnionId();
			}
		}
	},
	watch: {
	},
	computed: {
		lowerCaseUnionid() {
			let lowerCaseUnionid = '';
			try{lowerCaseUnionid = this.$store.state.wechat.unionid.toLowerCase();}catch(e){}
			if (lowerCaseUnionid) {
				this.$store.state.sim.wechatUnionid = lowerCaseUnionid;
				this.$store.state.sim.thirdPartyType = "WECHAT";
			}
			return lowerCaseUnionid;
		},
	},
}
</script>

<style scoped>
</style>