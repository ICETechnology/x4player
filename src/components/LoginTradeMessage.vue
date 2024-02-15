<template>
	<div v-if="display" class="login-trade-message-ctn FULL">
		<!-- 建立中/登入中 -->
		<div class="FULL loading-mask"/>
		<div class="loading-ctn flex-col">
			<div class="flex-1 head flex-center pdt2 clr-gray">{{$ln('交易登入')}}</div>
			<div class="flex-1 body flex-center flex-col pdtb5 pdlr2">
				<div class="loading-icon-ctn posr mgb2" v-if="connecting"><LoadingIcon/></div>
				<div class="flex-center break-all">{{bodyText}}</div>
			</div>
			<div class="flex-1 foot flex-col">
				<div v-if="!connecting" class="flex-1 flex-center pdtb2" @click="onConfirm">{{$ln('确认')}}</div>
				<div v-if="connecting" class="flex-1 flex-center pdtb2" @click="onCancel">{{$ln('取消')}}</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['wsConn'],
	data() {
		return {
			display: false,
		}
	},
	beforeMount() {},
    mounted() {
		this.display = this.connecting;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onConfirm() {
			this.display = false;
			this.$emit('confirm');
		},
		onCancel() {
			this.display = false;
			M4C.disconnectWsConn(this.wsConn);
		},
		// 支持從 ac response 的 pdsetting.broker.timeout 取得 timeout 秒數
		getTraderLoginTimeoutMS(wsConn) {
			let ms = 10000;
			// 設定僅存在交易連線上 (因為還沒登入完成，所以沒有寫進 vuex)
			try {ms = wsConn.acResponse.d['2stepLoginTimeout'];}catch(err){}
			return ms || 10000;
		},
	},
	watch: {
		connecting(nv) {
			if (nv) {
				this.display = true;
			}
		},
		loginReady(nv) {
			if (nv) {
				this.display = false;
			}
		},
		'wsConn.$CD'(nv) {
			// 密碼90天展延
			if (nv === -551) {
				this.display = false;
				this.$emit('onExtendPwd', this.bodyText);
			}
			// 後台強制修改密碼->使用相同於 AC 強制變更密碼的動線，所以這裡不跳出來提示
			else if (nv === -559) {
				this.display = false;
			}
		},
		// message(nv) {
		// 	console.log('LoginTradeMessage.message : ', nv);
		// }
	},
    computed: {
		connecting() {
			return this.wsConn.connecting;
		},
		loginReady() {
			return this.wsConn.loginReady;
		},
		messageMap() {
			return this.$store.state.loginTradeMessageMap;
		},
		/** 錯誤代碼 (無錯誤代碼時，連括號都不顯示) */
		code() {
			let cd = this.wsConn.$CD;
			if (cd) return `(${cd}) `;
		},
		memo() {
			try{return this.wsConn.responseData.d.memo;}catch(err){}
		},
		/** 錯誤訊息 (對應參考 LoginMember.vue 的 loginTradeMessage() )*/
		message() {
			// 1. 錯誤代碼直接可對應語系設定
			let cd = this.wsConn.$CD;
			if (cd) {
				let key = `TRADE_${cd}`;
				let str = this.$ln(key);
				if (str && str !== key) return str;
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
			return '';
		},
		headText() {
			return `交易登入`;
		},
		bodyText() {
			return `${this.code || ''} ${this.message || ''} ${this.memo || ''}`.trim() || this.$ln('建立通信');
		},
		btnText() {
			return `確認`;
		},
	},
}
</script>

<style scoped>
.loading-mask {
	z-index: 999;
	opacity: 0.3;
	background-color: black;
}
.loading-ctn {
	z-index: 999;
	position: absolute;
	top: 30%;
	left: 20vw;
	width: 60vw;
	/* height: 30vw; */
	border-radius: 1vw;
	color: white;
	background-color: #363C42;
}
.loading-icon-ctn {
	height: 30px;
}

.foot {
	border-top: 1px solid #4E6C8D;
}
</style>