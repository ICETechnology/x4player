<template>
	<div class="password-ctn flex-col">
		<div class="flex-top">
			<div class="flex-col flex-center">
				<div class="broker-name-ctn clr-orange rd2 mgt5 pdlr1 w100p flex-center">{{displayBrokerName}}</div>
				<div class="mgt5">{{traderID}}</div>
				<input class="iceben mgt5" type="password" v-model="oldPass" :placeholder="$ln('旧密码')" @input="oldPswdLimit" />
				<input class="iceben mgt5" type="password" v-model="newPass" :placeholder="$ln('新密码')" @input="newPswdLimit" />
				<input class="iceben mgtb5" type="password" v-model="confirmPass" :placeholder="$ln('确认新密码')" @input="confirmPswdLimit"/>
				<div class="flex-row btn-block text-align-center mgt5">
					<Button class="btn-cancel" @click="onBtnClose">{{$ln('取消')}}</Button>
					<div class="flex-1 flex-center" />
					<Button class="btn-confirm" @click="checkPassword()">{{$ln('变更交易密码')}}</Button>
				</div>
			</div>
		</div>
		<div class="warning-ctn flex-col flex-1 posr mg5" >
			<scroll-bounce v-stop-propagation-y>
				<div v-html="warningRule" />
			</scroll-bounce>
		</div>
		<LoadingIcon v-if="isLoading"/>
	</div>
</template>
<script>
import Button from "@/components/Framework/Button.vue"
export default {
	data(){
		return{
			oldPass: "",
			newPass: "",
			confirmPass: "",
			msg:{
				NullOld: "请输入旧密码",
				NullNew: "请输入新密码",
				NullConfirm: "请输入确认新密码",
				Conflict: "新密码和确认新密码不同",
				NoStrong: "密码最少6个字元，数字和字母都至少要各一个，不能有空白",
				Success: "重设密码成功",
				Failed: "重设密码失败",
			},
			/** 變更密碼結果 */
			chgPwdResult: {},
		}
	},
	props:['param'],
	beforeMount() {
		this.$emit('title', this.$ln(`变更交易密码`));
	},
	mounted() {},
	components:{Button},
	methods: {
		/** 檢查密碼是否可用 */
		checkPassword(){
			let msgCode = this.validate();	//預計回傳array(第一個是boolean, 第二個是code);
			if(!msgCode[0])
				this.alertMsg(msgCode[1]);
			else{
				this.chgPwdResult = M4C.Trader.changePassword(this.brokerID, this.traderID, this.newPass, this.oldPass);
			}
		},
		/** 檢查密碼強度 */
		checkStrong(pwd){
			let regexp = new RegExp(/^(?=.*[A-Za-z])^(?=.*\d)^(?=.{6,})(^[A-Za-z0-9]*$)/);
			return !regexp.test(pwd);
		},
		/** 檢查密碼 */
		validate(){
			if(!this.oldPass)
				return [false, "NullOld"];
			else if(!this.newPass)
				return [false, "NullNew"];
			else if(!this.confirmPass)
				return [false, "NullConfirm"];
			else if(this.newPass != this.confirmPass)
				return [false, "Conflict"];
			// 僅 MO 要檢查密碼強度
			else if(!this.$store.state.login.brokerID && this.checkStrong(this.newPass))
				return [false, "NoStrong"];
			else return [true, ""];
		},
		/** 提示訊息 */
		alertMsg(msgCode){
			this.$store.state.notify(this.msg[msgCode]);
		},
		/** 取消按鈕 */
		onBtnClose() {
			//執行取消時額外執行的程式
			if(this.param && typeof this.param.onCancel == 'function'){
				this.param.onCancel();
			}
			eventBus.$emit("CLOSE-DIALOG");
		},
		// 舊密碼輸入限制
		oldPswdLimit() {
			this.oldPass = this.passwordLimit(this.oldPass);
		},
		// 新密碼輸入限制
		newPswdLimit() {
			this.newPass = this.passwordLimit(this.newPass);
		},
		// 確認密碼輸入限制
		confirmPswdLimit() {
			this.confirmPass = this.passwordLimit(this.confirmPass);
		},
		// 密碼輸入限制
		passwordLimit(pswd) {
			// 限制長度 20 碼
			pswd = pswd.length > 20 ? pswd.substr(0,20) : pswd;
			// 限制英數字
			pswd = pswd.replace(/[^\a-\z\A-\Z0-9]/g, '');
			return pswd;
		}
	},
	watch: {
		/** 密碼修改命令狀態改變 */
		'chgPwdResult.$STATUS': function(nv) {
			let result = this.chgPwdResult;
			let memo = '';
			try{memo = result.data.d.memo;}catch(e){}
			// 命令完成
			if (nv === "DONE") {
				// 密碼更新成功
				if (result.$CD >= 0) {
					// 清空input
					this.oldPass = "";
					this.newPass = "";
					this.confirmPass = "";
					// 未登入情境 -> 回呼並且關閉
					if (this.param && typeof this.param.onSuccessCB == 'function'){
						eventBus.$emit("CLOSE-DIALOG");
						// 延遲0.5秒等視窗關閉才執行callBack
						let self = this;
						setTimeout(() => {
							self.param.onSuccessCB();
						}, 500);
					}
					// 已登入情境 -> 提示完成
					else {
						eventBus.$emit("CONFIRM-DIALOG", {
							title: `密碼修改完成`,
							content: `${result.$MSG}`,
							confirmOnly: true,
						});
					}
				}
				// 密碼更新失敗
				else {
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `密碼修改失败`,
						htmlContent: `(${result.$CD}) ${result.$MSG}<br>${memo || ''}`,
						confirmOnly: true,
					});
				}
			}
			// 命令失敗 (ex. 逾時, 無權限, etc...)
			else if (nv === "FAIL") {
				// 延遲0.5秒等視窗關閉, 才顯示失敗訊息。
				setTimeout(() => {
					eventBus.$emit("CONFIRM-DIALOG", {
						title: `密碼修改失败`,
						htmlContent: `(${result.$CD}) ${result.$MSG}<br>${memo || ''}`,
						confirmOnly: true,
					});
				}, 500);
				// [未登入情境] 密碼修改失敗 -> server 會主動踢斷 -> 關閉視窗重來
				if (this.param)
					eventBus.$emit("CLOSE-DIALOG");
			}
		},
	},
	computed: {
		brokerID() {
			return this.param && this.param.brokerID ? this.param.brokerID : this.$store.state.login.brokerID;
		},
		brokerKey() {
			return this.param && this.param.brokerKey ? this.param.brokerKey : this.$store.state.login.brokerKey || this.brokerID;
		},
		displayBrokerName() {
			return this.$store.state.brokerNameMap[this.brokerKey];
		},
		traderID() {
			let traderID = this.param && this.param.traderID ? this.param.traderID : this.$store.state.login.traderID;
			return traderID.substr(0,4) + '***' + traderID.substr(7);
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.chgPwdResult.$STATUS === "QUERY")
				return true;
		},
		// 交易pdsetting設定的警語
		warningRule() {
			try{return this.$store.state.config.publicPdSetting.password.warningRule;}catch(e){return "";}
		}
	}
}
</script>
<style scoped>
input {
	width: 100%;
    -webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
    -moz-box-sizing: border-box;    /* Firefox, other Gecko */
    box-sizing: border-box;
}
.btn {
	width: 6em;
	padding: 10px
	/* background-color: #EA8223; */
}
.btn-block {
	flex-flow: row;
	justify-content: space-between;
	width: 100%;
}
.reset {
	background-color: #E51C23;
}
</style>