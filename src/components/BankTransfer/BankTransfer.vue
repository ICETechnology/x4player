<template>
    <div class="FULL flex-col flex-center font-size-small overflow-y-auto pd10 pdtb5">
		<div class="option-ctn w100p flex-1 flex-col overflow-y-auto">
			<div class="flex-row mgtb2">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`资金帐号`)}} : </div>
				<div class="flex-1 flex-start">{{selectedBTO.selectedAccountID}}</div>
			</div>
			<div class="flex-row mgtb2">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`选择银行`)}} : </div>
				<div class="flex-1">
					<SingleSelect class="iceben" :options="bankListOptions" v-model="selectedBank" />
				</div>
			</div>
			<div class="flex-row mgtb2 flex-center">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`可取资金`)}} : </div>
				<div class="flex-1 flex-row flex-end">
					<Button class="pdlr3 iceben" @click="onBtnRefresh">{{$ln(`刷新`)}}</Button>
					<div class="flex-1 flex-end">{{$store.state.fn.$displayMoney(available)}}</div>
				</div>
			</div>
			<div class="flex-row mgtb2 flex-center">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`银行馀额`)}} : </div>
				<div class="flex-1 flex-row flex-end">
					<Button class="pdlr3 iceben" @click="onBtnBankBalance" :class="{disabled: !buttonEnable}">{{$ln(`查询`)}}</Button>
					<div class="flex-1 flex-end">{{bankBalanceAmount || '--'}}</div>
				</div>
			</div>
			
			<div class="flex-row mgtb2">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`币　　种`)}} : </div>
				<div class="flex-1">
					<SingleSelect class="iceben" :options="currencyOptionList" v-model="$store.state.status.selectedCurrency"/>
				</div>
			</div>
			<div class="flex-row mgtb2">
				<div class="left-part flex-center mgr5 clr-gray">{{$ln(`转帐金额`)}} : </div>
				<div class="flex-1"><input class="iceben" type="text" v-model="transferAmount" :placeholder="$ln(`请填入转帐金额`)" /></div>
			</div>
		</div>
		<div class="flex-row mgb10 w100p">
			<Button class="selected pdlr3 btn iceben bgc-orange" :class="{disabled: !buttonEnable}" @click="onBtnTransfer('deposit')">{{$ln(`资金转入`)}}</Button>
			<div class="flex-1"/>
			<Button class="selected pdlr3 btn iceben bgc-pink2" :class="{disabled: !buttonEnable}" @click="onBtnTransfer('withdraw')">{{$ln(`资金转出`)}}</Button>
		</div>
		<LoadingIcon v-if="isLoading"></LoadingIcon>
    </div>
</template>

<script>
import BankTransferQueryBalance from "@/components/BankTransfer/BankTransferQueryBalance.vue";
import BankTransferFund from "@/components/BankTransfer/BankTransferFund.vue";
export default {
	props: [],
	data() {
		return {
			/** 銀行列表查詢結果 */
			bankListResult: [],
			/** 當前選擇的銀行帳號物件 */
			selectedBank: {},
			/** 轉帳金額 */
			transferAmount: "",
			acctPwd: "",
			bankPwd: "",
		}
	},
	beforeMount() {
		this.$emit('title', '银期转帐');
		// 查詢銀行列表
		this.bankListResult = M4C.BankTransfer.queryBankList();
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 重查資金 */
		onBtnRefresh() {
			M4C.Margin.queryMargin();
		},
		/** 查詢銀行餘額 */
		onBtnBankBalance() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: BankTransferQueryBalance, param: {'selectedBank': this.selectedBank}});
		},
		/** 出入金申請 */
		onBtnTransfer(type) {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			if (!this.transferAmount) {
				this.$store.state.notify(`请填入转入资金金额`);
				return;
			}
			eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: BankTransferFund, 
				param: {type: type, 'selectedBank': this.selectedBank, amount: this.transferAmount}});
		},
	},
	watch: {
		/** 選擇銀行切換 */
		selectedBank(nv) {
			this.transferAmount = "";
			this.acctPwd = "";
			this.bankPwd = "";
		},
		/** 銀行列表查詢狀態改變 */
		'bankListResult.$STATUS': function(nv) {
			if (nv === "FAIL") {
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `银行列表查询失败`,
					content: `点击确定以重新查询`,
					confirm: ()=>{
						// 查詢銀行列表
						this.bankListResult = M4C.BankTransfer.queryBankList();
					}
				});
			}
		},
	},
    computed: {
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		/** 銀行列表下拉選單 */
		bankListOptions() {
			let result = [];
			this.bankListResult.forEach((obj)=>{
				let acc = obj.BANK_ACCOUNT;
				if (acc.length > 12) acc = acc.substr(0,5) + '***' + acc.substr(acc.length - 4);
				result.push({label: `${obj.BANK_NAME} ${acc}`, value:obj});
			});
			return result;
		},
		/** 是否顯示 loading-icon */
		isLoading() {
			if (this.bankListResult.$STATUS === "QUERY")		return true;
			return false;
		},
		currencyOptionList() {
			return this.$store.state.status.currencyOptionList;
		},
		// 本資金元件的幣別
		selectedCurrency() {
			return this.$store.state.status.selectedCurrency;
		},
		// 以幣別為 key 的響應式資金資料
		marginData() {
			return this.$store.state.data.marginData;
		},
		// 可取资金
		available() {
			if (this.marginData && this.marginData[this.selectedCurrency]) {
				let currencyData = this.marginData[this.selectedCurrency];
				// https://trello.com/c/lj5SIdu3
				return currencyData.WITHDRAW_QUOTA || currencyData.AVAILABLE_MARGIN;
			}
		},
		/** 銀行餘額 */
		bankBalanceAmount() {
			return this.$store.state.status.bank.balanceAmount;
		},
		// 按鈕是否 enable
		buttonEnable() {
			return this.bankListOptions.length > 0;
		},
	},
}
</script>

<style scoped>
.left-part  {
	width: 25%;
}
.btn.iceben {
	width: 40%;
	height: 3em;
}
@media screen and (max-height: 620px) {
	.mgtb2 {
		margin: 1vw 0;
	}
	.btn-confirm {
		width: 195px !important;
		height: 10vw !important;
		border-radius: 2vw !important;
	}
}
</style>