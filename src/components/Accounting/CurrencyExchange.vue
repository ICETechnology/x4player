<template>
	<div class="currency-exchange-ctn flex-col pdtb5 font-size-small">
		<div class="currency-exchange-setting-ctn posr flex-1" :class="{'flex-1d5':supportAtoB}" >
			<div class="FULL flex-col">
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('申请日期')}}</div>
				<div class="content flex-1 flex-start">
						<i class="material-icons icon-right mgr2">date_range</i>
						<span>{{date}}</span>
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('转出帐号')}}</div>
					<div class="content flex-1 flex-start">
						<!-- 交易帳號選擇器 -->
						<LoginedBTOSelector class="logined-bto-selector flex-1 btn-default-ht-rd" :orderMode="true" />
					</div>
				</div>
				<div v-if="supportAtoB" class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('转入帐号')}}</div>
					<div class="content flex-1 flex-start">
						<SingleSelect :options="transinAccountList" v-model="transAccountID" :isFit="true" class="btn-default-ht-rd" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('移转方式')}}</div>
					<div class="content flex-1 flex-start">
						<SingleSelect :options="transWayOptions" v-model="selectedWay" :isFit="true" class="btn-default-ht-rd" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('可互转保证金')}}</div>
					<div class="content flex-1 flex-start available font-size-big posr pdl2" :class="{'clr-orange2 underline': available !== '--'}">
						<span v-if="transQueryResult.$STATUS !=='QUERY'" >{{available}}</span>
						<LoadingIcon v-if="transQueryResult.$STATUS =='QUERY'" class="flex-start clr-white" />
					</div>
				</div>
				<div class="flex-row setting-line">
					<div class="title flex-start clr-gray2 w30vw">{{$ln('金额')}}</div>
					<div class="content flex-1 flex-start">
						<input type="number" class="w100p mgr2 btn-default-ht-rd" :class="{'disabled': isNaN(available)}" v-model.Number="amount" :placeholder="$ln(`请输入金额`)" /> {{$ln('元')}}
					</div>
				</div>
			</div>
		</div>
		<div class="posr flex-1 mgt3">
			<ScrollBounce v-stop-propagation-y>		
				<div class="mglr5 word-break-all " v-html="currencyExchangeWarning"></div>			
			</ScrollBounce>
		</div>
		
		<CheckBox  v-if="currencyExchangeWarning" v-model="allowWarning" class="pdlr5 pdtb4">{{$ln('我已详阅并接受上述注意事项')}}</CheckBox>
		
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
			date: "",
			// 當前選擇的移轉方式(物件)
			selectedWay: {},
			transAccountID:"",
			amount: "",
			// 幣別轉換申请结果
			fundTransferResult: {},
			// 查詢可互轉保證金資料結果
			transQueryResult: {},
			// BlockMessage參數
			bmParam: {
				display: false,
				head: '',
				body: '',
				showConfirmBtn: false,
				showCancelBtn: false,
				showLoadingIcon: true,
			},
			allowWarning: false
		}
	},
  	components: { BlockMessage },
	beforeMount() {
		this.date = new Date().day10();
		// 可互轉保證金
		this.transQueryResult = M4C.BankTransfer.queryTrans();
	},
	mounted() {},
	methods: {
		// 送出申請 如果送出需帶申請日期，注意日期格式。server可能要yyyy-MM-dd是的話取computed 的orderDate
		onSubmit() {
			// 設定BlockMessage
			this.bmParam.display = true;
			this.bmParam.showLoadingIcon = true;
			this.bmParam.body = this.$ln('送出申请中');
            // 申請出金
			this.fundTransferResult = M4C.BankTransfer.fundTransfer({
				type: this.selectedWay.target === 'IB' ? 'transout' : 'transin',
				amount: this.amount,
				currency: this.selectedWay.currency,
				// 以加密後登入密碼帶入(不用user再key密碼) + 支持未記憶密碼情境 (編碼後密碼會暫存在 wsConn)
				encryptPwd: this.selectedBTO.encryptPwd || this.$store.state.selectedWSConn.$encryptPwd,
				transAccountID: this.transAccountID,
			});
		},
	},
	watch: {
		/** 選取帳號切換 */
		selectedAccount(nv) {
			this.amount = "";
			// 重查可互轉保證金資料
			this.transQueryResult = M4C.BankTransfer.queryTrans();
		},
		/** 幣別互轉申請結果 */
		'fundTransferResult.$STATUS'(nv) {
			let result = this.fundTransferResult;
			if (nv === "DONE") {
				// 清空金額
				this.amount = "";
				// 重查可互轉保證金資料
				this.transQueryResult = M4C.BankTransfer.queryTrans();
			}
			if (nv === "DONE" || nv === "FAIL") {
				// 設定BlockMessage
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = (result.$CD != 0 ? `(${result.$CD}) ` : '') + result.$MSG;
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
			}
		},
		/** 可互轉保證金查詢狀態改變 */
		'transQueryResult.$STATUS': function(nv) {
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `可互轉保證金金額查詢失敗`,
					content: this.$ln(`点击确定以重新查询`),
					confirm: ()=>{
						// 重查可互轉保證金資料
						this.transQueryResult = M4C.BankTransfer.queryTrans();
					}
				});
			}
		},
	},
	computed: {
		// 支持A轉B帳號
		supportAtoB(){
			try { return this.$store.state.config.CONFIG.supportAtoB;} catch (e) {}
		},
		// 當前選取帳號
		selectedAccount() {
			return this.$store.state.login.accountID;
		},
		// 幣別選單
		currencyOptionList() {
			if(this.availableCurrencyList && this.availableCurrencyList.length){
				return this.availableCurrencyList.map(cny=> {
					return {label: cny, value: cny};
				});
			}
			else {
				return this.$store.state.status.currencyOptionList;
			}
		},
		// 可互轉保證金
		available() {
			if (this.transQueryData) {
				// 在已查回來的可互轉保證金資料裡，找出當前選擇的幣別/IOB
				let obj = this.transQueryData.find(o=>{return o.CURRENCY === this.selectedWay.currency && o.TARGET === this.selectedWay.target;});
				return obj ? obj.AMOUNT : '--';
			}
			else return "--";
		},
		/** 轉換方式下拉選單 */
		transWayOptions() {
			if (this.transWayList) {
				return this.transWayList.map(o=>({label: o.label, value: o}));
			}
			return [
				{label: this.$ln('国内转国外'), value: {target: 'IB', currency: 'TWD'}},
				{label: this.$ln('国外转国内'), value: {target: 'OB', currency: 'TWD'}},
			];
		},
		// 啟用送出申請(有輸入金額、密碼、勾選同意事項)
		isEnableSubmit() {
			return this.currencyExchangeWarning ? this.amount && !isNaN(this.amount) && this.allowWarning : this.amount && !isNaN(this.amount);
		},
		/** 是否顯示 loading-icon (發出申請)*/
		isOnSubmit() {
			if (this.fundTransferResult.$STATUS === "QUERY")	return true;
			return false;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// pdsetting中設定有效的幣別選單
		availableCurrencyList() {
			try {
				return this.acPdSetting.display.currency_exchange;
			} catch(e) {
				return [];
			}
		},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		// 幣幣互轉的可互轉保證金資料
		transData() {
			return M4C.BankTransfer.transData;
		},
		currencyExchangeWarning(){
			try { return this.$store.state.config.CONFIG.currencyExchangeWarning;} catch(e){}
		},
		accountIdList() {
			return this.$store.state.login.accounts;
		},
		// 轉入帳號列表
		transinAccountList(){
			let result = [];
			this.accountIdList.forEach((obj) => {
				if(obj.ACCOUNT_ID==this.selectedAccount)
					result.push({label: obj.ACCOUNT_ID, value: obj.ACCOUNT_ID, selected: true});
				else
					result.push({label: obj.ACCOUNT_ID, value: obj.ACCOUNT_ID});
			})		
			return result;
		},
		// 公開設定指定移轉方式選單列表
		transWayList() {
			try{return vuex.config.publicPdSetting.CONFIG.CurrencyExchange.transWayList;}catch(e){}
		},
		// 可互轉保證金查詢回來的資料
		transQueryData() {
			try{return this.transQueryResult.data.d.DATA;}catch(e){}
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
</style>