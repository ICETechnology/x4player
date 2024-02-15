<template>
	<div class="withdrawal-ctn flex-col pdtb5 font-size-small">
		<div class="withdrawal-setting-ctn posr flex-1">
			<div class="FULL flex-col">
				<div class="flex-row setting-line flex-start">
					<div class="title clr-gray2 w30vw">{{$ln('申请日期')}}</div>
					<div class="content flex-1 flex-start">
						<i class="material-icons icon-right mgr2">date_range</i>
						<span>{{date}}</span>
					</div>
				</div>
				<div class="flex-row setting-line flex-start">
					<div class="title clr-gray2 w30vw">{{$ln('帐号')}}</div>
					<div class="content flex-1 flex-start">
						<!-- 交易帳號選擇器 -->
						<LoginedBTOSelector class="logined-bto-selector flex-1 btn-default-ht-rd" :orderMode="true" />
					</div>
				</div>
				<div class="flex-row setting-line flex-start">
					<div class="title clr-gray2 w30vw">{{$ln('转入银行')}}</div>
					<div class="content flex-1 flex-start posr">
						<SingleSelect :options="bankListOptions" v-model="selectedBank" :isFit="true" class="btn-default-ht-rd" v-if="bankListResult.$STATUS !='QUERY'" />
						<LoadingIcon v-if="bankListResult.$STATUS =='QUERY'" />
					</div>
				</div>
				<div class="flex-row setting-line flex-start">
					<div class="title clr-gray2 w30vw">{{$ln('可出保证金')}}</div>
					<div class="content flex-1 flex-start available font-size-big posr pdl2" :class="{'clr-orange2 underline': available}">
						<span v-if="withdrawQueryResult.$STATUS !=='QUERY'" >{{available || '--'}}</span>
						<LoadingIcon v-if="withdrawQueryResult.$STATUS =='QUERY'" class="font-size-small" />
					</div>
				</div>
				<div class="flex-row setting-line flex-start">
					<div class="title clr-gray2 w30vw">{{$ln('提领金额')}}</div>
					<div class="content flex-1 flex-start">
						<input type="number" class="w100p mgr2 btn-default-ht-rd" :class="{'disabled': isNaN(available) || isBlockWithdrawal}" v-model.Number="amount" :placeholder="$ln(`请输入金额`)" /> {{$ln('元')}}
					</div>
				</div>
				<div class="flex-row setting-line flex-start" v-if="isOB && !disableEnglishName">
					<div class="title clr-gray2 w30vw">{{$ln('英文户名')}}</div>
					<div class="content flex-1 flex-start flex-col posr">
						<input type="text" class="w100p btn-default-ht-rd"  v-model="BK_AC_Name" :placeholder="$ln(`请输入英文名`)" />
						<span v-if='!isVerify' class="clr-up check-warring">{{$ln('必需输入英、數字(含空白字元)')}}</span>
					</div>
				</div>				
			</div>
		</div>
		<!-- 一般出金警語 -->
		<div v-if="displayWithdrawalWarring" class="withdrawal-warring-ctn flex-col flex-1 word-break-all overflow-y-auto pdlr5" v-stop-propagation-y>
			<div v-html="withdrawalWarring"/>
		</div>
		<div class="withdrawal-foot flex-center mgb5 posr">
			<Button class="pdlr3 bgc-0065A4 clr-white flex-1 mglr5" :class="{'disabled': !isEnableSubmit || isOnSubmit}" @click="onSubmit()">{{$ln(`送出申请`)}}</Button>
		</div>
		<!-- 提示訊息 -->
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
	</div>
</template>
<script>
import BlockMessage from "@/components/Framework/BlockMessage.vue";
export default {
	data() {
		return {
			// 申請日期
			date: "",
			// 轉入銀行
			selectedBank: "",
			// 提領金額
			amount: "",
			// 銀行列表查詢結果
			bankListResult: null,
			// 出金申请结果
			fundTransferResult: {},
			// 查詢可出保證金資料結果
			withdrawQueryResult: {},
			// BlockMessage參數
			bmParam: {
				display: false,
				head: '',
				body: '',
				showConfirmBtn: false,
				showCancelBtn: false,
				showLoadingIcon: true,
			},
			// 銀行帳號英文名
			BK_AC_Name: "",
		}
	},
  	components: { BlockMessage },
	beforeMount() {
		this.date = new Date().day10();
		// 查詢銀行列表
		this.bankListResult = M4C.BankTransfer.queryBankList();
		// 查詢可出保證金資料結果
		this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();
	},
	mounted() {},
	methods: {
		// 初始化設定
		initSetting() {
			this.amount = "";
			this.$store.state.status.selectedCurrency = this.currencyOptionList[0]? this.currencyOptionList[0].value: "";
			// 出金完成自動重查後，不再切回第一組銀行幣別了 https://trello.com/c/mUT2vc0T
			// this.selectedBank = this.bankListOptions[0]? this.bankListOptions[0].value: "";
		},
		// 送出申請
		onSubmit() {
			// 設定BlockMessage
			this.bmParam.display = true;
			this.bmParam.showLoadingIcon = true;
			this.bmParam.showConfirmBtn = false,
			this.bmParam.showCancelBtn = false,
			this.bmParam.body = this.$ln('送出申请中');
			// 國外銀行送出申請時才帶入BANK_ACCOUNT_NAME
			if(this.isOB) {
				// 更新銀行帳號英文名(送出時去掉前後空白，並將英文名轉大寫)
				this.selectedBank.BANK_ACCOUNT_NAME = this.BK_AC_Name.trim().toUpperCase();
			}
            // 申請出金
			this.fundTransferResult = M4C.BankTransfer.fundTransfer({
				type: 'withdraw',
				amount: this.amount,
				bankObj: this.selectedBank,
				// 以加密後登入密碼帶入(不用user再key密碼) + 支持未記憶密碼情境 (編碼後密碼會暫存在 wsConn)
				encryptPwd: this.selectedBTO.encryptPwd || this.$store.state.selectedWSConn.$encryptPwd,

				currency: this.selectedCurrency,
			});
		},
		// 解析銀行是國內、外型態
		parseTarget(target) {
			if(target== "OB") return this.$ln('国外');
			if(target== "IB") return this.$ln('国内');
			return '';
		},
		// 支持公開設定 CONFIG.Widhdrawal.availableCurrency 設定可顯示出來的幣別
		getAvailableBankList(bankList) {
			if (!this.availableCurrency)
				return bankList;
			let list = [];
			bankList.forEach((obj)=>{
				let settingString = this.availableCurrency[obj.TARGET];
				// 未設定 IB or OB 時，也視為要顯示，向前相容
				if (!settingString)
					list.push(obj);
				// 字串內容包含該幣別或是ALL時，視為要顯示
				else if (settingString === "ALL" || settingString.indexOf(obj.CURRENCY) !== -1)
					list.push(obj);
			});
			return list;
		},
	},
	watch: {
		/** 銀行列表查詢狀態改變 */
		'bankListResult.$STATUS': function(nv) {
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `银行列表查询失败`,
					content: this.$ln(`点击确定以重新查询`),
					confirm: ()=>{
						// 查詢銀行列表
						this.bankListResult = M4C.BankTransfer.queryBankList();
					}
				});
			}
		},
		/** 可出保證金查詢狀態改變 */
		'withdrawQueryResult.$STATUS': function(nv) {
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `可出保證金金額查詢失敗`,
					content: this.$ln(`点击确定以重新查询`),
					confirm: ()=>{
						// 查詢可出保證金資料
						this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();
					}
				});
			}
		},
		/** 選取帳號切換 */
		selectedAccount(nv) {
			this.bankListResult = M4C.BankTransfer.queryBankList();
			this.amount = "";
			this.selectedBank = "";
			// 重查可出保證金資料
			this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();
		},
		selectedBank(nv) {
			// bank account name首次可能沒有設定，所以這個欄位有可能是空字串。
			this.BK_AC_Name = (nv.BANK_ACCOUNT_NAME || "").toUpperCase();
			// 切換銀行時清空提領金額
			this.amount = "";
		},
		/** 出金申請結果 */
		'fundTransferResult.$STATUS'(nv) {
			let result = this.fundTransferResult;
			if (nv === "DONE") {
				// 依設計，申請成功初始化設定
				this.initSetting();
				// 重查可出保證金資料
				this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();
			}
			if (nv === "DONE" || nv === "FAIL") {
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = (result.$CD != 0 ? `(${result.$CD}) ` : '') + result.$MSG;
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
			}
		},
	},
	computed: {
		disableEnglishName(){
			return this.$store.state.config.CONFIG.Widhdrawal.disableEnglishName;
		},
		// 當前選取帳號
		selectedAccount() {
			return this.$store.state.login.accountID;
		},
		// 幣別選單
		currencyOptionList() {
			return this.$store.state.status.currencyOptionList;
		},
		// 本資金元件的幣別
		selectedCurrency() {
			try {
				return this.selectedBank.CURRENCY;
			} catch(e) {}
		},
		// 以幣別及target為 key 過濾出可出保證金資料
		selectedMarginData() {
			let IOB = this.selectedBank.TARGET;
			return this.withdrawData.find(data => {return data.CURRENCY === this.selectedCurrency && data.TARGET === IOB});
		},
		// 可取资金(取小數二位)
		available() {
			if (this.selectedMarginData) {
				let availableMargin = this.selectedMarginData.AMOUNT;
				let amount = parseFloat(availableMargin).toFixed(2);
				return amount;
			}
		},
		/** 銀行列表下拉選單 */
		bankListOptions() {
			let result = [];
			// 支持公開設定 CONFIG.Widhdrawal.availableCurrency 設定可顯示出來的幣別
			let bankList = this.getAvailableBankList(this.bankListResult);
			bankList.forEach((obj)=>{
				let acc = obj.BANK_ACCOUNT;
				// TARGET 無值時預設 IB
				obj.TARGET = obj.TARGET || 'IB';
				// CURRENCY 無值時預設 TWD
				obj.CURRENCY = obj.CURRENCY || 'TWD';
				// 帳號取後五碼(因要組合幣別、銀行代碼、銀行帳號)所以要縮短一點
				if (acc.length > 5) acc = acc.substr(acc.length - 5);
				// 顯示 銀行類型 幣別-銀行代碼-銀行帳號(幣別目前有可能沒有，但server必需提供)
				let label = `${this.parseTarget(obj.TARGET)} ${obj.CURRENCY || ""}`.trim();
				label += label ? ' - ' : '';
				label += obj.BANK_NAME || obj.BANK_ID || '';
				label += label ? ' - ' : '';
				label += acc;
				result.push({label, value: obj});
			});
			return result;
		},
		/** 是否顯示 loading-icon (發出申請)*/
		isOnSubmit() {
			if (this.fundTransferResult.$STATUS === "QUERY")	return true;
			return false;
		},
		// 啟用送出申請
		isEnableSubmit() {
			// 有效金額
			let isAmount = this.amount && !isNaN(this.amount);
			// 足夠可出金金額
			let isEnough = Number(this.amount) <= Number(this.available);
			// 有銀行帳號英文名(通過驗證, 國外才需檢查)
			let isBankAccountName = this.isOB? this.isVerify: true;
			return isAmount && isEnough && isBankAccountName;
		},
		/**檢查英文名是否正確
		 * 20221229 PM說英文可有可無，但要大寫，因此調整判斷)
		 * 20230217 PM需求調整，只能有英數字及空白
		 */ 
		isVerify() {
			let regexp = new RegExp(/[^a-zA-Z0-9\s]/,'g');
			return !regexp.test(this.BK_AC_Name) || this.BK_AC_Name === "";
		},
		// 當前選擇的銀行是否為國外類型
		isOB() {
			return this.selectedBank.TARGET === "OB";
		},
		isIB() {
			return this.selectedBank.TARGET === "IB";
		},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		// 計算匯率
		$exchageTrial() {return this.$store.state.fn.$exchageTrial;},
		_selectedCurrency() {return this.$store.state.status.selectedCurrency;},
		// disable國外出金，當可出金額小於0
		disableForeignWithdrawalWhenAnyForeignCurrencyIsNegative() {
			try {
				return this.$store.state.config.publicPdSetting.function.disableForeignWithdrawalWhenAnyForeignCurrencyIsNegative;} 
			catch(e) {}
		},
		// 是否disable出金輸入
		isBlockWithdrawal() {
			let result = false;
			// 有設定國外可用資金是負值不可出金，且條件成立
			if(this.disableForeignWithdrawalWhenAnyForeignCurrencyIsNegative && this.isOB) {
				// 可出保證金是國外幣別且金額是負值。
				result = !!this.withdrawData.find(data=>{return data.TARGET === "OB" && data.AMOUNT < 0;});
			}
			return result;
		},
		// 出金警示訊息
		withdrawalWarring() {		
			if(this.isOB && this.withdrawalWarringOB){				
				return this.withdrawalWarringOB;	
			}else if(this.isOB && !this.withdrawalWarringOB){
				// 沒有設定國外時向前相容(由pdsetting提供)
				try {return this.$store.state.config.publicPdSetting.withdrawalWarring;} catch(e) {}
			}else if (this.isIB && this.withdrawalWarringIB){
				return this.withdrawalWarringIB;
			}
		},
		// 出金警示訊息 (國內)
		withdrawalWarringIB(){
			try { return this.$store.state.config.CONFIG.Widhdrawal.warring.IB;} catch(e) {}
		},
		// 出金警示訊息 (國外)
		withdrawalWarringOB(){
			try { return this.$store.state.config.CONFIG.Widhdrawal.warring.OB;} catch(e) {}
		},
		// 是否顯示出金警示訊息(有設定訊息及選擇的銀行幣別是國外幣別)
		displayWithdrawalWarring() {
			return this.withdrawalWarring;},
		// 一般出金的可出保證金資料
		withdrawData() {
			return M4C.BankTransfer.withdrawData;
		},
		// 支持公開設定 CONFIG.Widhdrawal.availableCurrency 設定可顯示出來的幣別
		availableCurrency() {
			try{return vuex.config.publicPdSetting.CONFIG.Widhdrawal.availableCurrency;}catch(e){}
		},
	},
}
</script>
<style scoped>
.content .bd0 {border: 0;}
.content>input {
	box-sizing: border-box;
	border-width: 1px;
	padding-left: 3vw;
}
.check-warring {
	position: absolute;
	bottom: -1.5em;
	left: 1em;
}
</style>