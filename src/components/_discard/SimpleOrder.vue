<template>
    <div class="flex-col simple-order-ctn">
    	<div class="flex-row">
			<!-- 合约/价格/手数 -->
			<div class="flex-col flex-1">
				<LabelText class="mb5" label="商品">
					<span>{{symbolText}}</span>
					<i class="ml5 material-icons tcef" @click.self="onBtnSearch">search</i>
				</LabelText>
				<CommonInput ref="price" class="flex-1 mb5" :btn="true" :sid="sid" @change="showMsg" :default-value="defaultInputPrice" @sp-change="(v)=>{sp=v}" @bp-change="(v)=>{bp=v}">{{$ln('价格')}}</CommonInput>
				<CommonInput ref="volumn" class="sheets-ipt" :btn="true" m4k-type="simple" :default-value="1" @change="showMsg">{{$ln('手数')}}</CommonInput>
			</div>
			<!-- 新/买/卖 -->
			<div class="flex-col nbs-ctn">
				<table>
					<tr>
						<td class="clr-gray">{{$ln('新')}}</td>
						<td :class="$clrUd(qo.p, qo.r)">{{qo.p}}</td>
						<td>{{qo.q}}</td>
					</tr>
					<tr>
						<td class="clr-gray">{{$ln('买')}}</td>
						<td :class="$clrUd(qo.bp1, qo.r)">{{qo.bp1}}</td>
						<td>{{qo.bv1}}</td>
					</tr>
					<tr>
						<td class="clr-gray">{{$ln('卖')}}</td>
						<td :class="$clrUd(qo.sp1, qo.r)">{{qo.sp1}}</td>
						<td>{{qo.sv1}}</td>
					</tr>
				</table>
			</div>
		</div>
		<!-- 下单按钮 -->
		<div class="flex-row" >
			<Button class="btn btn-buy flex-1 flex-col bgc-up" :disabled="qo.$cd < 0" @click="onBtnOrder('BUY', {'ORDER_TYPE': 'MARKET', 'price': 0})">
				<span>{{$ln('市价')}}</span>
				<span>{{$ln('买进')}}</span>
			</Button>
			<Button class="btn btn-buy flex-1 flex-col bgc-up" :disabled="qo.$cd < 0" @click="onBtnOrder('BUY')">
				<span>{{bp}}</span>
				<span>{{$ln('买进')}}</span>
			</Button>
			<Button class="btn btn-sell flex-1 flex-col bgc-dn" :disabled="qo.$cd < 0" @click="onBtnOrder('SELL')">
				<span>{{sp}}</span>
				<span>{{$ln('卖出')}}</span>
			</Button>
			<Button class="btn btn-sell flex-1 flex-col bgc-dn" :disabled="qo.$cd < 0" @click="onBtnOrder('SELL', {'ORDER_TYPE': 'MARKET', 'price': 0})">
				<span>{{$ln('市价')}}</span>
				<span>{{$ln('卖出')}}</span>
			</Button>
		</div>
    </div>
</template>

<script>
import CommonInput from "@/components/Framework/CommonInput.vue"
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ["suspend"],
	data() {
		return {
			symbolText: '',
			orderPrice: 0,
			orderQty: 1,
			flag:'',
			value:'',
			sp:'',
			bp:'',
			defaultInputPrice: '',
			orderConfirm: 1,
			qo: {},
        }
	},
	beforeMount() {
		eventBus.$on('FLAG-PRICE-CHANGE',(f)=>{ this.flag=f; });
		eventBus.$on('PRICE-CHANGE',(v)=>{ this.value=v; });
		// 商品連動
		eventBus.$on('SYMBOL-CHANGE', (sid)=>{
			this.changeSymbol(sid);
		});
	},
	computed:{
		sid() {return this.$store.state.selectedSymbol.ID;},
		// 用以 watch 指定 object.key 辦法
		qop() {
			return this.qo.p;
		}
	},
	mounted() {
		this.orderConfirm = localStorage.getItemOrg(`${window.projectID}_ORDERCONFIRM`) != null? localStorage.getItemOrg(`${window.projectID}_ORDERCONFIRM`) : 1;
		this.changeSymbol(this.sid);
    },
	components: {
		CommonInput,
	},
    methods: {
		// 商品連動
		changeSymbol: function(newSid, orgSid) {
			// 更新商品名稱
			let minfo = M4C.Symbol.getMainformInfo(newSid);
			let ids = newSid.split('.');
			let langCode = this.$store.getters.getMainformLangKey;
			this.symbolText = `${minfo.Name[langCode]} ${minfo.Symbol} ${ids[ids.length-1].substr(2)}`;
			this.qo = M4C.Quote.getQuoteObject(newSid);
			// 更新價格Input
			this.defaultInputPrice = this.qo.p || '';
		},
		showMsg:function(obj){
			let msg = `組件 ${obj.cid} 輸入已改為 : ${obj.value}`;
			// eventBus.$emit("FLASHMESSAGE", msg);
		},
		// 點擊下單按鈕
		onBtnOrder: function(bs, orderObj) {
			orderObj = orderObj || this.$refs.price.getValue(bs);
			let orderInfo = {
				'ACTION': 'NEW',			// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.sid,
				'SIDE': bs,					// 買BUY/賣SELL
				'POSITION_EFFECT': 'AUTO',	// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'ORDER_TYPE': orderObj.ORDER_TYPE,		// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': 'ROD',		// ROD/IOC/FOK
				'ORDER_PRICE': orderObj.price,
				'ORDER_QTY': this.$refs.volumn.getValue(),
			};

			//是否跳出確認視窗
			if(this.orderConfirm){
				// 提示确认视窗
				let priceText = orderObj.price == 0 ? this.$ln('市价') : orderObj.price;
				let bsText = bs=="BUY" ? this.$ln('买进') : this.$ln('卖出');
				eventBus.$emit("CONFIRM-DIALOG", {
					title: `${ M4C.Symbol.getCNM4(this.sid)}`,
					content: `${priceText}, ${bsText} ${orderInfo.ORDER_QTY} ${this.$ln('手')}`,
					confirm: () => {
						M4C.Order.sendOrder(orderInfo);
					}
				});
			}
			else{
				M4C.Order.sendOrder(orderInfo);
			}
		},
		/** 搜尋圖示按鈕 */
		onBtnSearch() {
			eventBus.$emit('POPUP-DIALOG', 'Search');
		}
	},
	watch: {
		sid: function(nv, ov) {
			this.changeSymbol(nv, ov);
		},
		// 監看 qo.p 若從 無值->有值時，刷新 [價格Input]
		qop(nv, ov) {
			if (!ov && nv) {
				this.defaultInputPrice = this.qo.p;
			}
		}
	},
}
</script>

<style scoped>
.simple-order-ctn {
	padding: 10px;
	border-radius: 10px;
	background-color: #222;
}
.symbol-name-ctn {
	margin-bottom: 5px;
}
.nbs-ctn {
	min-width: 120px;
	text-align: right;
}
.nbs-ctn table {
	height: 100%;
}
.btn {
	margin: 10px 6px 0 6px;
	padding: 2px !important;
}
.btn.btn-buy {
	background-color: #E51C23;
}
.btn.btn-close {
	color: black;
	background-color: white;
}
.btn.btn-sell {
	background-color: #259B24;
}
.sheets-ipt{
	width: 120px;
}
</style>