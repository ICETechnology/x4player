<template>
	<div class="login-image-ctn">
		<img class="logo" :src="loginImageSrc" @load="onLoad" />
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			// 圖檔版號
			loginImageVersion: "",
		}
	},
	beforeMount() {
		// 查詢 login.gif 的版號
		let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
		let url = `https://${window.$path.LOGIN_HOST}/ss2/fsInfo/appbo?f=pic/splash/login.gif&qry=${qry}&r=${new Date().getTime()}`;
		fetch(url).then(response => response.json()).then(data => {
			try{this.loginImageVersion = data.d[0].version;}catch(err){};
		});
	},
	mounted() {
		// 最多等圖片五秒 (避免上層等 load 卡住而無法顯示登入畫面)
		this.timeout = setTimeout(this.onLoad, 5000);
	},
	beforeDestroy() {},
	components: {},
	methods: {
		onLoad() {
			clearTimeout(this.timeout);
			this.$emit('load');
		},
	},
	watch: {},
	computed: {
		loginImageSrc() {
			if (!this.loginImageVersion)
				return;
			let qry = `{"isRelease":"Y", "company": "${window.comp}", "product": "${window.prod}"}`;
			return `https://${window.$path.LOGIN_HOST}/ss2/fs/appbo/${this.loginImageVersion}/pic/splash/login.gif?qry=${qry}`;
		},
	},
}
</script>
<style scoped>
.logo {
	width: 100%;
	height: 100%;
	background-size: contain;
	background-repeat: no-repeat;
}
</style>