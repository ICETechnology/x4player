<template>
	<div class="login-message-ctn font-size-small mgt5">{{loadingMessage || loginTradeMessage || $store.state.device.version.v}}</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			loadingMessage: "",
        }
	},
	beforeMount() {},
	mounted() {
		// 支持揭示 loading-message
		window.showLoadingMessage = (msg)=>{this.loadingMessage = msg;};
    },
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {},
	computed: {
		messageMap() {
			return this.$store.state.loginTradeMessageMap;
		},
		wsConn() {
			return this.$store.state.selectedWSConn;
		},
		/** 交易連線 - 連線訊息 */
		loginTradeMessage() {
			if (this.wsConn.connecting)
				return this.$ln(`登入中`);
			let cd = this.wsConn.$CD;
			if (cd || this.message) {
				let code = cd ? `(${cd}) ` : '';
				let message = cd === 0 ? '登入成功' : this.message;
				return `${code} ${this.$ln(message)}`;
			}
		},
		/** 錯誤訊息 (對應參考 LoginTradeMessage.vue 的 message() )*/
		message() {
			// 1. 錯誤代碼直接可對應語系設定
			let cd = this.wsConn.$CD;
			if (cd) {
				let str = this.$ln(cd);
				if (str !== cd) return str;
			}
			// 2. 登入命令有回覆的內容 (含語系轉換)
			let wrd = this.wsConn.responseData;
			if (wrd && wrd.$MSG)
				return wrd.$MSG;
			// 3. Client 端的 [狀態代號] 對應訊息表
			if (this.messageMap[this.wsConn.$STATUS])
				return this.$ln(this.messageMap[this.wsConn.$STATUS]);
			// 4. 狀態代號
			if (this.wsConn.$STATUS)
				return this.wsConn.$STATUS;
		},        
    },
}
</script>

<style scoped>
.login-message-ctn {
	/* 避免純數字變文字時高度變化產生的跳動感 */
	min-height: 20px;
}
</style>