<template>
	<div class="login-ctn flex-center font-size-normal">
		<div class="input-ctn flex-col flex-center">
			<div class="mo-icon"></div>
			<div class="flex-row flex-start v-show" v-if="displayHost">
				<Radio class="host-radios flex-1" v-model="selectedHost">
					<span value="DEV">{{$ln('DEV开发机')}}</span>
					<span value="HK">{{$ln('HK正式机')}}</span>
				</Radio>
			</div>
			<div class="flex-col" v-show="!showPattern">
				<div class="line flex-row">
					<input class="flex-1 standard font-size-normal" type="text" :placeholder="$ln('登入帐号')" v-model="inputUser"/>
				</div>
				<div class="line flex-row">
					<input class="flex-1 standard font-size-normal" type="password" :placeholder="$ln('登入密码')" v-model="inputPswd"/>
				</div>
				<div class="line">
					<Button class="clr-white bgc-orange" @click="onBtnLogin">{{$ln('登录')}}</Button>
				</div>
				<div class="line">
					<CheckBox v-model="autoLogin">{{$ln('自动登入')}}</CheckBox>
				</div>
				<div class="line" @click="onClickMsg">{{message}}</div>
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
		return {
		}
	},
	methods: {
		/** 連線登入成功 */
		onConnectLoginReady() {
			let self = this;
			// 當前登入會員帳號
			this.$store.state.login.loginUser = window.loginUser = self.inputUser;
			// 記憶帳密
			localStorage.setItem(this.$store.state.config.projectID + '_LOGIN_USER', this.inputUser);
			localStorage.setItem(this.$store.state.config.projectID + '_LOGIN_PSWD', "************");
			localStorage.setItem(this.$store.state.config.projectID + '_AUTO_LOGIN', this.autoLogin);

			// 取得交易/資金帳號
			self.message = `${this.$ln('正在取得交易/資金帳號')}...`;
			M4C.Trader.traderInfo().then((data)=>{
				// 優先使用 trader.info 回覆的分類表，若沒有回覆時才使用預設
				let strCategory = data.d.SYMBOL_CATEGORY || self.$store.state.config.classification;
				// 支持網址參數 opt=1 強制加入選擇權分類表
				if (strCategory.indexOf("X4_OPT")===-1 && location.search.indexOf("opt=1")!=-1) strCategory += ",X4_OPT";
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
			}).catch(err=>{
				M4C.disconnect(true);
				self.isLoading = false;
				console.log(`取得交易/資金帳號失敗`, err);
				self.message = `(${err.cd}) ${err.msg}`;
			});
		},
	},
}
</script>

<style scoped>
.login-ctn {
	padding: 1em;
}
.input-ctn div.line {
	margin: 5px 0;
}
/* 登入畫面主圖示 */
.input-ctn .mo-icon {
	display: block;
	width: 245px;
    height: 140px;
    background: url('data:image/png;base64,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');
    background-position: center center;
    background-repeat: no-repeat;
	margin-top: -30px;
    margin-bottom: 20px;	
}
</style>