<template>
	<div class="Option-net-ctn flex-col font-size-small">
		<div class="head-ctn flex-row pd2">
			<!-- 交易帳號選擇器 -->
			<LoginedBTOSelector class="logined-bto-selector account-ctn rd1" :orderMode="true" />
			<!-- 資料接收時間 -->
			<div class="flex-center flex-end flex-1 clr-gray2">{{ _receiveTime }}</div>
		</div>
		<div class="list-title-ctn flex-row pdtb2 flex-center">
			<span class="check-ctn flex-center">{{ $ln('選擇') }}</span>
			<span class="symbol-name-ctn flex-start">{{ $ln('商品') }}</span>
			<span class="month-ctn flex-center">{{ $ln('履約月份') }}</span>
			<span class="strike-ctn flex-center">{{ $ln('履約價') }}</span>
			<span class="cp-ctn flex-center">{{ $ln('C/P') }}</span>
			<span class="qty-ctn flex-center">{{ $ln('口數') }}</span>
		</div>
		<div class="list-body-ctn flex-col posr flex-1">
			<ScrollBounce class="flex-col" :refresh="true" @refresh="reloadList">
				<div class="positionnet-row-ctn flex-row pdtb4" v-for="(data, key) in positionNetList" :key="key" :class="{'clr-orange2': data.SYMBOL == selected}">
					<span class="check-ctn flex-center" @click="onCheck(data)">
						<i class="material-icons" >{{ data.SYMBOL == selected ? "adjust" : "panorama_fish_eye"}}</i>
					</span>
					<span class="symbol-name-ctn">{{ getSymbolName(data.SYMBOL) }}</span>
					<span class="month-ctn flex-center">{{ getMonth(data.SYMBOL) }}</span>
					<span class="strike-ctn flex-center">{{ getStrike(data.SYMBOL) }}</span>
					<span class="cp-ctn flex-center">{{ getCallPut(data.SYMBOL) }}</span>
					<span class="qty-ctn flex-center">{{ data.QTY }}</span>
				</div>
				<Stamp v-if="positionNetList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<div class="foot-ctn pd2 flex-row pdtb3">
			<span class="nowrap flex-center mgl2">{{ $ln('口數') }}：</span>
			<div class="order-qty-ctn flex-center pdlr3">
				<InputQty v-model="orderQty" :max="maxQty" :disable="!selected"/>
			</div>
			<div class="btn-ctn flex-center mglr2 ">
				<Button class="send-btn w100p ht2 pdlr5 rd1 nowrap" :class="{'disabled': orderQty === 0 || !selected}"
					@click="onSendClick" >{{$ln("選擇權互抵")}}</Button>
			</div>
		</div>
		<!-- 提示訊息 -->
		<LoadingBlockMsg :bmParam="bmParam" v-if="showBlock" :paramText="paramText" @CLOSE="onCloseBlockMsg" />
	</div>
</template>
<script>
import LoadingBlockMsg from '@/components/OptionCS/LoadingBlockMsg.vue';
export default {
	data() {
		return {
			selected: "",
			orderQty: 0,
			maxQty: 0,
			paramText: ". . . . . ",
			// BlockMessage參數
			bmParam: {},
			showBlock: false,
			addResult: {},
			queryResult: {},
		}
	},
	components: {LoadingBlockMsg},
	beforeMount() {
		this.reloadList();
	},
	mounted() {
		this.$emit('title', '選擇權互抵');
	},
	methods: {
		// 重查互抵清單
		reloadList() {
			// 防連點機制
			if (this.queryResultLock) return; 
					this.queryResultLock = setTimeout(()=>{delete this.queryResultLock;}, 1000);
			this.queryResult = M4C.CombinePosition.queryPositionNet();
		},
		// 勾選
		onCheck(data) {
			if(this.selected !== data.SYMBOL) {
				this.selected = data.SYMBOL;
				this.maxQty = this.orderQty = data.QTY;
			}
			else {
				this.resetSelected();
			}
		},
		// 轉換合約名稱
		getSymbolName(symbol) {
			return M4C.Symbol.getContractName(symbol);
		},
		// 解析月份
		getMonth(symbol) {return symbol.split('.')[4];},
		// 解析履約價
		getStrike(symbol) {return M4C.Option.getStrike(symbol)},
		// 解析認沽認購
		getCallPut(symbol) {return M4C.Option.getCallPut(symbol)},
		// 執行互抵
		onSendClick() {
			if(this.selected && this.orderQty) {
				this.showBlock = true;
				this.addResult = M4C.CombinePosition.addPositionNet(this.selected, this.orderQty);
			}
		},
		// 關閉訊息
		onCloseBlockMsg() {
			this.showBlock = false;
			this.reloadList();
		},
		// 重設當前選取資料
		resetSelected() {
			this.selected = "";
			this.orderQty = this.maxQty = 0;
		},
	},
	watch: {
		// 切換交易帳號時重查互抵清單
		account(nv, ov) {this.reloadList();},
		// 申請互抵狀態
		"addResult.$STATUS": function(nv, ov) {
			if (nv === "FAIL") {
				let result = this.addResult;
				let mseeage = `(${result.$CD}) ${result.$MSG}`;
				let memo = "";
				try {memo = result.data.d.memo? `<br />${result.data.d.memo}`: "";} catch(e){}
				this.bmParam = {display: true, head: this.$ln('系統訊息'), body: mseeage + memo, showConfirmBtn: true};
			}
			if(nv === "DONE") {
				this.bmParam = {display: true, head: this.$ln('系統訊息'), body: `互抵成功`, showConfirmBtn: true};
			}

		},
		// 查詢互抵狀態
		"queryResult.$STATUS": function(nv, ov) {
			// 查詢失敗時顯示訊息
			if (nv === "FAIL") {
				let result = this.addResult;
				this.bmParam = {display: true, head: this.$ln('系統訊息'), body: `(${result.$CD}) ${result.$MSG}`, showConfirmBtn: true};
			}
			// 查詢成功且有對應資料時重設最大口數，沒有對應資料時移除選取商品
			if(this.selected && nv === "DONE") {
				let position = this.positionNetList.find(obj=>obj.SYMBOL === this.selected);
				if(position)
					this.maxQty = position.QTY;
				else
					this.resetSelected();
			}
		}
	},
	computed: {
		// 當前帳號
		account() {return this.selectedBTO.selectedAccountID;},
		// 互抵清單
		positionNetList() {return M4C.CombinePosition.positionNetList;},
		/** 狀態章 */
		stampStatus() {
			return this.queryResult.$STATUS;
		},
		// 當前帳號資訊
		selectedBTO() {
			return this.$store.state.selectedBTO || {};
		},
		// 顯示用的交易帳號
		displayTraderID() {
			return M4C.Trader.getDisplayTraderID(this.selectedBTO.selectedAccountID);
		},
		// 資料接收時間(這部分server沒有提供，所以用client核心記錄的時間顯示)
		_receiveTime() {
			if(this.positionNetList.length) {
				// 有資料時取最後一筆資料的時間回傳
				return new Date(this.positionNetList.slice(-1)[0].$_receiveTime).dayTime18();
			}
			else return "---/--/-- --:--:--";
		}
	},
}
</script>
<style scoped>
.head-ctn {
	background-color: #2A3647;
}
.foot-ctn {
	background-color: #292C2F;
}
.account-ctn {
	border: 1px solid gray;
}
.list-title-ctn, .positionnet-row-ctn:nth-child(2n+1){
	background: #000B18;
}
.order-qty-ctn /deep/ .input-qty.h2em {
	height: 2.5em;
}
.check-ctn {
	min-width: 14vw;
	max-width: 14vw;
}
.cp-ctn {
	min-width: 6vw;
	max-width: 6vw;
}
.month-ctn,.strike-ctn,.symbol-name-ctn,.qty-ctn{
	min-width: 20vw;
	max-width: 20vw;
}
</style>