<template>
    <div ref="ctn" class="report-card-ctn flex-col report-card" v-press="onPress" v-waypoint="{active: true, callback: onWaypoint}" 
		:class="{hiLight: hiLight}">
    	<div class="flex-row pdtb2" v-if="visibility">
			<div class="cell0 flex-top checked-btn"
				@click.stop="onBtnChecked" @touchstart.stop="" @touchend.stop="">
				<i class="material-icons" :class="{'disable': disabled}">{{checked ? "check_box" : "check_box_outline_blank"}}</i>
			</div>
			<div class="flex-col flex-1 report-card-container">
				<div class="flex-col flex-1 report-card-content tcend" @click="onCardClick" >
					<div class="flex-row pdtb1">
						<!-- 更新時間 -->
						<div class="flex-vertical-center update-time pdr4">{{rpt.$UPDATE_TIME}}</div>
						<!-- 委託類型 #編號 -->
						<div class="flex-1 flex-vertical-center">{{orderTypeText}} {{!isNaN(rpt.$INDEX)? `#${rpt.$INDEX}`: ''}}</div>
						<!-- 出場委託類型SP、SL、TS -->
						<div class="cell4 flex-end flex-row font-size-micro">
							<span class="bgc-sp clr-white rd3 pdlr3 mgr1" :class="{'disabled': !isSP}">SP</span>
							<span class="bgc-sl clr-white rd3 pdlr3 mgr1" :class="{'disabled': !isSL && !isTS}">{{isTS? 'TS': 'SL'}}</span>
						</div>
					</div>
					<!-- 委託資訊(進場) -->
					<div class="flex-row flex-center" :class="{'clr-gray': !rpt1Status}">
						<!-- 買賣方向 -->
						<div class="cell1 flex-top-left h100p" :class="{'clr-up': rpt1Side == 'BUY', 'clr-dn': rpt1Side == 'SELL'}">
							{{rpt1Side == 'BUY'? $ln('买'): $ln('卖')}}
						</div>
						<div class="flex-1 flex-col flex-top" v-html="orderConditionText(rpt1)" />
						<div class="cell2 flex-top flex-row">
							<!-- 委 -->
							<span>{{rpt.$ORDER_QTY || 0}}</span>
							<span>/</span>
							<!-- 成 -->
							<span>{{rpt1Status? rpt.CUM_QTY || 0: 0}}</span>
							<span>/</span>
							<!-- 撤 -->
							<span>{{rpt1Status? rpt.$REMOVED_QTY || 0: rpt.$ORDER_QTY}}</span>
						</div>
						<div class="cell1" />
						<div class="cell3 flex-end">
							<span class="nowrap" :class="rpt1Status? getStatusClass(rpt): 'clr-gray'">{{$ln(rpt1Status? rpt.$STATUS: "已删单")}}</span>
						</div>
					</div>
					<div class="flex-row flex-center" v-if="rpt2" :class="{'clr-gray': !rpt2Status}">
						<!-- 買賣方向 -->
						<div class="cell1 flex-top-left h100p" :class="{'clr-up': rpt2Side == 'BUY', 'clr-dn': rpt2Side == 'SELL'}">
							{{rpt2Side == 'BUY'? $ln('买'): $ln('卖')}}
						</div>
						<div class="flex-1 flex-col flex-top" v-html="orderConditionText(rpt2)" />
						<div class="cell2 flex-top flex-row">
							<!-- 委 -->
							<span>{{rpt.$ORDER_QTY || 0}}</span>
							<span>/</span>
							<!-- 成 -->
							<span>{{rpt2Status? rpt.CUM_QTY || 0: 0}}</span>
							<span>/</span>
							<!-- 撤 -->
							<span>{{rpt2Status? rpt.$REMOVED_QTY || 0: rpt.$ORDER_QTY}}</span>
						</div>
						<div class="cell1" />
						<div class="cell3 flex-end">
							<span class="nowrap" :class="rpt2Status? getStatusClass(rpt): 'clr-gray'">{{$ln(rpt2Status? rpt.$STATUS: "已删单")}}</span>
						</div>
					</div>
				</div>
				<subReportCard v-for="(rpt, key) in runningRptList" :key="key" :runningRpt="rpt"/>
			</div>
		</div>
    </div>
</template>

<script>
import ReportCardFn from '@/components/ReportCardFn'
import ReportCardDetail from '@/components/ReportCardDetail';
import subReportCard from '@/components/Thunder/subReportCard.vue';
export default {
    mixins: [ReportCardFn],
	props: ["rpt", "deleteCheckList", "suspend", "subOrderMapList"],
	data() {
		return {
			checked: false,
			lightUp: false,
			visibility: false,
			runningRptCondition: "",
			running1Condition: "",
			running2Condition: "",
			rptCondition: "",
        }
	},
	beforeMount() {
		this.qo = M4C.Quote.getQuoteObject(this.sid);
		if(this.rpt.SMO)
			this.rptCondition = this.rpt.SMO.CONDITION;
	},
    methods: {
		/** 勾選圖示 */
		onBtnChecked() {
			if(this.disabled) return;
			let list = [];
			// 母單還有有效量時加入勾選清單
			if(this.rpt.$AVAILABLE_QTY > 0) list.push(this.currentKey);
			// 有子單時，子單尚有有效量時加入勾選清單
			if(this.runningRptList) {
				this.runningRptList.forEach(r=>{
					if(r.$AVAILABLE_QTY > 0)
						list.push(r.key)
				});
			}
			this.$emit("onChecked", list);
		},
		/** 長按彈出簡易下單盒 */
		onPress() {
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		// 智慧單觸發條件
		smoConditionText(rpt) {
			let marketText = rpt.ORDER_TYPE === 'RANGED'? this.$ln("一定范围市价"): this.$ln("市价");
			let orderPrice = rpt.$ORDER_PRICE_TXT || this.showPrice(rpt.ORDER_PRICE || marketText);
			let orderText = `<span>${this.$ln('委')} ${orderPrice}</span>`;
			switch(rpt.TC_ORDER_TYPE) {
				case "STOP":
				case "STPLMT":
					return `<span>${this.$ln('停')} ${this.showPrice(rpt.$CONDITION_VALUE_NOR || rpt.STOP_PRICE)}</span>${orderText}`;
				case "MIT":
				case "LIT":
					return `<span>${this.$ln('触')} ${this.showPrice(rpt.$CONDITION_VALUE_NOR || rpt.TOUCH_PRICE)}</span>${orderText}`;
				case "TSTOP":
				case "TSTPLMT":
					// 有算出觸發價時直接顯示
					if(rpt.$CONDITION_VALUE_NOR)
						// 調整觸發價優先取server提供的TRAILING_INITIAL資料(因TW要求顯示初始觸發價)，沒有才取計算後的值
						return `<span>${this.$ln('移')} ${this.showPrice(this.$TRAILING_INITIAL || rpt.$CONDITION_VALUE_NOR)}</span>${orderText}`;
					else
						return `<span>${this.$ln('移')} ${this.$ln('回撤')} ${rpt.TRAILING_VALUE} ${rpt.TRAILING_TYPE !== 'GUARANTEE'? this.$ln('档'): ''}</span>${orderText}`;
				default:
					break;
			}
		},
		// 委託類型文字
		orderConditionText(rpt) {
			if (this.rpt.MARKET_WATCH){
				return this.showPrice(rpt.ORDER_PRICE || this.$ln('市价'));
			}
			// SMO
			if (rpt.$IS_SMO || rpt.SMO)
				return `<span class='flex-col'>${this.smoConditionText(rpt)}</span>`;
			// 一般委托单
			switch(rpt.TC_ORDER_TYPE) {
				case "MARKET":
					return this.$ln("市价");
				case "LIMIT":
					return this.showPrice(rpt.ORDER_PRICE);
				case "HIT":
					return this.$ln("对手价");
				case "JOIN":
					return this.$ln("本方价");
				case "MWP":
					return this.$ln("一定范围市价");
				default:
					break;
			}
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// console.log(`QuoteCard.onWaypoint`, this.sid, going, direction);
			this.visibility = going === "in";
		},
		showPrice(val) {
			if(isNaN(val)) return val;
			return this.$symbolPriceX({sid: this.sid, val: Number(val), fillDecimal: true});
		},
		onCardClick() {
			eventBus.$emit('POPUP-DIALOG', ReportCardDetail, {'rpt': this.rpt}, {transName: 'float'});
		},
	},
	components: {subReportCard},
	watch: {
		// 上層帶來的 DeleteCheckList 改變時，檢查自己是否應該勾選
		deleteCheckList: {
			handler(nv) {
				let rptCheck = nv.indexOf(this.currentKey) != -1;
				let subCheck = this.runningRptList? this.runningRptList.find(rpt=>{
					return nv.indexOf(rpt.key) != -1;
				}): false;
				this.checked = rptCheck || subCheck;
			}, deep: true
		},
		"rpt.REPORT_KEY.status" (nv) {
			if(this.rpt.SMO)
				// 設定洗價單控制資料
				this.rptCondition = this.rpt.SMO.CONDITION;
		},
	},
	computed: {
		// 當前委託的編號，有子委託用子委託的。
		currentKey() {
			return this.rpt.key;
		},
		// 委託單第一邊
		rpt1(){
			// 如果是OCO，以SERVER給的SMO內容來處理
			if(this.rpt.$IS_OCO && this.rpt.SMO) {
				// 附加觸發價到OCO內
				this.$set(this.rpt.SMO.OCO[0], '$CONDITION_VALUE_NOR', this.rpt1TrgPrice);
				// 附加SERVER的SMO物件到OCO內
				this.$set(this.rpt.SMO.OCO[0], 'SMO', this.rpt.SMO.OCO[0].SMO);
				return this.rpt.SMO.OCO[0];
			}
			else return this.rpt;
		},
		rpt1Side() {
			return this.rpt1.SIDE;
		},
		// 委託單第一邊觸發價
		rpt1TrgPrice() {return this.rpt.$CONDITION_VALUE_NOR;},
		// 委託單第二邊
		rpt2(){
			if(this.rpt.$IS_OCO && this.rpt.SMO) {
				this.$set(this.rpt.SMO.OCO[1], '$CONDITION_VALUE_NOR', this.rpt2TrgPrice);
				this.$set(this.rpt.SMO.OCO[1], 'SMO', this.rpt.SMO.OCO[0].SMO);
				return this.rpt.SMO.OCO[1];
			}
		},
		rpt2Side() {
			if(this.rpt2)
				return this.rpt2.SIDE;
		},
		// 委託單第二邊觸發價
		rpt2TrgPrice() {return this.rpt.$CONDITION_VALUE2_NOR;},
		// 委託單第一邊狀態(非成交邊回傳false)
		rpt1Status(){
			return this.rpt.$TOUCHED_SIDE? this.rpt.$TOUCHED_SIDE == 1: true;
		},
		// 委託單第二邊狀態(非成交邊回傳false)
		rpt2Status(){
			return this.rpt.$TOUCHED_SIDE? this.rpt.$TOUCHED_SIDE == 2: true;
		},
		runningRptList() {
			if(this.subOrderMapList)
				return this.subOrderMapList[this.rpt.ORDER_ID];
		},
		// 委託單類型文字
		orderTypeText() {
			if (this.rpt.IS_HOMOTO)
				return this.$ln("保本单");
			// OCO
			if (this.rpt.$IS_OCO){
				return this.$ln(`止损止盈OCO`);
			}
			// 先平再開(反手)
			if( (this.rpt.POSITION_EFFECT == "CLOSE") && (this.rpt.SUB_ORDER && this.rpt.SUB_ORDER.POSITION_EFFECT == "OPEN")){
				return this.$ln("反手");
			}
			// 觸A下B
			if (this.rpt.MARKET_WATCH){
				return this.$ln(`觸A下B`);
			}			
			// 其他智慧單、一般單。
			if(this.rpt.TC_ORDER_TYPE)
				return this.$ln(this.$store.state.config.mapOrderTypeLabel[this.rpt.TC_ORDER_TYPE]);
		},
		// 委託商品代碼
		sid() {
			return this.rpt.SYMBOL || this.rpt.OCO[0].SYMBOL;
		},
		propDeleteCheckList() {
			return this.deleteCheckList;
		},
		// 依有效量判斷是否可用(母子委託的有效量加總大於0)
		disabled() {
			let sumQty = this.rpt.$AVAILABLE_QTY;
			if(this.runningRptList) {
				let qty = 0;
				this.runningRptList.forEach(rpt => {
					qty += rpt.$AVAILABLE_QTY;
				});
				sumQty += qty;
			}
			return sumQty == 0;
		},
		// 子委託單設定資料。
		subOrder() {
			// 進場OCO單
			if(this.rpt.$IS_OCO) return this.rpt.OCO[0].SUB_ORDER;
			// 其他單
			return this.rpt.SUB_ORDER;
		},
		// 子委託OCO
		protectOCO() {return this.subOrder && this.subOrder.OCO? this.subOrder.OCO: ""},
		// 子委託OCO第一邊觸價條件
		protectOCO_CONDITION1() {return this.protectOCO? this.protectOCO[0].TC_ORDER_TYPE: ""},
		// 子委託OCO第二邊觸價條件
		protectOCO_CONDITION2() {return this.protectOCO? this.protectOCO[1].TC_ORDER_TYPE: ""},
		// 出場止盈單判斷
		isSP() {
			let result = false;
			let spMapList = ['MIT', 'LIT'];
			if(!this.subOrder) return result;
			if(this.protectOCO){
				result = spMapList.indexOf(this.protectOCO_CONDITION1) != -1 || spMapList.indexOf(this.protectOCO_CONDITION2) != -1;
			}
			else if(this.subOrder){
				result = spMapList.indexOf(this.subOrder.TC_ORDER_TYPE) != -1;
			}
			return result;
		},
		// 出場止損單判斷
		isSL() {
			let result = false;
			let slMapList = ['STOP', 'STPLMT', 'TSTOP', 'TSTPLMT'];
			if(!this.subOrder) return result;
			if(this.protectOCO){
				result = slMapList.indexOf(this.protectOCO_CONDITION1) != -1 || slMapList.indexOf(this.protectOCO_CONDITION2) != -1;
			}
			else if(this.subOrder){
				result = slMapList.indexOf(this.subOrder.TC_ORDER_TYPE) != -1;
			}
			return result;
		},
		// 出場移動停損單判斷
		isTS() {
			let tsMapList = ['TSTOP', 'TSTPLMT'];
			if(!this.subOrder) return false;
			if(this.protectOCO){
				return tsMapList.indexOf(this.protectOCO_CONDITION1) != -1|| tsMapList.indexOf(this.protectOCO_CONDITION2) != -1;
			}
			else if(this.subOrder)
				return tsMapList.indexOf(this.subOrder.TC_ORDER_TYPE) != -1;
		},
		// 移動停損觸發價(初始價格由server提供)
		$TRAILING_INITIAL() {try {return this.rpt.SMO.TRAILING_INITIAL;}catch(e){}},
		$symbolPriceX() {return this.$store.state.fn.$symbolPriceX;},
	}
}
</script>

<style scoped>
.report-card-ctn .disable {
	pointer-events: none;
	color: gray;
}
.report-card-ctn {
	min-height: 65px;
	border-bottom: 1px solid #666;
}
.report-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
	padding-right: 2vw;
}
.checked-ctn {
	padding: 2vw;
}
/* 委託狀態 */
.status-ctn {
	color: white;
	border-radius: 1.5vw;
	padding: 0 1vw;
}
.SL-icon{
	width: 1em;
	height: 1em;
	border-radius: 50%;
}
.SP-icon{
	width: 1em;
	height: 1em;
	border-radius: 50%;
}
.bgc-sp {background-color: #3399FF;}
.bgc-sl {background-color: #9933FF;}
</style>