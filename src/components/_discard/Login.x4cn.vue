<template>
	<div class="FULL login-ctn font-size-normal">
		<!-- 背景圖片 -->
		<div class="FULL bg-ctn"/>
		<!-- 將登入容器置中的容器 -->
		<div class="FULL flex-center">
			<!-- 登入容器 -->
			<div class="input-ctn flex-col bgc-head rd3">
				<div class="posr"><div class="img1-ctn"/></div>
				<!-- 連線主機選單 -->
				<SingleSelect v-if="displayHost" class="w100p mgtb2" :options="hostList" v-model="selectedHost" />
				<!-- Broker選單 -->
				<SingleSelect class="w100p mgtb2" :options="brokerList" v-model="brokerID" />
				<div class="flex-col" v-show="!showPattern">
					<input class="standard mgtb2" type="text" :placeholder="$ln('登入帐号')" v-model="inputUser"/>
					<input class="standard mgtb2" type="password" :placeholder="$ln('登入密码')" v-model="inputPswd"/>
					<Button class="mgtb2 clr-white bgc-orange" @click="onBtnLogin">{{$ln('登录')}}</Button>
					<!-- 當前 Toggle 會佔滿 parent 寬度造成異常，先用這個寫法包掉，之後 Toggle 修正後可移除 -->
					<div class="flex-row flex-start mgtb2">
						<Toggle v-model="autoLogin" />
						<div class="flex-1 mgl1">{{$ln('自动登入')}}</div>
					</div>
					<div class="clr-gray font-size-small" @click="onClickMsg">{{message}}</div>
				</div>
				<div class="pattern-login-ctn flex-col flex-center" v-if="showPattern">
					<div class="font-size-big clr-orange mb5">{{$ln('手势登入')}}</div>
					<div>{{$ln('请画出图形密码，6-14點可重複連線圖形')}}</div>
					<div id="pattern-lock-ctn" v-if="showPattern"></div>
					<div class="line">{{$ln('您也可以')}}
						<span class="clr-aqua underline" @click="showPattern=false">{{$ln('改以帳號密碼登入')}}</span>
					</div>
					<div class="line" @click="onClickMsg">{{message}}</div>
				</div>
			</div>
		</div>

		<LoadingIcon v-if="isLoading"></LoadingIcon>
		<Dialog class="FULL" v-for="(obj, i) in dialogList" :key="'D'+i" :comClass="obj.cls" 
			:param="obj.param" :suspend="i != dialogList.length - 1"></Dialog>
		<!-- 確認視窗 -->
		<ConfirmDialog class="FULL" :confirm-data="comfirmData"></ConfirmDialog>
	</div>
</template>

<script>
import Login from '@/components/Login';
export default {
	mixins: [Login],
	data() {
		let pid = this.$store.state.config.projectID;
		return {
			/** 使用二階段登入方式 */
			login3rd: true,
			/** 使用的 BROKER_ID */
			brokerID: urlParam.broker || localStorage.getItem(pid + '_BROKER_ID') || "NANHUA",
			/** 連線環境選單 */
			hostList: [
				{label: "TEST", value: "TEST"},
				{label: "DEV", value: "DEV"},
				{label: "UAT", value: "UAT"},
			],
		}
	},
	beforeMount() {
		let opt = this.brokerList.find((obj)=>{return obj.value === this.brokerID;});
		if (opt) opt.selected = true;
	},
	methods: {
		/** 連線登入 AC 成功 */
		onConnectLoginReady() {
			let self = this;
			// 此 broker 對應的 optCloud 設定
			this.$store.state.optCloud = this.$store.state.config.CONFIG.BROKER[this.brokerID].optCloud;

			// 當前登入會員帳號
			this.$store.state.login.loginUser = self.inputUser;
			// 記憶帳密
			localStorage.setItem(this.pid + '_LOGIN_USER', this.inputUser);
			localStorage.setItem(this.pid + '_LOGIN_PSWD', "************");
			localStorage.setItem(this.pid + '_AUTO_LOGIN', this.autoLogin);

			// 取得交易/資金帳號
			self.message = `${this.$ln('正在登入交易帳號')}...`;
			window.BROKER_ID = this.$store.state.login.brokerID = self.brokerID;
			// 模擬帳號時帶 null
			let pswd = self.brokerID==="IceTech" ? M4C.AC.sim3rdPswd : self.inputPswd;
			M4C.Trader.traderLogin(self.brokerID, self.inputUser, pswd).then((data)=>{
				setTimeout(()=>{
					// 優先 SYMBOL_CATEGORY > brokerDefaultClassification > vuex default classification
					let strCategory = data.d.SYMBOL_CATEGORY || self.brokerDefaultClassification || self.$store.state.config.classification;
					// 支持網址參數 opt=1 強制加入選擇權分類表
					if (location.search.indexOf("opt=1")!=-1) strCategory += ",X4_OPT";
					// 使用第一組設定作為預設的期貨分類表
					self.$store.state.config.classification = strCategory.split(',')[0];
					// 取得總表/分類表
					self.message = `${this.$ln('正在取得总表/分类表')}...`;
					let symbolPromiseList = strCategory.split(',').map(name=>M4C.Symbol.queryMainform(name));

					Promise.all(symbolPromiseList).then(()=>{
						self.message = `${this.$ln('正在进入系统')}...`;
						self.$store.state.login.loginReady = true;
					}).catch(err=>{
						M4C.disconnect(true);
						self.isLoading = false;
						self.message = this.$ln(`取得總表/分類表失敗`);
						console.log(self.message);
					});
				}, 200);
			}).catch(err=>{
				M4C.disconnect(true);
				self.isLoading = false;
				console.log(`取得交易/資金帳號失敗`, err);
				self.message = `(${err.cd}) ${err.msg}`;
			});
		},
	},
	watch: {
		/** 切換 BrokerID */
		brokerID(nv) {
			this.inputPswd = '';
			localStorage.setItem(this.pid + '_BROKER_ID', nv);
			// 登入後帳號管理畫面顯示的名稱
			this.$store.state.config.CONFIG.PROJECT_NAME = this.brokerList.find(obj=>obj.value === this.brokerID).label;
		},
	},
	computed: {
		brokerList() {
			let brokerMap = this.$store.state.config.CONFIG.BROKER;
			return Object.keys(brokerMap).map((key)=>{
				return {value: key, label: brokerMap[key].label};
			});
		},
		/** broker 指定的預設分類表 */
		brokerDefaultClassification() {
			return this.$store.state.config.CONFIG.BROKER[this.brokerID].classification;
		},
	}
}
</script>

<style scoped>
.bg-ctn {
	background-color: #111820;
}
.input-ctn {
	padding: 5vw 7vw;
}
.img1-ctn {
	position: absolute;
	width: 125px;
	height: 112px;
	top: -108px;
	left: calc(50% - 62px);
	background-size: cover;
	background-image: url('data:image/png;base64,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');
}
</style>