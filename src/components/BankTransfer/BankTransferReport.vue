<template>
    <div class="bank-transfer-report-ctn flex-col">
		<div class="flex-1 posr font-size-little">
			<ScrollBounce ref="sb" class="FULL" :refresh="true" @refresh="onRefresh" v-stop-propagation-y>
				<div class="flex-row list-block bgc-head rd2 mg4 pdtb3" v-for="(obj, idx) in fundTransferReportList">
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('操作时间')}}</div>
						<div class="nowrap font-size-micro">{{new Date(obj.RECEIVE_TIME).day10()}}<br>{{new Date(obj.RECEIVE_TIME).time8()}}</div>
					</div>
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('类别')}}</div>
						<div class="nowrap font-size-micro">{{getTypeName(obj.TYPE)}}</div>
					</div>
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('状态')}}</div>
						<div class="nowrap font-size-micro" v-html="getStatusHtml(obj.STATUS)"></div>
					</div>
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('金额')}}</div>
						<div class="nowrap font-size-micro">{{$displayMoney(obj.AMOUNT)}}</div>
					</div>
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('银行简称')}}</div>
						<div class="nowrap font-size-micro">{{getBankName(obj.BANK_ID)}}</div>
					</div>
					<div class="column-ctn flex-col">
						<div class="nowrap clr-gray2 font-size-nano">{{$ln('备注')}}</div>
						<div class="font-size-micro">{{obj.MSG}}</div>
					</div>
				</div>
				<Stamp v-if="fundTransferReportList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
    </div>
</template>

<script>
export default {
	props: ['suspend'],
	data() {
		return {
			/** 出入金回報 */
			fundTransferReportList: [],
		}
	},
	beforeMount() {
		// 查詢出入金回報
		this.fundTransferReportList = M4C.BankTransfer.queryFundTransferReport();
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onRefresh() {
			// 查詢出入金回報
			this.fundTransferReportList = M4C.BankTransfer.queryFundTransferReport();
		},
		// 取得銀行名稱
		getBankName(bankID) {
			return M4C.BankTransfer.getBankName(bankID);
		},
		// 取得出金或入金文字
		getTypeName(type) {
			if (type === "withdraw") return this.$ln(`出金`);
			else if (type === "deposit") return this.$ln(`入金`);
			else return type;
		},
		// 取得狀態文字
		getStatusHtml(status) {
			if (status === "pending")
				return `<span class="clr-gray2">${this.$ln(`确认中`)}</span>`;
			else if (status === "success")
				return `<span class="clr-success">${this.$ln(`成功`)}</span>`;
			else if (status === "fail")
				return `<span class="clr-warn">${this.$ln(`失败`)}</span>`;
			else return status;
		},
	},
	watch: {
		suspend(nv) {
			if (!nv) {
				// 查詢出入金回報
				this.fundTransferReportList = M4C.BankTransfer.queryFundTransferReport();
			}
		}
	},
    computed: {
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		stampStatus() {
			return this.fundTransferReportList.$STATUS;
		}
	},
}
</script>

<style scoped>
.column-ctn {
	width: 33%;
}
</style>