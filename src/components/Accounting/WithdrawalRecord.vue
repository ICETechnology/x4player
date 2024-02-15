<template>
	<div class="WithdrawalRecord-ctn flex-col">
		<div class="flex-row mglr5 mgt3">
			<div>公司別：{{branchID}}</div>
			<div class="flex-1"/>
			<div>客戶帳號：{{customID}}</div>
		</div>
		<div class="flex-center mglr5 flex-row">
			<DatePick v-model="dateObj" class="flex-row flex-1 sys-bgc divider btn-default-ht-rd mgr2"/>
			<Button class="mgtb3 pdlr5 clr-white btn-default-ht-rd query-btn font-size-big" @click="onQuery">{{$ln(`查询`)}}</Button>
		</div>
		<ScrollBounce class="flex-1 mgt3 posr Withdrawal-Record-ctn" v-stop-propagation-y>
			<WithdrawalRecordCard class="mgb5" v-for="(data, idx) in dataList" :data="data" :key="`wdr-key-${idx}`" @cancel="onCancel" />
			<Stamp v-if="dataList.length===0" :stampStatus="stampStatus" />
		</ScrollBounce>
		<!-- 提示訊息 -->
		<BlockMessage v-if="bmParam.display" :param="bmParam"></BlockMessage>
	</div>
</template>
<script>
import BlockMessage from "@/components/Framework/BlockMessage.vue";
import WithdrawalRecordCard from "@/components/Accounting/WithdrawalRecordCard.vue";
export default {
	data() {
		return {
			// 查詢區間
			dateObj: {start: "20210520", end: "20210525"},
			// 預設查詢30天資料
			rangeDay: 30,
			dataList: [],
			/** 出入金回報查詢狀態 */
			queryWithdrawalReportResult: {},
			/** 出入金取消狀態 */
			fundTransferCancelResult: {},
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
	components: {
		BlockMessage,
		WithdrawalRecordCard,
	},
	created() {
		// 設定起訖時間，依需求調整起訖為同一日期
		this.dateObj.end = new Date().day8();
		this.dateObj.start = new Date().day8();
	},
	beforeMount() {
		// 查詢出入金回報
		this.onQuery();
	},
	mounted() {},
	methods: {
		onQuery() {
			let _dateObj = {}
			_dateObj['start'] = this.$formatDate(this.dateObj.start);
			_dateObj['end'] = this.$formatDate(this.dateObj.end);
			this.dataList = [];
			// 查詢出入金回報
			this.queryWithdrawalReportResult = M4C.BankTransfer.queryFundTransferReport(_dateObj);
		},
		// 出入金記錄點擊取消按鈕
		onCancel(data) {
			let self = this;
			eventBus.$emit("CONFIRM-DIALOG", {
				title: self.$ln("取消出金"),
				content: self.$ln(`確認取消出金單號`) + ' ' + data.ID,
				confirm: () => {
					self.sendCancelOrder(data);
				},
			});
		},
		// 送出取消出入金命令
		sendCancelOrder(record) {
			// 設定BlockMessage
			this.bmParam.display = true;
			this.bmParam.showLoadingIcon = true;
			this.bmParam.showCancelBtn = false;
			this.bmParam.showConfirmBtn = false;
			this.bmParam.body = this.$ln('送出申请中');
			record.encryptPwd = this.selectedBTO.encryptPwd || this.$store.state.selectedWSConn.$encryptPwd,
            // 取消出金
			this.fundTransferCancelResult = M4C.BankTransfer.fundTransferCancel(record);
		},
	},
	watch: {
		suspend(nv) {
			if (!nv) {
				// 查詢出入金回報
				this.onQuery();
			}
		},
		stampStatus(nv) {
			if (nv === "DONE") {
				if (this.queryWithdrawalReportResult.length) {
					this.dataList = [...this.queryWithdrawalReportResult];
					// 依操作時間排序
					this.dataList.sort((a,b)=> {
						return new Date(a.RECEIVE_TIME) < new Date(b.RECEIVE_TIME) ? 1 : -1;
					});
				}
			}
		},
		// 取消出入金狀態
		cancelStampStatus(nv) {
			let result = this.fundTransferCancelResult;
			if (nv === "DONE") {
				// 設定BlockMessage
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = this.$ln('申请已送出');
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
				// 查詢出入金回報
				this.onQuery();
			}
			if (nv === "FAIL") {
				// 設定BlockMessage
				this.bmParam.head = this.$ln('申请结果');
				this.bmParam.body = `(${result.$CD}) ${result.$MSG}`;
				this.bmParam.showConfirmBtn = true;
				this.bmParam.showLoadingIcon = false;
			}
		},
	},
	computed: {
		// 格式化日期 將20220427轉成2022-04-27
		$formatDate() {return this.$store.state.fn.$formatDate;},
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		/** 出入金回報列表 */
		// fundTransferReportList() {return M4C.BankTransfer.withdrawalReportData;},
		stampStatus() {return this.queryWithdrawalReportResult.$STATUS;},
		// 取消出入金狀態
		cancelStampStatus() {return this.fundTransferCancelResult.$STATUS;},
		/** 當前交易帳號 BTO 物件 */
		selectedBTO() {
			return this.$store.state.selectedBTO;
		},
		branchID() {
			return vuex.login.accountID.split('-')[0];
		},
		customID() {
			return vuex.login.accountID.split('-')[1];
		},
	},
}
</script>
<style scoped>
.query-btn {
	background-color: #55AD54;
}
.content>input {
	box-sizing: border-box;
	border-width: 1px;
	padding-left: 3vw;
}
</style>