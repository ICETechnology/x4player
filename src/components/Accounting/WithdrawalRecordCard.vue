<template>
	<div class="with-drawal-record-card-ctn mglr5 flex-col font-size-big">
		<!-- <div class="flex-col flex-center mglr1">
			<Button class="pdlr1" @click="$emit('cancel', data)" :disabled="cancelAble?'':'disabled'">取消</Button>
		</div> -->
		<div class="flex-row mgb1">
			<div class="font-size-mini clr-gray">{{data.ID}}</div>
			<div class="flex-1"></div>
			<div class="font-size-mini clr-gray">{{new Date(data.RECEIVE_TIME).dayTime18()}}</div>
		</div>
		<div class="flex-col flex-1 border pdtb2">
			<div class="flex-row">
				<div class="flex-col flex-center flex-1">
					<div class="font-size-micro clr-gray2">申請類別</div>
					<div>{{getType(data.TYPE, data.TARGET)}}</div>
				</div>
				<div class="flex-col flex-center flex-1">
					<div class="font-size-micro clr-gray2">幣別</div>
					<div>{{data.EXCHANGE_TYPE == "A" ? data.EXCHANGE_CURRENCY : data.CURRENCY}}</div>
				</div>
				<div class="flex-col flex-center flex-1">
					<div class="font-size-micro clr-gray2">金額</div>
					<div>{{this.$displayMoney(data.AMOUNT)}}</div>
				</div>
			</div>
			<div class="flex-row mgt1">
				<div class="flex-col flex-center flex-1">
					<div class="font-size-micro clr-gray2">異動日期</div>
					<div>{{transDate}}</div>
				</div>
				<div class="flex-col flex-center flex-1">
					<div class="font-size-micro clr-gray2">狀態</div>
					<div :class="[statusClass]">{{statusMap[data.STATUS] || '--'}}</div>
				</div>
				<div class="flex-col flex-center flex-1">
					<Button class="pdlr5" @click="$emit('cancel', data)" :disabled="cancelAble?'':'disabled'">取消</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['data'],
	data() {
		return {
			/** 狀態文字對照表 */
			statusMap: {
				pending: this.$ln('确认中'),
				success: this.$ln('成功'),
				fail: this.$ln('失败'),
				cancelled: this.$ln('已取消'),
			},
		}
	},
	beforeMount() {},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {
		getType(type, IOB) {
			let typeTxt = "";
			// 20230104 依PM規格轉換出入金記錄的申請類別欄位文字 https://trello.com/c/lI93MB5T/
			switch(type) {
				case "withdraw":
					if(IOB == "IB")	typeTxt = "國內出金";
					if(IOB == "OB") typeTxt = "國外出金";
					break;
				case "deposit":
					if(IOB == "IB") typeTxt = "國內入金";
					if(IOB == "OB") typeTxt = "國外入金";
					break;
				case "transout":
					typeTxt = "國內出金";
					try{return vuex.config.publicPdSetting.CONFIG.DepositWithdrawalRecords.typeText.transout[IOB];}catch(e){}
					break;
				case "transin":
					typeTxt = "國內入金";
					try{return vuex.config.publicPdSetting.CONFIG.DepositWithdrawalRecords.typeText.transin[IOB];}catch(e){}
					break;
				case "cancel":
					typeTxt = "取消";
					break;
				case 'exchange':
					typeTxt = "換匯";
					break;
			}
			return this.$ln(typeTxt || type);
		},		
	},
	watch: {},
	computed: {
		$displayMoney() {
			return this.$store.state.fn.$displayMoney;
		},
		transDate() {
			try{return this.data.TRANS_DATE.substring(2).replaceAll('-', '.');}catch(e){}
		},
		// 可取消
		cancelAble() {
			return this.data.STATUS === 'pending';
		},
		// 狀態文字顏色
		statusClass() {
			switch(this.data.STATUS){
				case 'success': return 'clr-orange';
				case 'fail': return 'clr-warn';
				case 'cancelled': return 'clr-gray';
			}
		},
	},
}
</script>

<style scoped>
.border {
	border: 1px solid #666;
	border-radius: 1vw;
}
.button-ctn {
	color: white;
	background-color: #E68E3E;
}
</style>