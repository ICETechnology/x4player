<!-- 策略下單盒 - 下方委託條件總成 -->
<template>
    <div class="plot-order-condition-ctn flex-col" :class="{'pad': $store.state.device.isPad}">
		<div class="overflow-y-auto">
			<table class="font-size-small">
				<tr><td class="clr-gray2 font-size-mini" colspan="2">{{$ln('委托条件')}}</td></tr>
				<tr>
					<td class="w50p pdb1">
						<!-- ROD/IOC/FOK -->
						<SingleSelect class="flex-1" :options="timeInForceOptList" v-model="timeInForce" />
					</td>
					<td class="w50p pdb1">
						<!-- 仓别 -->
						<SingleSelect class="flex-1" :options="positionEffectOptList" v-model="positionEffect" />
					</td>
				</tr>
				<tr >
					<td class="h100p flex-row">
						<!-- 1. 直接輸入價差 -->
						<InputPrice class="w100p" v-if="!checkMarket && !checkFollow" :largeSize="true" v-model.number="inputPrice" :label="$ln('價差')" :propSid="gv.contract1.sid" />
						<!-- 2. 勾選市價 -->
						<div v-if="checkMarket" class="flex-1 h100p flex-row">
							<div class="mgr2 flex-center">{{$ln('價差')}}</div>
							<div class="flex-1 price-ctn flex-center pdlr2">{{$ln('市價')}}</div>
						</div>
						<!-- 3. 勾選取價 -->
						<div v-if="checkFollow" class="flex-1 h100p flex-row">
							<div class="mgr2 flex-center">{{$ln('價差')}}</div>
							<div class="flex-1 price-ctn flex-center pdlr2 font-bold font-size-large">{{followPrice}}</div>
						</div>
					</td>
					<td class="h100p">						
						<!-- 數量 -->
						<InputQty :step="step" :largeSize="true" v-model="inputQty" :label="$ln('手数')"/>
					</td>
				</tr>
				<tr>
					<td colspan="2" >
						<div class="flex-row flex-start pdt2">
							<CheckBox v-model="checkMarket" class="flex-1" :class="{'disable-ui':checkIOC}">{{$ln('市價')}}</CheckBox>
							<CheckBox v-model="checkFollow" v-if="!isUserDefine" class="flex-1" :class="{'disable-ui':checkIOC}">{{$ln('取價')}}</CheckBox>
							<CheckBox v-model="checkIOC" v-if="!isUserDefine && showContinuousIOC && showContinuousIOCCheckbox" class="flex-2" :class="{'clr-opt-blue':checkIOC}" >{{ checkIOC? $ln('連續IOC') : $ln('加入連續IOC') }}</CheckBox>
						</div>
					</td>
				</tr>
			</table>
		</div>
		<div class="flex-1 font-size-small">
			<div v-if="checkIOC" class="flex-col">
				<div class="flex-row flex-1">
					<div class="flex-1 mgr4">
						<div class="mgtb1">連續IOC觸發條件</div>	
						<div class="flex-row">
							<div class="flex-1 flex-start">條件</div>
							<SingleSelect :btnClass="'clr-pink'" class="flex-2 font-bold" :options="IOCConditionList" v-model="IOCCondition" />
						</div>						
					</div>
					<div class="flex-1">
						<div class="mgtb1">價差/價和點數</div>	
						<div class="flex-row">
							<InputPrice :inputClass="'clr-pink'" :largeSize="true" :maxlength="7" v-model.number="IOCTriggerPrice" :label="$ln('價差')"/>
						</div>	
					</div>
				</div>
				<div class="flex-row mgt2">
					<div class="flex-1 flex-start">觸價時，</div>
					<SingleSelect :btnClass="'clr-pink'" class="flex-4 font-bold" :options="orderTypeList" v-model="orderType" />
				</div>	
			</div>		
		</div>
		<!-- 取消與確認按鈕 -->
		<div class="mgt1 mgb4 flex-row flex-center">
			<Button class="btn-confirm mgr3 dark" @click="onBtnBack">{{$ln("取消")}}</Button>
			<Button class="btn-confirm mgl3" v-if="param.editIOC" @click="onBtnEditContiIOC">{{$ln("修改條件")}}</Button>
			<Button class="btn-confirm mgl3 bg-opt-blue" v-else-if="checkIOC" @click="onBtnAddContiIOC">{{$ln("加入連續IOC")}}</Button>
			<Button class="btn-confirm mgl3" v-else @click="onBtnOrder">{{$ln("送出委托")}}</Button>
		</div>
    </div>
</template>

<script>
import PriceRadioQtyBtn from "@/components/PriceRadioQtyBtn.vue";

export default {
	props: ["selectedStrategy", "contracts", "closedPrice", "gv", "param"],
	data() {
		return {
			// 價差價格
			inputPrice: 0,
			/** 委託量 */
			inputQty: 1,
			/** 倉別 */
			positionEffect: "OPEN",
			/** 效期別 */
			timeInForce: "IOC",
			/** 委託倉別選項 */
			positionEffectOptList: [
				{label: `自动`, value: "AUTO"},
				{label: `开仓`, value: "OPEN"},
				{label: `平仓`, value: "CLOSE"},
				// {label: `平今`, value: "CTD"},
				// {label: `平昨`, value: "CYD"},
				// {label: `备开`, value: "CWO"},
				// {label: `备平`, value: "CWC"},
			],
			// IOC觸發條件
			IOCCondition:'<=',
			// 連續IOC觸發條件選單
			IOCConditionList:[
				{label:`小於等於`,value:"<="},
				{label:`大於等於`,value:">="},
			],
			// IOC 價差/價和點數
			IOCTriggerPrice: 0,
			// IOC送出委託選單
			orderTypeList:[
				{label:`以價差/價和點數送出委託`, value: 'LIMIT'},
				{label:`以市價送出委託`, value: 'MARKET'}
			],
			// IOC送出委託方式
			orderType: 'LIMIT',
			// 勾選市價
			checkMarket: false,
			// 勾選取價 
			checkFollow: false,
			// 勾選加入連續IOC
			checkIOC: false,
		}
	},
	beforeMount() {
		this.checkIOC = this.param.checkIOC;
		if(this.param.item){
			this.IOCCondition = this.param.item.CONDITION;
			this.IOCTriggerPrice = this.param.item.TRIGGER_PRICE;
			this.IOCSend = this.param.item.IOCSend;
			this.positionEffect = this.param.item.POSITION_EFFECT;
			this.timeInForce = this.param.item.TIME_IN_FORCE;
			this.orderType = this.param.item.ORDER_TYPE;
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		PriceRadioQtyBtn,
	},
    methods: {
		onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onBtnOrder() {
			// 跳出確認視窗
			if (this.$store.state.order.confirm){
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {multiOption: true, orderInfo: this.orderInfo}, {transName: 'float'});
			}
			// 直接送出下單
			else {
				M4C.Order.sendOrder(this.orderInfo);
				eventBus.$emit("CLOSE-FLOAT-DIALOG");
			}
		},
		onBtnAddContiIOC() {
			const orderInfo = {...this.iocOrderInfo};

			M4C.ContinuousIOC.addContiIOC(orderInfo);
		},
		onBtnEditContiIOC(){
			let orderInfo = {...this.iocOrderInfo};
			orderInfo.CIOC_ID = this.param.item.CIOC_ID;

			M4C.ContinuousIOC.updateContiIOC(orderInfo);
		},
		// 時間價差判斷的條件
		stDiffTimeCondition(){
			// 以遠月合約做為判斷，買賣別為買時則預設為 <= ，買賣別為賣時則預設為 >=
			let mth1 = this.gv.contract1.mth;
			let mth2 = this.gv.contract2.mth;
			let side1 = this.selectedStrategy.BS1;
			let side2 = this.selectedStrategy.BS2;
			// 預設是大於等於
			this.IOCCondition = '>=';
			// 組合為相同月份合約則預設為大於等於
			if(mth1.substring(0,6) == mth2.substring(0,6)) {
				// 組合為當月週選&當月合約
				if(mth1[7] && !mth2[7]){
					if(mth1[7] === "1" ||mth1[7] === "2")
						this.IOCCondition = side2 === "B" ? '<=': '>=';
					else if(mth1[7] === "4" ||mth1[7] === "5")
						this.IOCCondition = side1 === "B" ? '<=': '>=';
				}else if(!mth1[7] && mth2[7]){
					if(mth2[7] === "1" ||mth2[7] === "2")
						this.IOCCondition = side1 === "B" ? '<=': '>=';
					else if(mth2[7] === "4" ||mth2[7] === "5")
						this.IOCCondition = side2 === "B" ? '<=': '>=';
				}
				// 兩個都有周選，比較周選大小
				else if(mth1[7] && mth2[7]){
					// 比較月份
					if(mth1[7] > mth2[7])
						this.IOCCondition = side1 === "B" ? '<=': '>=';
					else if(mth1[7] < mth2[7])
						this.IOCCondition = side2 === "B" ? '<=': '>=';
				}				
			}else if(mth1.substring(0,6) > mth2.substring(0,6))
				this.IOCCondition = side1 === "B" ? '<=': '>=';
			else if(mth2.substring(0,6) > mth1.substring(0,6))
				this.IOCCondition = side2 === "B" ? '<=': '>=';
		}
	},
	watch: {
		// 切換勾選市價
		checkMarket(nv) {
			if (nv) this.checkFollow = false;
		},
		// 切換勾選取價
		checkFollow(nv) {
			if (nv){ 
				this.checkMarket = false;
			};
		},
		'selectedStrategy.key'(nv){
			switch(nv){
				case 'BullCallSpread':
				case 'BuyStraddles':
				case 'BuyStrangles':
				case 'Conversions':
				case 'BearPutSpread':
					this.IOCCondition = '<=';
					break;
				case 'BullPutSpread':
				case 'BearCallSpread':
				case 'SellStraddles':
				case 'SellStrangles':
				case 'Reversals':
					this.IOCCondition = '>=';
					break;
				case 'StDiffTime':
					this.stDiffTimeCondition();
					break;
				case 'UserDefine':
					this.checkIOC = false;
					this.checkFollow = false;
				default:
					this.IOCCondition = '<=';
			}
			setTimeout(()=>{				
				this.IOCTriggerPrice = this.param.from == "ContiIOC"? this.param.item.TRIGGER_PRICE: this.followPrice;
			},0);			
		},		
		checkIOC:{
			handler(nv){
				if(nv){
					this.checkFollow = true;
					this.IOCTriggerPrice = this.param.from == "ContiIOC"? this.param.item.TRIGGER_PRICE: this.followPrice;
				}
			},
			deep: true
		},
		'gv.contract1.mth'(nv){
			this.stDiffTimeCondition();
		},
		'gv.contract2.mth'(nv){
			this.stDiffTimeCondition();
		},
		'selectedStrategy.BS1'(nv){
			// 在這邊用來判斷直接價差策略的條件，因為時間價差策略的買賣別必定相反，所以判斷一邊就好，避免重複計算
			this.stDiffTimeCondition();
		},
	},
    computed: {
		symbolName() {
			return M4C.Symbol.getContractName(this.gv.contract1.sid);
		},
		// 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
		// 期權手數跳數
		step() {return this.$store.state.order.optQty;},
		/** 委託單 */
		orderInfo() {
			return {
				'ACTION': 'NEW',											// 新單NEW/改單REPLACE(改量REDUCE/改價REPRICE)/刪單CANCEL
				'SYMBOL': this.gv.contract1.sid,
				'SYMBOL2': this.gv.contract2.sid,
				'SIDE': this.selectedStrategy.BS1==="B" ? "BUY" : "SELL",	// 買BUY/賣SELL
				'SIDE2': this.selectedStrategy.BS2==="B" ? "BUY" : "SELL",	// 買BUY/賣SELL
				'POSITION_EFFECT': this.positionEffect,						// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TC_ORDER_TYPE': this.checkMarket ? 'MARKET' : 'LIMIT',		// 市價單MARKET/限價單LIMIT/對手價OPPOSITE
				'TIME_IN_FORCE': this.timeInForce,							// ROD/IOC/FOK
				'ORDER_PRICE': isNaN(this.orderPrice) ? 0 : Number(this.orderPrice),
				'ORDER_QTY': parseFloat(this.inputQty),
				'AP_PLUGIN': this.useComName || this.selfComName,
			};
		},
		// 連續IOC的委託單
		iocOrderInfo(){
			return {
				'SYMBOL': this.gv.contract1.sid,
				'SYMBOL2': this.gv.contract2.sid,
				'SIDE': this.selectedStrategy.BS1==="B" ? "BUY" : "SELL",	// 買BUY/賣SELL
				'SIDE2': this.selectedStrategy.BS2==="B" ? "BUY" : "SELL",	// 買BUY/賣SELL
				'POSITION_EFFECT': this.positionEffect,						// 新倉OPEN/平倉CLOSE/自動AUTO/當沖DAYTRADE/CTD平今/CYD平昨
				'TIME_IN_FORCE': this.timeInForce,							// ROD/IOC/FOK
				'ORDER_TYPE': this.orderType,								// 市價單MARKET/限價單LIMIT
				'ORDER_PRICE': String(this.IOCTriggerPrice),
				'CONDITION': this.IOCCondition,								//IOC下單條件
				'TRIGGER_PRICE': String(this.IOCTriggerPrice),              //IOC觸發條件
				'QTY': parseFloat(this.inputQty),                           
				'USER_DATA': { LABEL: `${this.symbolName} - ${this.$ln(this.selectedStrategy.label)}`},
			};
		},
		/** 效期別選項 */
		timeInForceOptList() {
			let list = [];
			list.push({label: this.$ln('OPTION-IOC', 'IOC'), value: "IOC"});
			list.push({label: this.$ln('OPTION-FOK', 'FOK'), value: "FOK"});
			return list;
		},
		// 自動取價價格
		followPrice() {
			let price1 = this.gv.contract1.oppositePrice || 0;
			let price2 = this.gv.contract2.oppositePrice || 0;
			switch(this.selectedStrategy.key) {
				// 遠月對手價權利金 - 近月對手價權利金
				case 'StDiffTime':		// 時間價差
					// 非週選時組合 W3 進去比大小 (順序是 W1>W2>X月>X4>X5)
					let mth1 = `${this.gv.contract1.mth}${this.gv.contract1.mth.length===6?'W3':''}`;
					let mth2 = `${this.gv.contract2.mth}${this.gv.contract2.mth.length===6?'W3':''}`;
					return +Big(price1).minus(price2).times(mth1 > mth2 ? 1 : -1);
				// 較低履約價權利金 - 高履約價權利金
				case 'BullCallSpread':	// 多頭價差(C)
				case 'BearCallSpread':	// 空頭價差(C)
					return +Big(price1).minus(price2).times(Number(this.gv.contract1.strike) > Number(this.gv.contract2.strike) ? -1 : 1);
				// 較高履約價權利金 - 低履約價權利金
				case 'BullPutSpread':	// 多頭價差(P)
				case 'BearPutSpread':	// 空頭價差(P)
					return +Big(price1).minus(price2).times(Number(this.gv.contract1.strike) > Number(this.gv.contract2.strike) ? 1 : -1);
				// 腳1履約價權利金 + 腳2履約價權利金
				case 'BuyStraddles':	// 買進跨式
				case 'SellStraddles':	// 賣出跨式
				case 'BuyStrangles':	// 買進勒式
				case 'SellStrangles':	// 賣出勒式
					return +Big(price1).plus(price2);
				// PUT腳位的權利金 - CALL腳位的權利金
				case 'Conversions':		// 轉換
				case 'Reversals':		// 逆轉
					return +Big(price1).minus(price2).times(this.selectedStrategy.CP1 === 'P' ? 1 : -1);
			}
		},
		// 委託價格
		orderPrice() {
			if (this.checkMarket)
				return 0;
			else if (this.checkFollow)
				return this.followPrice;
			else
				return this.inputPrice;
		},
		// 顯示連續IOC功能
		showContinuousIOC(){
			try {return this.$store.state.config.CONFIG.ContinuousIOC.showContinuousIOC} catch (error) {};
		},
		// 可由公開設定決定支援連續IOC的合約
		showContinuousIOCList(){
			try {return this.$store.state.config.CONFIG.ContinuousIOC.showContinuousIOCList} catch (error) {return []};
		},
		// 目前的合約，因為台指有周選的問題，將統一為 TXO 
		fullName(){
			let name = this.$store.state.selectedSymbol.MInfo['full-name'];
			const TWFarr = ['I.O.TWF.TX1', 'I.O.TWF.TX2', 'I.O.TWF.TX3', "I.O.TWF.TX4", "I.O.TWF.TX5"];
			name = TWFarr.includes(name)? "I.O.TWF.TXO" : name;
			return name;
		},
		// 公開設定支援連續IOC的list如果包含現在的合約，顯示嫁入連續IOC的checkbox
		showContinuousIOCCheckbox(){
			return this.showContinuousIOCList.includes(this.fullName)
		},
		// 是否為自訂策略
		isUserDefine(){
			return this.selectedStrategy.key == 'UserDefine';
		}
	},
}
</script>

<style scoped>
.btn-confirm {
	width: 38vw;
	height: 10vw;
	border-radius: 2vw;
	
}
.w50p {
	width: 50%;
}
.price-ctn {
	height: 9vw ;
	border: 1px solid #393939;
	border-radius: 1vw;
	color: #AAA;
	background-color: #2A2A2A;
}

/* for ipad 高度處理 */
.pad .radio-wrapper {
	height: 8vw;
}
.pad .btn-confirm, .pad .btn-cancel {
	height: 8vw;
	border-radius: 2vw;
}
.bg-opt-blue {
	background-color: #1f4990;
}
.clr-opt-blue{
	color:#4B83E0;
}
</style>