<template>
    <div ref="otmb" class="optiont-sp-ctn flex-center flex-col bgc-333" :month="this.month" @click="$emit('onClick')">
		<!-- 月份列 -->
		<OptionTMonthRow class="mth-line tr" :fakeMthHeadTarget="this" />
		<div v-if="monthExpand" class="flex-1 flex-col w100p">
			<!-- 履約價列表 -->
			<div ref="ottr" v-for="(obj, idx) in closedContractObjList" :key="`OptionTStrikePriceMonthBlock-${obj.sid}`" :sid="obj.sid"
				class="flex-1 tr flex-center flex-row bgc-head font-size-micro posr"
				:class="{'closed-strike-prev': obj.strike==closedStrikePrice, 'closed-strike-next': idx > 0 && closedContractObjList[idx-1].strike==closedStrikePrice,'font-size-big':$store.state.config.largeSize}">
				<!-- 持倉塊 (絕對定位) -->
				<div v-if="hasPositionBlock(obj, 'sidC') && !largeSize" class="position-block c" :class="positionBlockClass(obj, 'sidC')" :title="positionBlockTitle(obj, 'sidC')"></div>
				<div v-if="hasPositionBlock(obj, 'sidP') && !largeSize" class="position-block p" :class="positionBlockClass(obj, 'sidP')" :title="positionBlockTitle(obj, 'sidP')"></div>
				<!-- 持倉口數 (絕對定位) -->
				<div v-if="hasPositionBlock(obj, 'sidC') && twMode" class="position-count c" :class="[{'position-count-large font-bold font-size-small':largeSize},positioCountClass(obj, 'sidC')]" v-text="positionCountTitle(obj, 'sidC')"></div>
				<div v-if="hasPositionBlock(obj, 'sidP') && twMode" class="position-count p" :class="[{'position-count-large font-bold font-size-small':largeSize},positioCountClass(obj, 'sidP')]" v-text="positionCountTitle(obj, 'sidP')"></div>
				<div class="flex-1"></div>
				<!-- 履約價文字 -->
				<div class="pdt1">{{strikePrice(obj.strike)}}</div>
				<div class="flex-1 font-size-mini font-bold clr-orange">{{setPRIADJ(obj.sid)}}</div>
				<!-- 合約訂閱者 (用以控制進入可視後才訂閱，離開可視就解訂閱) -->
				<OptionTStrikeSuber class="suber" :obj="obj" :key="obj.sid"/>
			</div>
		</div>
    </div>
</template>

<script>
import PlotOrder from "@/components/PlotOrder/PlotOrder.vue";
import PlotOrderTW from "@/components/PlotOrderTW/PlotOrderTW.vue";
import OptionTMonthRow from "@/components/OptionT/OptionTMonthRow.vue";
import OptionTStrikeSuber from "@/components/OptionT/OptionTStrikeSuber.vue";

export default {
	props: ["month", "closedContracts", "contracts", "expand"],
	data() {
		return {
		}
	},
	components: {
		OptionTMonthRow,
		OptionTStrikeSuber,
	},
	mounted() {
		// 預設展開本月份
		if (this.monthExpand) {
			this.updateExpandMap(true);
			// 自動捲動置中 (計算並送出價平的 Top 位置)
			if (!this.isDesktop)
				setTimeout(this.emitClosedPrice, 100);
		}
	},
    methods: {
		/** 顯示用履約價 */
        strikePrice(val) {
			// 履約價包含小數位數 -> 小數需精準至標的物小數位數
			if (this.strikeContainDecimal)
				return Number(val).toFixed(this.underlyingTickSizeLength);
			else
				return Number(val);
		},
		setPRIADJ(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		/** 點擊月份列 -> 展開或收合列表 */
		onMonthClick(force) {
			console.log(`onMonthClick`);
			let key = this.expandMapKey;
			let val = !this.$store.state.opt.expandMap[key];
			this.updateExpandMap(val);
		},
		/** 展開或收合列表 */
		updateExpandMap(val) {
			let key = this.expandMapKey;
			if (val)
				this.$set(this.$store.state.opt.expandMap, key, val);
			else
				this.$delete(this.$store.state.opt.expandMap, key);
		},
		/** 點擊彈出策略下單 */
		popupPlotOrder() {
			event.stopPropagation();
			this.$store.state.opt.remainDays = this.remainDays;
			this.$store.commit("setSelectedSymbol", this.sid);
			eventBus.$emit("POPUP-DIALOG", this.plotOrderClass, {
				sid: this.sid,
				selectedMonth: this.month,
				contracts: this.contracts,
				closedPrice: this.contracts.closedPrice,
			});
		},
		/** 點擊自動捲動置中圖示 **/
		toClosedPrice() {
			event.stopPropagation();
			this.emitClosedPrice();
		},
		/** 自動捲動置中 (計算並送出價平的 Top 位置) */
		emitClosedPrice() {
			if (!this.$refs.ottr)
				return;
			let len = this.$refs.ottr.length;
			for (let i=1; i<len; i++) {
				let thisTr = this.$refs.ottr[i];
				let lastTr = this.$refs.ottr[i-1];
				let thisSP = Number(M4C.Option.getStrike(thisTr.getAttribute('sid')));
				let lastSP = Number(M4C.Option.getStrike(lastTr.getAttribute('sid')));
				// 找到價平列
				if ((thisSP >= this.closedPrice && lastSP < this.closedPrice) || 
					(thisSP < this.closedPrice && lastSP >= this.closedPrice)) {
					// 取比較低的(top比較大的)來進行垂直置中
					this.$emit("closedPriceTop", thisTr.offsetTop > lastTr.offsetTop ? thisTr.offsetTop : lastTr.offsetTop);
					return;
				}
			}
		},
		/** 此履約價是否顯示持倉塊 */
		hasPositionBlock(obj, sidCP) {
			let sid = obj[sidCP] = obj[sidCP] || (sidCP==='sidC' ? obj.sid : obj.sid.replace('.C.', '.P.'));
			return this.normalPositionSumMap[sid];
		},
		/** 此持倉塊樣式顏色 */
		positionBlockClass(obj, sidCP) {
			let sid = obj[sidCP] = obj[sidCP] || (sidCP==='sidC' ? obj.sid : obj.sid.replace('.C.', '.P.'));
			let psd = this.normalPositionSumMap[sid];
			if (psd.$NET_QTY > 0) return 'bgc-B';
			if (psd.$NET_QTY < 0) return 'bgc-S';
		},
		positionBlockTitle(obj, sidCP) {
			let sid = obj[sidCP] = obj[sidCP] || (sidCP==='sidC' ? obj.sid : obj.sid.replace('.C.', '.P.'));
			let psd = this.normalPositionSumMap[sid];
			if (psd.$NET_QTY > 0) return this.$ln('净权利仓') + Math.abs(psd.$NET_QTY) + this.$ln('张');
			if (psd.$NET_QTY < 0) return this.$ln('净义务仓') + Math.abs(psd.$NET_QTY) + this.$ln('张');
		},
		/** 此持倉口數樣式顏色 */
		positioCountClass(obj, sidCP) {
			let sid = obj[sidCP] = obj[sidCP] || (sidCP==='sidC' ? obj.sid : obj.sid.replace('.C.', '.P.'));
			let psd = this.normalPositionSumMap[sid];
			if (psd.$NET_QTY > 0) return 'clr-B';
			if (psd.$NET_QTY < 0) return 'clr-S';
		},
		positionCountTitle(obj, sidCP) {
			let sid = obj[sidCP] = obj[sidCP] || (sidCP==='sidC' ? obj.sid : obj.sid.replace('.C.', '.P.'));
			let psd = this.normalPositionSumMap[sid];
			if (psd.$NET_QTY > 0) return Math.abs(psd.$BQTY);
			if (psd.$NET_QTY < 0) return Math.abs(psd.$SQTY);
		}
	},
	watch: {
		/** 本月份展開 */
		monthExpand(nv) {
			if (nv) {
				// 自動捲動置中 (計算並送出價平的 Top 位置)
				setTimeout(this.emitClosedPrice, 100);
			}
		},
		closedPrice(nv, ov) {
			// 價平從無值至有值時，捲動置中
			if (!ov && nv) {
				// 自動捲動置中 (計算並送出價平的 Top 位置)
				setTimeout(this.emitClosedPrice, 100);
			}
		},
	},
    computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		isDesktop() {
			return this.$store.state.device.isDesktop;
		},
		sid() {
			return this.contracts && this.contracts.C ? this.contracts.C[0] : null;
		},
		/** 標的物合約代碼 */
		underlyingS() {
			return this.$store.state.opt.underlyingS;
		},
		/** 標的物市況物件 */
		underlyingSQO() {
			return this.$store.state.opt.underlyingSQO;
		},
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 標的物的價格 */
		underlyingSPrice() {
			let qoS = this.underlyingSQO;
			return qoS ? (qoS.p || qoS.r || qoS.pc) : 0;
		},
		/** 將傳入的 closedContracts 轉為方便使用的 object list */
		closedContractObjList() {
			if (this.closedContracts && this.closedContracts.C) {
				return this.closedContracts.C.map((sid)=>{
					return {
						sid: sid,
						strike: M4C.Option.getStrike(sid),
					}
				});
			}
			return [];
		},
		/** 履約價是否包含小數位數 */
		strikeContainDecimal() {
			let obj = this.closedContractObjList.find((obj)=>{
				return `${obj.strike}`.indexOf('.') !== -1;
			});
			return !!obj;
		},
		/** 標的物 TickSize 小數長度 */
		underlyingTickSizeLength() {
			return M4C.Symbol.getDecimalLength(this.underlyingS, this.underlyingSPrice);
		},
		/** 本 [商品+月份] 是否展開 */
		monthExpand() {
			let key = this.expandMapKey;
			return this.$store.state.opt.expandMap[key];
		},
		// 逾期日
		expireDate() {
			if (!this.sid) return;
			let contractInfo = M4C.Symbol.getContractInfo(this.sid);
			return contractInfo ? contractInfo.ExpirationDate : null;
		},
		// 剩餘日
		remainDays() {
			if (!this.expireDate) return "--";
			let expireTime = new Date().resetDate(this.expireDate).resetTime("000000");
			let todayTime = new Date().resetTime("000000");
			return Math.round((expireTime - todayTime) / 86400000);
		},
		/** [商品+月份] 是否展開的 Key */
		expandMapKey() {
			let contractID = this.underlyingS;
			let symbolID = contractID.split('.').splice(0,4).join('.');
			return `${symbolID}.${this.month}`;
		},
		/** 對應所有合約的履約價列表 */
		strikePriceList() {
			let list = [];
			this.contracts.C.forEach((sid)=>{
				list.push(Number(M4C.Option.getStrike(sid)));
			});
			return list;
		},
		/** 價平價格 */
		closedPrice() {
			return this.contracts.closedPrice;
		},
		/** 最接近價平的履約價 */
		closedStrikePrice() {
			let len = this.closedContractObjList.length;
			for (let i=0; i<len-1; i++) {
				let thisStrike = Number(this.closedContractObjList[i].strike);
				let nextStrike = Number(this.closedContractObjList[i+1].strike);
				// 正向排序情境
				if (thisStrike <= this.closedPrice && nextStrike > this.closedPrice)
					return thisStrike;
				// 反向排序情境
				if (thisStrike > this.closedPrice && nextStrike <= this.closedPrice)
					return thisStrike;
			}
		},
		hotMonth() {
			let hotSid = `${this.$store.state.opt.selectedSymbol}.HOT`;
			return M4C.Symbol.toMonthSymbol(hotSid).split('.').slice(-1)[0];
			// return this.month == hotMonth;
		},
		// "I.O.SSE.510050"
		symbolSID() {
			let sid = this.sid;
			let tmp = sid.split('.');
			if (tmp.length >= 4)
				sid = tmp.slice(0,4).join('.');
			// "I.O.SSE.510050A" -> "I.O.SSE.510050"
			return M4C.Option.noPRIADJ(sid);
		},
		normalPositionSumMap() {
			return this.$store.state.data.normalPositionSumMap;
		},
		/** 屬於本商品本月份的持倉 */
		thisMthPositionList() {
			try {
				return this.$store.state.data.normalPositionSumList.filter(psd => {
					// 與symbolSID相同處理方式(之後直接比較，預期相同時為同一品種代碼)
					let psdSymbol = M4C.Option.noPRIADJ(psd.SYMBOL.split('.').slice(0,4).join('.'));
					// 品種代碼正確 && 月份正確
					return psdSymbol == this.symbolSID && psd.SYMBOL.indexOf(`.${this.month}.`) !== -1;
				});
			}catch(e){}
			return [];
		},
		/** 本月份的多空合計數量 */
		totalPositionQty() {
			let result = {C:0, P:0};
			this.thisMthPositionList.forEach(psd => {
				result.C += psd.$BQTY;
				result.P += psd.$SQTY;
			});
			return result;
		},
		// 使用 CN or TW 的策略下單盒
		plotOrderClass() {
			return this.twMode ? PlotOrderTW : PlotOrder;
		},
	},
}
</script>

<style scoped>
.tr {
	width: 100%;
}
.mth-line {
	width: 100vw;
	height: 34px;
	min-height: 34px;
	/* 這個 border 需搭配 box-sizing: border-box 否則會導致列高增高 1px，導致兩側與中央會隨月份堆疊出高度差 */
	border-bottom: 1px solid #1C2333;
	box-sizing: border-box;
}

/* 價平上方 */
.closed-strike-prev {
	box-sizing: border-box;
	border-bottom: 2px solid #F5A623;
	background-color: #7B0C0C !important;
}
/* 價平下方 */
.closed-strike-next {
	background-color: #1E6817 !important;
}
/** 履約價持倉塊 */
.position-block {
	position: absolute;
	top: 1px;
	bottom: 1px;
	width: 7px;
	box-sizing: border-box;
}
.position-block:hover {
	border: 1px solid orange;
}
.position-block.c {
	left: 0;
}
.position-block.p {
	right: 0;
}
/** 履約價持倉口數 */
.position-count {
	position: absolute;
	bottom: -2px;
}
.position-count.c {
	left: 8px;
}
.position-count-large.c {
	top:0;
	left: 2px;
}
.position-count.p {
	right: 8px;
}
.position-count-large.p {
	right: 2px;
}
.suber {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 1px;
	opacity: 0;
	/* background-color: yellow; */
}
</style>