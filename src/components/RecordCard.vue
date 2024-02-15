<template>
	<div class="flex-item posr card-item-ctn">
		<div class="card-item flex-item" :class="[getBdClr(record)]">
			<div class="flex-row flex-1" v-if="record">
				<div class="side-icon flex-col flex-center" :class="[getBgcClr(record), {'smo-style': !record.$IS_OCO && isFcmSupportSMO}]" v-html="getSide(record)">
				</div>
				<div class="symbol-info flex-1" @click="onRecord(record)" >
					<div class="flex-col flex-center FULL flex-top ctn-info" v-html="getQtyPrice(record)" />
				</div>
				<div class="flex-end" @click="onDelCard(record)"><i class="material-icons cancel-icon">clear</i></div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	props:['record'],
	data(){
		return{}
	},
	methods: {
		// 取得邊線顏色
		getBdClr(record){
			// 該記錄卡是空的時候給無邊線樣式
			if(!record) return "bd-none";
			// 根據持倉數量or委託方向給邊線顏色
			let BDColor = Number(record.$BQTY) || (record.$SIDE === 'BUY')? "bd-up": "bd-dn";
			// 有淨倉資料時
			if(record.$NET_QTY)
				BDColor =  record.$NET_QTY > 0? "bd-up": "bd-dn";
			return BDColor;
		},
		// 取得背景顏色
		getBgcClr(record){
			let BGColor = Number(record.$BQTY) || (record.$SIDE === 'BUY')? "bgc-up": "bgc-dn";
			// 有淨倉資料時
			if(record.$NET_QTY)
				BGColor =  record.$NET_QTY > 0? "pos-bgc-up": "pos-bgc-dn";
			return BGColor;
		},
		// 取得方向
		getSide(record){
			// 委託單
			if(record.$SIDE){
				// oco單
				if(record.$IS_OCO){
					let _el = `<span>${record.OCO[0].SIDE == "BUY"?this.$ln('买'):this.$ln('卖')}</span>`;
					if(record.OCO[1]){
						_el += `<span>${record.OCO[1].SIDE == "BUY"?this.$ln('买'):this.$ln('卖')}</span>`;
					}
					return _el;
				}
				return `<span>${(record.$SIDE === 'BUY')? this.$ln('买'): this.$ln('卖')}</span>`;
			}
			// 持倉
			else if(record.$BQTY || record.$SQTY)
				return `<span>${this.$ln('仓')}</span>`;
		},
		getQtyPrice(record){
			if(record.$IS_OCO){
				let OCO = record.OCO;
				let _el =`<div class="flex-row"><span>${OCO[0].ORDER_QTY}</span>@<span>${this.getPrice(OCO[0])}</span></div>`;
				if(OCO[1]){
					_el += `<div class="flex-row"><span>${OCO[1].ORDER_QTY}</span>@<span>${this.getPrice(OCO[1])}</span></div>`;
				}
				return _el;
			}
			else{
				// 一般单(含單邊止盈、止損單)或持仓
				return `<div class="flex-row flex-wrap">
							<span class="flex-row">${this.getQTY(record)}</span>@<span>${this.getPrice(record)}</span>
						</div>`;
			}
		},
		getQTY(record){
			// 取得剩餘有效委託數量欄位 (目前發現智慧單已觸價時沒更新有效量，會導致數量取值不正常，先做防錯處理。)
			let QTY = record.$AVAILABLE_QTY || Math.abs(record.$NET_QTY) || '';
			return QTY;
		},
		getPrice(record){
			let isSMO = record.SMO || this.isFcmSupportSMO;
			let price = 0;
			// 持倉
			if(record.$NET_QTY)	price = record.$NET_QTY > 0? record.$BAVG: record.$SAVG;
			// 停損單
			else if(record.TC_ORDER_TYPE == "STOP" || record.TC_ORDER_TYPE == "STPLMT") price = record.STOP_PRICE;
			// 觸價單
			else if(record.TC_ORDER_TYPE == "MIT" || record.TC_ORDER_TYPE == "LIT") price = record.TOUCH_PRICE;
			// 移動停損單
			else if(isSMO && record.SMO && record.SMO.CONDITION === "TRAILINGSTOP") {
				let trgValue = record.SMO.TRG_TYPE !== 'GUARANTEE'? record.SMO.TRG_VALUE: this.$updatePrice(record.SYMBOL, record.SMO.TRG_VALUE);
				price = `${this.$ln('回撤')}${trgValue}${record.SMO.TRG_TYPE !== 'GUARANTEE'? this.$ln('档'): ''}`;
			}
			// 一般停損單
			else if(record.CONDITION_TYPE == "STOP")
				price = record.STOP_PRICE;
			// 一般單
			else price = record.ORDER_PRICE || this.$ln(`市价`);
			if(!isNaN(price))
				price = this.$updatePrice(record.SYMBOL, price);
			return price;
		},
		onRecord(record){
			let type = record.$SIDE? "report": "position";
			if(type === "report"){
				eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: record, action: "REPRICE", useComName: this.selfComName}});
			}
			else if(type === "position"){
				// pdsetting隱藏smo時不處理止盈止損
				if(this.hiddenSMO) return;
				// 有簽署雲端同意書才執行止盈止損功能
				if(M4C.SmoAgreement.checkAgreeSMO()){
					eventBus.$emit("POPUP-DIALOG", "StopLoss", record, {transName: 'float'});
				}
				// 未簽署時顯示簽署同意書訊息
				else {
					M4C.SmoAgreement.popupAgreeMsg();
				}
			}
		},
		// 移除記錄卡
		onDelCard(record){
			let type = record.$SIDE? "report": "position";
			// 刪委託單
			if(type === "report"){
				if(this.$store.state.order.confirm){
					eventBus.$emit("POPUP-FLOAT-DIALOG", {comClass: 'OrderModify', param: {rpt: record, action: "CANCEL", useComName: this.selfComName}});
				}
				else
					M4C.Order.cancelOrderByReport([record]);
			}
			// 平倉
			else if(type === "position"){
				let orderInfo = {
					'ACTION': 'NEW',											// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
					'SYMBOL': record.SYMBOL,
					'SIDE': record.$NET_QTY > 0 ? "SELL" : "BUY",				// 買BUY/賣SELL
					'POSITION_EFFECT': this.closeEffect,						// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
					'TC_ORDER_TYPE': 'MARKET',									// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
					'TIME_IN_FORCE': 'IOC',										// ROD/IOC/FOK
					'ORDER_PRICE': 0,
					'ORDER_QTY': this.closeQty,
					'AP_PLUGIN': this.useComName || this.selfComName,
				};
				if(this.$store.state.order.closeConfirm){
					// 彈出下單確認頁
					eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: orderInfo}, {transName: 'float', '$HEAD': {'title': this.$ln(`委托确认`)}});
				}
				else
					M4C.Order.sendOrder(orderInfo);
			}
		}
	},
	computed: {
		// 價格補小數位數
		$updatePrice() {return this.$store.state.fn.$updatePrice;},
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {return this.$store.state.config.quotePdSetting.function.hiddenSMO;},
		// 上手是否支持洗價單
		isFcmSupportSMO() {
			// 支持洗價單種類
			let supportedSMO = ["STOP", "STPLMT", "TSTOP", "TSTPLMT", "MIT", "LIT"];
			return supportedSMO.indexOf(this.record.TC_ORDER_TYPE) != -1;
		},
		// 平倉代碼
		closeEffect() {
			// 有備兌倉且淨倉小於0回傳備兌平倉代碼CWC
			if(this.record.$NET_QTY < 0 && this.record.$CSQTY) {return 'CWC';}
			else return 'CLOSE';
		},
		// 平倉數量(基本上以淨倉數量為主，但如果是空倉，另外計算備兌倉)
		closeQty() {
			let qty = Math.abs(this.record.$NET_QTY);
			// 有備兌倉且淨倉小於0，空方淨倉數量大於備兌數量以備兌數量優先
			if(this.record.$NET_QTY < 0 && this.record.$CSQTY && qty > this.record.$CSQTY) {
				return this.record.$CSQTY;
			}
			else {
				return qty;
			}
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
	}
}
</script>
<style scoped>
.symbol-name{
	line-height: 1.5;
}
.symbol-info{
	overflow: hidden;
	position: relative;
}
.ctn-info{
	overflow-x: auto;	
}
.card-item-ctn{
	border-radius: 5vw;
	min-width: 41vw;
	max-width: 41vw;
	height: 10vw;
}
.card-item{
	border-radius: 5vw;
	min-width: 41vw;
	max-width: 41vw;
	height: 10vw;
	border-width: 1px;
	border-style: solid;
	align-items: center;
	background-color: rgb(72, 76, 79);
}
.side-icon{
	box-sizing: border-box;
	border-radius: 50%;
	min-width: 10vw;
	height: 10vw;
}
.smo-style{
	border: 2px white solid;
}
.bd-up{
	border-color: #D61112;
}
.bd-dn{
	border-color: #2E9727;
}
.cancel{
	/* padding: 5px; */
}
.pos-bgc-up{
	background-color: #940000;
}
.pos-bgc-dn{
	background-color: #007900;
}
.bd-none{
	/* border:none !important; */
	opacity: 0;
}
@media screen and (max-height: 620px) {
	.card-item{
		border-radius: 5vh;
		min-width: 30vw;
		max-width: 30vw;
		height: 10vh;
		border-width: 1px;
		border-style: solid;
		align-items: center;
	}
	.card-item-ctn{
		border-radius: 5vh;
		min-width: 30vw;
		max-width: 30vw;
		height: 10vh;
	}
}
@media screen and (orientation: landscape) {
	.card-item{
		border-radius: 5vh;
		min-width: 24vw;
		max-width: 24vw;
		height: 10vh;
		border-width: 1px;
		border-style: solid;
		align-items: center;
	}
	.side-icon{
		box-sizing: border-box;
		border-radius: 50%;
		min-width: 10vh;
		height: 10vh;
	}
	.card-item-ctn{
		border-radius: 5vh;
		min-width: 24vw;
		max-width: 24vw;
		height: 10vh;
	}
}
</style>