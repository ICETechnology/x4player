<template>
	<div v-if="display" class="login-quote-message-ctn FULL">
		<div class="FULL loading-mask"/>
		<div class="loading-ctn flex-col">
			<div class="flex-1 head flex-center pdt2 clr-gray">{{$ln('行情連線')}}</div>
			<div class="flex-1 body flex-center flex-col pdtb5 pdlr2">
				<div class="loading-icon-ctn posr mgb2" v-if="showLoading"><LoadingIcon/></div>
				<div class="flex-center break-all">{{bodyText}}</div>
			</div>
			<div class="flex-1 foot flex-col">
				<!-- <div v-if="!connecting" class="flex-1 flex-center pdtb2" @click="onConfirm">{{$ln('确认')}}</div> -->
				<div v-if="connecting" class="flex-1 flex-center pdtb2" @click="onCancel">{{$ln('取消')}}</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['killMe'],
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
		},
		onCancel() {
			this.display = false;
			M4C.disconnectWsConn(this.wsConn);
			// 報價連線取消時要同時關閉的連線 ex. 台灣交易登入完成才開始報價連線，此時若取消報價連線，需要一併關閉交易連線，重新登入
			if (this.killMe)
				M4C.disconnectWsConn(this.killMe);
			// 關閉變數
			this.$set(this.$store.state.config.CONFIG, 'LOGIN_QUOTE', false);
		},
	},
	watch: {
		connecting(nv) {
			if (nv) {
				this.display = true;
			}
		},
		// message(nv) {
		// 	console.log('LoginTradeMessage.message : ', nv);
		// }
	},
	computed: {
		wsConn() {
			return this.$store.state.wsConnMap.quote || {};
		},
		connecting() {
			return this.wsConn.connecting;
		},
		loginReady() {
			return this.wsConn.loginReady;
		},
		bodyText() {
			if (this.loginReady) {
				if (this.$store.state.status.mainformArrive)
					return this.$ln('正在進入系統');
				else
					return this.$ln('正在取得商品表');
			}
			else {
				if (this.connecting)
					return this.$ln('正在建立報價連線');
				else
					return this.$ln('報價連線異常');
			}
		},
		// 顯示 loadingIcon
		showLoading() {
			return !this.loginReady && !this.connecting ? false : true;
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