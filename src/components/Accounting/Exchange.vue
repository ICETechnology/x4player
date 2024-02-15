<template>
	<div class="currency-exchange-ctn flex-col pdtb5 font-size-small">
		<div class="currency-exchange-setting-ctn posr flex-1">
			<div class="FULL flex-col">
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('帐号')}}</div>
					<div class="content flex-1 flex-start">
						<LoginedBTOSelector class="logined-bto-selector flex-1 btn-default-ht-rd" :orderMode="true" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('换汇方式')}}</div>
					<div class="content flex-1 flex-start">
						<SingleSelect :options="typeOptions" v-model="selectedType" :isFit="true" class="btn-default-ht-rd" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('转出币别')}}</div>
					<div class="content flex-1 flex-start flex-row ">
						<SingleSelect v-if="bankListResult.$STATUS !=='QUERY'" :options="rollOutCurrencyList" v-model="selectedRollOutCurrency" :isFit="true" 
							class="type-selector btn-default-ht-rd mgr1 flex-1" :class="{'font-size-mini':!rollOutCurrencyList.length}" />
							<div v-if="bankListResult.$STATUS =='QUERY'" class="mgr1 flex-1 posr">
							<LoadingIcon/>
						</div>
						<div class="flex-start mgr2 flex-1">
							<input type="tel" class="input-amount-ctn btn-default-ht-rd w100p" :class="{'disabled': isNaN(available)||selectedType==='exchange'}" 
								v-model="rollOutAmount" @input="onlyNumber()" :placeholder="$ln(`请输入金额`)" />
						</div> {{$ln('元')}}
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('可出保证金')}}</div>
					<div class="content flex-1 flex-start available font-size-big posr pdl2" :class="{'clr-orange2 underline': available}" >
						<span v-if="withdrawQueryResult.$STATUS !=='QUERY'" >{{available || '--'}}</span>
						<LoadingIcon v-if="withdrawQueryResult.$STATUS =='QUERY'" class="font-size-small" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('可用基金')}}</div>
					<div class="content flex-1 flex-start flex-row">
						<div class="flex-col flex-1 posr">
							<div v-if="queryBaseResult.$STATUS !== 'QUERY'"> NTD : {{format(availableMargin)}}</div>
							<loadingIcon class="flex-start clr-white" v-else-if="queryBaseResult.$STATUS === 'QUERY'" />
						</div>
						<Button class="pdlr5 clr-white btn-default-ht-rd query-btn" @click="onRefresh()">{{$ln(`查询`)}}</Button>
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w20vw">{{$ln('转入币别')}}</div>
					<div class="content flex-1 flex-start flex-row">
						<SingleSelect v-if="bankListResult.$STATUS !=='QUERY'" :options="rollInCurrencyList" v-model="selectedRollInCurrency" :isFit="true" 
							class="type-selector btn-default-ht-rd mgr1 flex-start flex-1" :class="{'font-size-mini':!rollInCurrencyList.length}" />
						<div v-if="bankListResult.$STATUS =='QUERY'" class="mgr1 flex-1 posr">
							<LoadingIcon/>
						</div>
						<div class="flex-start mgr2 flex-1">
							<input type="tel" class="input-amount-ctn btn-default-ht-rd w100p" :class="{'disabled': isNaN(available)||selectedType==='currency'}" 
								v-model="rollInAmount" @input="onlyNumber()" :placeholder="$ln(`请输入金额`)" />
						</div>	{{$ln('元')}}
					</div>
				</div>
			</div>
		</div>
		<div class="currency-exchange-foot flex-center mgb5 posr">
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
			selectedType: "",
			selectedRollOutCurrency: "",
			rollOutAmount: "",
			selectedRollInCurrency: "",
			rollInAmount:"",
			// 查詢可用基金結果
			queryBaseResult: {},
			// 换汇申请结果
			exchangeResult: {},
			// 銀行列表查詢結果
			bankListResult: null,
			// 可出保證金結果
			withdrawQueryResult:{},
			// BlockMessage參數
			bmParam: {
				display: false,
				head: '',
				body: '',
				showConfirmBtn: false,
				showCancelBtn: false,
				showLoadingIcon: true,
			},
		}
	},
	beforeMount() {
		// 查詢銀行列表
		this.bankListResult = M4C.BankTransfer.queryBankList({TYPE:'exchange'});
		// 查詢可出保證金資料結果
		this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();
	},
	components: { BlockMessage },
	mounted() {},
	methods: {
		initSetting() {
			this.rollOutAmount = "";
			this.rollInAmount = "";
			this.selectedRollOutCurrency = this.rollOutCurrencyList[0]? this.rollOutCurrencyList[0].value: "";
			this.selectedRollInCurrency = this.rollInCurrencyList[0]? this.rollInCurrencyList[0].value: "";
			this.selectedType = this.typeOptions[0]? this.typeOptions[0].value: "";
		},
		onSubmit() {
			// 設定BlockMessage
			this.bmParam.display = true;
			this.bmParam.showLoadingIcon = true;
			this.bmParam.showConfirmBtn = false,
			this.bmParam.showCancelBtn = false,
			this.bmParam.body = this.$ln('送出申请中');

			let exchangeObj = {
				EXCHANGE_TYPE: this.exchangeType,
				EXCHANGE_CURRENCY: this.selectedRollInCurrency,
				TARGET: "OB",
			};
			this.exchangeResult = M4C.BankTransfer.fundTransfer({
				type: "exchange",
				amount: this.amount,
				exchangeObj: exchangeObj,
				// 以加密後登入密碼帶入(不用user再key密碼) + 支持未記憶密碼情境 (編碼後密碼會暫存在 wsConn)
				encryptPwd: this.selectedBTO.encryptPwd || this.$store.state.selectedWSConn.$encryptPwd,
				currency: this.selectedRollOutCurrency.CURRENCY,
			});
		},
		onlyNumber(){
			// TWD/JPY 限制不能輸入小數
			if(this.selectedCurrency !="TWD"&&this.selectedCurrency !="JPY") return;
			if(this.selectedType==='currency'){
				this.rollOutAmount = this.rollOutAmount.replace(/\D/g,'');
			}else{
				this.rollInAmount = this.rollInAmount.replace(/\D/g,'');
			}	
		},
		// 解析銀行是國內、外型態
		parseTarget(target) {
			if(target== "OB") return this.$ln('国外');
			if(target== "IB") return this.$ln('国内');
		},
		format(str) {
			let val;			
			val = parseFloat(str).toFixed(2);
			return isNaN(val) ? '--' : this.$commas(val);
		},
		onRefresh() {
			this.queryBaseResult = M4C.Margin.queryMargin();
		},
	},
	watch: {
		/** 選取帳號切換 */
		selectedAccount(nv) {
			// 重查資金
			M4C.Margin.queryMargin();
			// 查詢銀行列表
			this.bankListResult = M4C.BankTransfer.queryBankList({TYPE:'exchange'});
			// 查詢可出保證金資料結果
			this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();

			this.initSetting()
		},
		/** 銀行列表查詢狀態改變 */
		'bankListResult.$STATUS': function(nv) {
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `银行列表查询失败`,
					content: this.$ln(`点击确定以重新查询`),
					confirm: ()=>{
						// 查詢銀行列表
						this.bankListResult = M4C.BankTransfer.queryBankList({TYPE:'exchange'});
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
		/** 换汇申請結果 */
		'exchangeResult.$STATUS': function(nv) {
			let result = this.exchangeResult;
			if (nv === "DONE") {
				// 依設計，申請成功初始化設定
				this.rollOutAmount = "";
				this.rollInAmount = "";
				// 重新查詢可出保證金
				this.withdrawQueryResult = M4C.BankTransfer.queryWithdraw();

				// 設定BlockMessage
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = this.$ln('申请已送出');
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
			}
			if (nv === "FAIL") {
				// 設定BlockMessage
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = `(${result.$CD}) ${result.$MSG}`;
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
			}
		},
		selectedType(nv){
			if(nv==='currency'){
				this.rollInAmount = '';
			}else{
				this.rollOutAmount = '';
			}		
		}
	},
	computed: {
		// 當前選取帳號
		selectedAccount() {
			return this.$store.state.login.accountID;
		},
		exchangeCurrencyOptionList(){
			 try {return this.$store.state.config.CONFIG.exchange_CurrencyOptionList;} catch (e) {}
		},
		// 轉出幣別選單
		rollOutCurrencyList(){
			const selectedRollOutCurrency = this.selectedRollOutCurrency ? this.selectedRollOutCurrency.CURRENCY : "";
			let result = [];
			// 過濾掉不是國外幣別的
			const bankListResult = this.bankListResult.filter(data => data.TARGET =="OB");
			if(this.selectedType==='currency'){
				bankListResult.forEach((obj)=>{
					// 可出金金額
					const withdraw = this.withdrawData.find(data => data.CURRENCY === obj.CURRENCY && data.TARGET === obj.TARGET);
					// 顯示幣別
					if(withdraw && withdraw.AMOUNT<=0) return;
					else if(selectedRollOutCurrency===obj.CURRENCY){
						result.push({label: `${this.parseTarget(obj.TARGET)} - ${obj.CURRENCY || ""}`, value: obj , selected :true});
					}
					else
						result.push({label: `${this.parseTarget(obj.TARGET)} - ${obj.CURRENCY || ""}`, value: obj});
				});
				return result;
			}			
			else if(this.selectedType==='exchange')
				bankListResult.forEach((obj)=>{
					// 可出金金額
					const withdraw = this.withdrawData.find(data => data.CURRENCY === obj.CURRENCY && data.TARGET === obj.TARGET);
					// 顯示幣別
					if(withdraw && withdraw.AMOUNT<=0 || obj.CURRENCY == this.selectedRollInCurrency) return;
					else if(selectedRollOutCurrency===obj.CURRENCY){
						result.push({label: `${this.parseTarget(obj.TARGET)} - ${obj.CURRENCY || ""}`, value: obj , selected :true});
					}
					else
						result.push({label: `${this.parseTarget(obj.TARGET)} - ${obj.CURRENCY || ""}`, value: obj});
				});
				return result;
		},
		// 轉入幣別選單
		rollInCurrencyList(){
			if(!this.exchangeCurrencyOptionList) return [];
			let result = [];
			if(this.selectedType==='currency'){
				this.exchangeCurrencyOptionList.forEach((obj)=>{
					// 顯示幣別
					if(obj.value != this.selectedRollOutCurrency.CURRENCY)
						result.push({label: `${this.$ln('国外')} - ${obj.label || ""}`, value: obj.value});
				});
				return result;
			}				
			else if(this.selectedType==='exchange'){
				this.exchangeCurrencyOptionList.forEach((obj)=>{
					// 顯示幣別
					result.push({label: `${this.$ln('国外')} - ${obj.label || ""}`, value: obj.value});
				});
				return result;
			}			
		},		
		exchangeType(){
			if(this.selectedType==='currency') return 'Before';
			else if(this.selectedType==='exchange') return 'After';
		},
		// 轉換金額
		amount(){
			if(this.selectedType==='currency') return this.rollOutAmount;
			else if(this.selectedType==='exchange') return this.rollInAmount;
		},
		// 選擇幣別
		selectedCurrency(){
			if(this.selectedType==='currency') return this.selectedRollOutCurrency.CURRENCY;
			else if(this.selectedType==='exchange') return this.selectedRollInCurrency;
		},
		// 以幣別為 key 的響應式資金資料
		marginData() {
			return this.$store.state.data.marginData;
		},
		// 可用基金
		availableMargin() {
			// 顯示國外基幣可用資金 - OB-***
			if (this.marginData && this.marginData['OB-***'])
				return this.marginData['OB-***'].AVAILABLE_MARGIN;
		},
		// 以幣別及target為 key 過濾出可出保證金資料
		selectedMarginData() {
			if(this.selectedRollOutCurrency){
				let IOB = this.selectedRollOutCurrency.TARGET;	
				return this.withdrawData.find(data => {return data.CURRENCY === this.selectedRollOutCurrency.CURRENCY && data.TARGET === IOB});
			}
		},
		// 可出保證金(取小數二位)
		available() {
			if (this.selectedMarginData) {
				let availableMargin = this.selectedMarginData.AMOUNT;
				let amount = parseFloat(availableMargin).toFixed(2);
				return amount;
			}
		},
		// 一般出金的可出保證金資料
		withdrawData() {
			return M4C.BankTransfer.withdrawData;
		},
		/** 換匯方式選單 */
		typeOptions() {
			return [
				{label:'以原币别', value:'currency'},
				{label:'依据换汇设定', value:'exchange'},
			];
		},
		// 啟用送出申請
		isEnableSubmit() {
			// 有效轉出金額 且 金額必須小於等於可出保證金
			let isAmount = this.amount && Number(this.amount) >0 && !isNaN(this.amount) && Number(this.amount) <= Number(this.available);
			return isAmount;
		},
		/** 是否顯示 loading-icon (發出申請)*/
		isOnSubmit() {
			if (this.exchangeResult.$STATUS === "QUERY")	return true;
			return false;
		},
		$commas() {return this.$store.state.fn.$commas;},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
	},
}
</script>
<style scoped>
.content .bd0 {border: 0;}
.input-amount-ctn{box-sizing: border-box; padding-left: 3vw;}
.content>input {
	box-sizing: border-box;
	border-width: 1px;
	padding-left: 3vw;
}
.query-btn {background-color: #333333;}
</style>