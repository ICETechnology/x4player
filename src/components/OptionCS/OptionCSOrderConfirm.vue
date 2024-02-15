<template>
	<div class="optioncs-order-confirm-ctn flex-col flex-center">
		<!-- 單組、單拆UI -->
		<div class="order-itme-info flex-end flex-col flex-1" v-if="showNormalCS" >
			<div class="item1-ctn flex-row pdlr1">
				<span class="side1-ctn mgr1" :class="transBSClass(orderinfo.SIDE)">{{ $ln(transBSText(orderinfo.SIDE)) }}</span>
				<span class="symbol1-ctn flex-end flex-1">{{ symbolName1 }}</span>
			</div>
			<div class="item2-ctn flex-row mgt2 pdlr1">
				<span class="side2-ctn mgr1" :class="transBSClass(orderinfo.SIDE2)">{{ $ln(transBSText(orderinfo.SIDE2)) }}</span>
				<span class="symbol2-ctn flex-end flex-1">{{ symbolName2 }}</span>
			</div>
			<div class="order-qty-ctn flex-center mgt5">
				<InputQty v-model="orderQty" :max="maxQty"/>
			</div>
			<div class="max-notice-ctn clr-up mgt2">最多{{ maxQty }}口</div>
		</div>
		<div class="flex-1" v-if="showNormalCS" />
		<div class="order-itme-list-title flex-row bgc-2A pdtb1 font-size-small" v-if="showCombineAll">
			<span class="serial flex-center">{{ $ln('序號') }}</span>
			<span class="contract flex-start">{{ $ln('合約') }}</span>
			<span class="buysell flex-center">{{ $ln('多空') }}</span>
			<span class="offsetableQty flex-center">{{ $ln('未平倉量') }}</span>
		</div>
		<!-- 全組UI -->
		<div class="order-itme-list-ctn flex-col flex-1 posr w100p font-size-small" v-if="showCombineAll">
			<ScrollBounce>
				<div class="order-itme-list-wrapper FULL flex-col overflow-y-auto">
					<div class="record-ctn flex-col pdtb2" v-for="(data, idx) in combineAllList" :key="idx">
						<div class="foot1-ctn flex-row flex-center">
							<span class="serial flex-center">{{ idx + 1 }}</span>
							<span class="contract">{{ getCNM4(data.SYMBOL) }}</span>
							<span class="buysell flex-center" :class="transBSClass(data.SIDE)">{{ transBS(data.SIDE) }}</span>
							<span class="offsetableQty flex-center" :class="transBSClass(data.SIDE)">{{ transBSQty(data.QTY, data.SIDE) }}</span>
						</div>
						<div class="foot2-ctn flex-row">
							<span class="serial flex-center">{{ idx + 1}}</span>
							<span class="contract">{{ getCNM4(data.SYMBOL2) }}</span>
							<span class="buysell flex-center" :class="transBSClass(data.SIDE2)">{{ transBS(data.SIDE2) }}</span>
							<span class="offsetableQty flex-center" :class="transBSClass(data.SIDE2)">{{ transBSQty(data.QTY, data.SIDE2) }}</span>
						</div>
					</div>
					<Stamp v-if="combineAllList.length===0" :stampStatus="stampStatus" />
				</div>
			</ScrollBounce>
		</div>
		<!-- 全組風險預告書 -->
		<div class="combineall-risknotice-ctn flex-col flex-1 w100p clr-black" v-if="showNotice">
			<div class="risk-notice-title-ctn flex-center pdt2 font-size-big" v-if="noticeTitle" v-html="noticeTitle" />
			<div class="risk-notice-content-ctn flex-1 posr divider mg2 rd1">
				<ScrollBounce>
					<div v-html="noticeContent" class="pd1" />
				</ScrollBounce>
			</div>
		</div>
		<div class="option-btn-ctn pd5" :class="showNotice? 'flex-row': 'flex-col'">
			<Button class="send-btn w100p ht2 rd1 clr-white mgb5" v-if="!showNotice" @click="onSendClick" :class="{'disabled': !enableSend}">{{$ln("送出")}}</Button>
			<Button class="send-btn w100p ht2 rd1 clr-white mgb5 mgr4" v-if="showNotice" @click="onConfirm" >{{$ln("確定")}}</Button>
			<Button class="cancel-btn w100p ht2 rd1 bgc-white mgb5" @click="onCancelClick" >{{$ln("取消")}}</Button>
		</div>
		<LoadingBlockMsg :bmParam="bmParam" v-if="showBlock" :paramText="paramText" @CLOSE="onCloseLoading" />
	</div>
</template>
<script>
import LoadingBlockMsg from './LoadingBlockMsg.vue';
export default {
	data() {
		return {
			orderQty: 1,
			// BlockMessage參數
			bmParam: {},
			orderResult: {},
			showBlock: false,
			combineAllList: [],
			combineAllResult: {},
			paramText: '網路組拆中。。。',
			showNotice: true,
		}
	},
	components: {LoadingBlockMsg},
	props:['param'],
	beforeDestroy() {},
	mounted() {
		// let titleText = this.orderinfo.TYPE === "COMBINE"? "確認組合資訊": this.orderinfo.TYPE === "SPLIT"? "確認拆解資訊": "快速組合商品";
		// 有設定提示訊息時才顯示
		this.showNotice = !!this.noticeData;
		let titleText = ""
		// 判斷顯示標題
		if(this.showNotice && !this.isCombineAll) 
			titleText = this.$ln('複式單拆解');
		else titleText = this.titleText;
		// 設定標題
		this.$emit('title', titleText);
		this.orderQty = this.maxQty;
	},
	methods: {
		// 執行送出
		onSendClick() {
			this.showBlock = true;
			let oi = JSON.parse(JSON.stringify(this.orderinfo));
			// 調整數量
			if(this.orderQty !== this.maxQty) {
				oi.QTY = this.orderQty;
			}
			// 全組時將第一筆取出當委託內容(測試時發現只需要送第一筆資料且TYPE是COMBINE_ALL就可以全組了)
			if(this.isCombineAll)
				oi = this.combineAllList[0];
			if(oi)
				this.orderResult = M4C.CombinePosition.execCombinePosition(oi);
		},
		onCancelClick() {eventBus.$emit("CLOSE-DIALOG")},
		// 依買賣代碼轉換文字
		transBSText(side) {
			if(side === 'BUY') return '買進';
			if(side === 'SELL') return '賣出';
		},
		// 查詢全組建議
		queryCombineAllAdvice() {
			this.combineAllResult = M4C.CombinePosition.queryCombinePositionAdvice("3");
		},
		// 依買賣代碼轉換文字
		transBS(side) {
			if(side === 'BUY') return this.$ln('買');
			if(side === 'SELL') return this.$ln('賣');
		},
		// 依買賣轉換字體顏色
		transBSClass(side) {
			if(side === 'BUY') return 'clr-up';
			if(side === 'SELL') return 'clr-dn';
		},
		// 依買賣轉換正負號數量
		transBSQty(qty, side) {
			if(side === 'BUY') return `+${qty}`;
			if(side === 'SELL') return `-${qty}`;
		},
		onCloseLoading() {
			this.showBlock = false;
			// 組拆成功才發重查清單事件
			if(this.orderResult.$STATUS === "DONE") {
				eventBus.$emit("RELOAD-OPTION-LIST");
				this.onCancelClick();
			}
		},
		// 同意
		onConfirm() {
			this.showNotice = false;
			// 更改標題
			this.$emit('title', this.titleText);
			// 全組提示訊息同意後處理
			if(this.isCombineAll)
				this.queryCombineAllAdvice();
			// 全拆提示訊息同意後處理
			else if(this.isSplitAll){
				// 通知執行全拆
				eventBus.$emit('OPTIONCS-SPLITALL', this.param.CB);
				// 關閉對話框
				this.onCancelClick();
			}
		},
		// 失敗時的訊息處理
		onFailResult(result) {
			let mseeage = `(${result.$CD}) ${result.$MSG}`;
			let memo = "";
			try {memo = result.data.d.memo? `<br />${result.data.d.memo}`: "";} catch(e){}
			this.bmParam = {display: true, head: this.$ln('系統訊息'), body: mseeage + memo, showConfirmBtn: true};
		}
	},
	watch: {
		// 組拆命令結果
		"orderResult.$STATUS": function(nv, ov){
			const result = this.orderResult;
			if (nv === "FAIL") {
				this.onFailResult(result);
			}
			if (nv === "DONE") {
				let successMsg = this.orderinfo.TYPE === "COMBINE"? "組合": this.orderinfo.TYPE === "SPLIT"? "拆解": "全組";
				this.bmParam = {display: true, head: this.$ln('系統訊息'), body: successMsg + "成功", showConfirmBtn: true};
			}
		},
		// 全組建議查詢結果
		"combineAllResult.$STATUS"(nv, ov) {
			const result = this.combineAllResult;
			if (nv === "FAIL") {
				this.showBlock = true;
				this.onFailResult(result);
			}
			if(nv === "DONE") {
				this.combineAllList = this.combineAllAdvice.map(obj=>({
					'SYMBOL': obj.SYMBOL, 'SIDE': obj.SIDE, 'SYMBOL2': obj.SYMBOL2, 'SIDE2': obj.SIDE2, 'QTY': obj.QTY, 'TYPE': 'COMBINE_ALL'}));
			}
		}
	},
	computed: {
		orderinfo() {return this.param.orderinfo || {};},
		sid() {return this.orderinfo.SYMBOL;},
		sid2() {return this.orderinfo.SYMBOL2;},
		maxQty() {return this.orderinfo.QTY;},
		getCNM4() {return M4C.Symbol.getCNM4;},
		symbolName1() {	return this.getCNM4(this.sid);},
		symbolName2() {	return this.getCNM4(this.sid2);},
		// 以有無委託資訊及TYPE來判斷是否為全組
		isCombineAll() {return !this.param.orderinfo && !this.param.TYPE;},
		// 以委託資訊的TYPE欄位判斷是否為單拆
		isSingleSplit() {try {return this.param.orderinfo.TYPE === "SPLIT"}catch(e) {}},
		// 以TYPE欄位判斷是否為全拆
		isSplitAll() {try {return this.param.TYPE === "SPLITALL"}catch(e) {}},
		/** 全組建議清單 */
		combineAllAdvice() {return M4C.CombinePosition.combineAllAdvice;},
		/** 狀態章 */
		stampStatus() {
			return this.combineAllResult.$STATUS;
		},
		/** 啟用送出按鈕 */
		enableSend() {
			// 有委託資訊或全組清單且委託狀態不是在發送中
			return (this.param.orderinfo || this.combineAllAdvice.length) && this.orderResult.$STATUS !== 'QUERY';
		},
		// 顯示一般組拆(不是全組且沒有顯示提示訊息)
		showNormalCS() {return !this.isCombineAll && !this.showNotice;},
		// 顯示全組(全組且沒有顯示提示訊息)
		showCombineAll() {return this.isCombineAll && !this.showNotice;},
		/** 提示訊息資料 */
		noticeData() {
			// 全組風險預告書
			if(this.isCombineAll) {
				try {return this.$store.state.config.publicPdSetting.combineAllRiskNotice;} catch(e) {}
			}
			// 單拆或全拆提示訊息
			else if(this.isSingleSplit || this.isSplitAll) {
				try {return this.$store.state.config.publicPdSetting.splitNotice;} catch(e) {}
			}
		},
		/** 提示-標題 */
		noticeTitle() {
			if(this.noticeData)
				return this.noticeData.title;
		},
		/** 提示-內容 */
		noticeContent() {
			if(this.noticeData)
				return this.noticeData.content;
		},
		titleText() {return this.orderinfo.TYPE === "COMBINE"? "確認組合資訊": this.orderinfo.TYPE === "SPLIT"? "確認拆解資訊": "快速組合商品";}
	}
}
</script>
<style scoped>
.item1-ctn, .item2-ctn {
	min-width: 60vw; 
	max-width: 60vw;
	box-sizing: border-box;
}
.send-btn {
	background-color: #3076FF;
}
.option-btn-ctn {
	width: 80vw;
}
.serial,.buysell {
	min-width: 13vw;
	max-width: 13vw;
}
.contract {
	min-width: 50vw;
	max-width: 50vw;
}
.offsetableQty {
	min-width: 24vw;
	max-width: 24vw;
}
.record-ctn:nth-child(2n+2){
	background: #000B18;
}
.combineall-risknotice-ctn{
	background-color: #F0F0F0;
}
</style>