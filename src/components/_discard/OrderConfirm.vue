<template>
    <div class="flex-column">
		<MyHead class="head" :backType="1" showText="委托确认" :margin="$store.state.status.isPortrait"></MyHead>
		<div class="flex-1 flex-end" :class="$store.state.status.isPortrait? 'flex-col': 'flex-row'">
			<div class="flex-col posr w100p h100p">
				<div class="table-ctn nowrap flex-center FULL">
					<table class="flex-1" :class="{'table':$store.state.status.isPortrait}">
						<tr><td>{{$ln('合约')}}</td><td colspan=2 class="clr-aqua">{{getContract}}</td></tr>
						<tr><td>{{$ln('帐号')}}</td><td colspan=2>{{getAccount}}</td></tr>
						<tr><td>{{$ln('交易所')}}</td><td colspan=2>{{getExg}}</td></tr>
						<tr v-if="isOCO"><td>{{$ln('智能单')}}</td><td colspan=2>OCO</td></tr>
						<tr><td>{{$ln('买卖别')}}</td>
							<td :class="udClr1">{{$ln(side1Text)}}</td>
							<td :class="udClr2" v-if="is2">{{$ln(side2Text)}}</td>
						</tr>
						<tr><td>{{$ln('仓别')}}</td>
							<td :class="udClr1">{{$ln(positionEffect1Text)}}</td>
							<td :class="udClr2" v-if="is2">{{$ln(positionEffect2Text)}}</td>
						</tr>
						<tr><td>{{$ln('报单')}}</td>
							<td :class="udClr1">{{$ln(orderType1Text)}}</td>
							<td :class="udClr2" v-if="is2">{{$ln(orderType2Text)}}</td>
						</tr>
						<tr><td>{{$ln('价格')}}</td>
							<td>{{$ln(orderPrice1Text)}}</td>
							<td v-if="is2">{{$ln(orderPrice1Text)}}</td>
						</tr>
						<tr><td>{{$ln('手数')}}</td>
							<td>{{orderQty1Text}}</td>
							<td v-if="is2">{{orderQty2Text}}</td>
						</tr>
					</table>
				</div>
			</div>
			<div class="flex-row flex-center">
				<Button class="btn btn-cancel" @click="onBtnCancel">{{$ln('取　消')}}</Button>
				<Button class="btn btn-order" :class="getOrderBtnStyle" @click="onBtnOrder">{{$ln('下　单')}}</Button>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			orderInfo: this.param.orderInfo,
			// 買賣字色 1
			udClr1: '',
			// 買賣字色 2
			udClr2: '',
			// 智慧單模式
			isOCO: this.param.orderInfo.SMO && this.param.orderInfo.OCO,
			// 左右兩筆模式
			is2: false,
			// 買賣別 1
			side1Text: '',
			// 買賣別 2
			side2Text: '',
			// 倉別 1
			positionEffect1Text: '',
			// 倉別 2
			positionEffect2Text: '',
			// 報單別 1
			orderType1Text: '',
			// 報單別 2
			orderType2Text: '',
			// 價格 1
			orderPrice1Text: '',
			// 價格 2
			orderPrice2Text: '',
			// 数量 1
			orderQty1Text: '',
			// 数量 2
			orderQty2Text: '',
        }
	},
	beforeMount() {
		let o1 = this.orderInfo;
		let o2;
		// OCO 智慧單
		if (this.orderInfo.SMO && this.orderInfo.OCO) {
			o1 = this.orderInfo.OCO[0];
			o2 = this.orderInfo.OCO[1];
		}

		// 左右兩筆模式，未來可能還有複式單
		this.is2 = this.isOCO;
		
		// 左側第一筆單
		this.sid = o1.SYMBOL;
		this.udClr1 = o1.SIDE === "BUY" ? "clr-up" : "clr-dn";
		this.side1Text = o1.SIDE === "BUY" ? "买进" : "卖出";
		this.positionEffect1Text = this.getPositionEffect(o1.POSITION_EFFECT);
		this.orderType1Text = this.getOrderType(o1);
		this.orderPrice1Text = o1.ORDER_PRICE || '市价';
		this.orderQty1Text = o1.ORDER_QTY;

		// 右側第二筆單 (若有的話)
		if (o2) {
			this.udClr2 = o2.SIDE === "BUY" ? "clr-up" : "clr-dn";
			this.side2Text = o2.SIDE === "BUY" ? "买进" : "卖出";
			this.positionEffect2Text = this.getPositionEffect(o2.POSITION_EFFECT);
			this.orderType2Text = this.getOrderType(o2);
			this.orderPrice2Text = o2.ORDER_PRICE || '市价';
			this.orderQty2Text = o2.ORDER_QTY;
		}
	},
    methods: {
		onBtnCancel: function() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onBtnOrder: function() {
			M4C.Order.sendOrder(this.orderInfo);
			eventBus.$emit("CLOSE-DIALOG");
			if (this.param.onConfirmCallback)
				this.param.onConfirmCallback();
		},
		getPositionEffect: function(str) {
			switch(str) {
				case 'AUTO': return "自动";
				case 'OPEN': return "新仓";
				case 'CLOSE': return "平仓";
			}
		},
		getOrderType: function(orderInfo) {
			let str = "";
			if (this.isOCO) {
				if (orderInfo.SMO.CONDITION == "IFTOUCHED")
					str += "止盈";
				if (orderInfo.SMO.CONDITION == "STOP")
					str += "止损";
			}
			switch(orderInfo.ORDER_TYPE) {
				case 'MARKET':	str += "市价单"; 	break;
				case 'LIMIT':	str += "限價单";	break;
				case 'HIT':str += "对手价";break;
			}
			return str;
		},		
	},
    computed: {
		getContract: function() {
			return M4C.Symbol.getCNM4(this.sid);
		},
		getAccount: function() {
			return M4C.Trader.getTraderID();
		},
		getExg: function() {
			return this.sid.split('.')[2];
		},
		getOrderBtnStyle: function() {
			return this.orderInfo.SIDE === "BUY" ? "bgc-up" : "bgc-dn";
		},
    }
}
</script>

<style lang='scss' scoped>
.table {
	margin: 15px;
	padding: 15px;
	border: 1px solid #666;
	border-radius: 10px;	
}
table td:nth-child(1) {
	padding: 5px 10px;
	width: 33%;
	text-align: right;
}
table td:nth-child(2), table td:nth-child(3) {
	padding: 5px 10px;
	background-color: #111;
}
.btn {
	width: 100px;
	margin: 10px;
}
.table-ctn{
	// margin: auto;
    overflow: auto;
}
</style>