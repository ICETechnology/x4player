<template>
	<div class="option-cs-ctn flex-col" :class="comCard">
		<div class="switch-list-ctn flex-row pdt1 pdlr4">
			<div class="radio-s flex-1 flex-center" :class="{'clr-gray2': isCombine}" @click="mode='S'">
				<span class="pdlr2 pdtb1" :class="{'selected': isSingle}">{{ $ln('單式選擇權') }}</span>
			</div>
			<div class="radio-c flex-1 flex-center" :class="{'clr-gray2': isSingle}" @click="mode='C'">
				<span class="pdlr2 pdtb1" :class="{'selected': isCombine}">{{ $ln('複式選擇權') }}</span>
			</div>
		</div>
		<div class="title-ctn flex-row mgr2 pdtb1">
			<span class="check-ctn flex-center">{{ $ln('選擇') }}</span>
			<span class="contract-ctn">{{ $ln('合約') }}</span>
			<span class="single-position-ctn" v-if="isSingle">{{ $ln('部位') }}</span>
			<span v-if="!hosc" class="price-ctn" :class="isSingle?'flex-end': 'flex-start'">{{ $ln(isSingle?'均價': '均價 / 市價') }}</span>
			<span class="pl-ctn flex-end flex-1" v-if="isSingle && !hosc">{{ $ln('試算損益') }}</span>
			<span class="combine-position-ctn flex-end flex-1" v-if="mode=='C'">{{ $ln('部位') }}</span>
		</div>
		<div class="option-position-list-ctn flex-1 posr" v-stop-propagation-x>
			<ScrollBounce class="option-position-card-ctn" :refresh="true" @refresh="reloadList">
				<SingleOptionCard v-for="(csData, key) in optionList" :key="key" class="pdtb3 pdr2" 
					:csData="csData" :mode="mode" :checkList="checkList" @check="onCheck"/>
				<Stamp v-if="optionList.length===0" :stampStatus="stampStatus" />
			</ScrollBounce>
		</div>
		<div class="select-list-ctn flex-col" v-if="isSingle && checkList.length">
			<SelectedOptionList :checkList="checkList" @check="onCheck" />
		</div>
		<div class="option-cs-foot-ctn flex-row clr-black space-between">
			<div class="option-combine-ctn flex-row" v-if="isSingle">
				<span class="option-btn mg2 pdtb2 pdlr1 rd1 bgc-white nowrap tcef" @click="onSingleCombine" 
					:class="{'disabled': checkList.length < 2}">{{ $ln('單組') }}</span>
				<span class="option-btn mg2 pdtb2 pdlr1 rd1 bgc-white nowrap tcef" @click="onCombineAll" 
					:class="{'disabled': !optionList.length}">{{ $ln('全組') }}</span>
			</div>
			<div class="option-split-ctn flex-row" v-if="isCombine">
				<span class="option-btn mg2 pdtb2 pdlr1 rd1 bgc-white nowrap tcef" @click="onSingleSplit" 
					:class="{'disabled': !checkList.length}">{{ $ln('拆解') }}</span>
				<span class="option-btn mg2 pdtb2 pdlr1 rd1 bgc-white nowrap tcef" @click="onSplitAll" 
					:class="{'disabled': !optionList.length}">{{ $ln('全拆') }}</span>
			</div>
			<div class="option-close-ctn flex-row clr-white">
				<div v-if="!hosc" class="totalPLTrial-ctn flex-col pdtb1 flex-horizontal-center">
					<span class="font-size-mini ">{{ $ln('總損益試算') }}</span>
					<span class="flex-end" :class="$clr0(totalPLTrial)">{{ $displayPL(totalPLTrial) }}</span>
				</div>
				<CloseAllPosition class="close-all-btn mg2 pdtb2 pdlr1 rd1 bgc-up tcef" 
					:class="{'disabled': !optionList.length}" :positionList="currentPositionList" />
			</div>
		</div>
		<LoadingBlockMsg :bmParam="bmParam" v-if="showBlock" :paramText="paramText" @CLOSE="onCloseLoading" />
	</div>
</template>
<script>
import SingleOptionCard from './SingleOptionCard.vue';
import SelectedOptionList from './SelectedOptionList.vue';
import OptionCSOrderConfirm from './OptionCSOrderConfirm.vue';
import CloseAllPosition from "@/components/CloseAllPosition.vue";
import LoadingBlockMsg from './LoadingBlockMsg.vue';
export default {
	data(){
		return {
			mode: 'S',
			checkList: [],
			combineAllResult: {},
			combineAvailableResult: {},
			splitAvailableResult: {},
			orderResult: {},
			splitResultList: [],
			showBlock: false,
			// BlockMessage參數
			bmParam: {},
			paramText: '網路組拆中。。。',
		}
	},
	components: {SingleOptionCard, SelectedOptionList, OptionCSOrderConfirm, CloseAllPosition, LoadingBlockMsg},
	beforeMount() {
		this.$emit('title', '選擇權組合與拆解');
		this.combineAvailableResult = M4C.CombinePosition.queryCombinePositionAdvice("1");
	},
	mounted() {
		let self = this;
		eventBus.$on('RELOAD-OPTION-LIST', ()=>{
			self.reloadList();
		});
		// 收到通知全拆
		eventBus.$on('OPTIONCS-SPLITALL', (CB)=>{
			// 依函式處理
			if(CB) self[CB](true);
		});
	},
	methods: {
		// 關閉loading
		onCloseLoading() {
			this.reloadList();
			this.showBlock = false;
		},
		// 勾選事件
		onCheck(obj) {
			if(this.checkList.length === 0) this.checkList.push(obj);
			else {
				let index = this.checkList.findIndex(o=>{
					if(this.isCombine)
						return o.SYMBOL === obj.SYMBOL && o.SIDE === obj.SIDE && o.SYMBOL2 === obj.SYMBOL2 && o.SIDE2 === obj.SIDE2;
					else
						return o.SYMBOL === obj.SYMBOL && o.SIDE === obj.SIDE;
				});
				// 不在清單中
				if(index === -1) {
					// 組合模式 --> 無條件加入清單
					if(this.isCombine)
						this.checkList.push(obj);
					// 單一模式
					else {
						// 已有兩隻腳選取 --> 先進先出移除第一個
						if(this.checkList.length === 2) {
							this.$store.state.notify(`只允許勾選兩筆未平倉明細`);
							this.checkList.shift();
						}
						// 加入最後選取的商品。
						this.checkList.push(obj);
					}
				}
				// 已在清單中 --> 移除
				else {
					this.checkList.splice(index, 1);
				}
			}
		},
		// 取拆解委託清單
		getSplitOrderList(list) {
			let array = [];
			for(let idx in list) {
				const data = list[idx];
				let oi = {};
				oi.SYMBOL = data.SYMBOL;
				oi.SYMBOL2 = data.SYMBOL2;
				oi.SIDE = data.SIDE;
				oi.SIDE2 = data.SIDE2;
				oi.QTY = data.QTY;
				oi.COMPOSITE_ID = data.COMPOSITE_ID;
				oi.TYPE = 'SPLIT';
				array.push(oi);
			}
			return array;
		},
		// 單式組合
		onSingleCombine() {
			eventBus.$emit('POPUP-DIALOG', OptionCSOrderConfirm, {orderinfo: this.singleOrderInfo}, {transName: 'float', lock: true});
		},
		// 全組
		onCombineAll() {
			eventBus.$emit('POPUP-DIALOG', OptionCSOrderConfirm, {}, {transName: 'float', lock: true});
		},
		// 單拆
		onSingleSplit(passNotice) {
			if(this.checkList.length == 1) 
				eventBus.$emit('POPUP-DIALOG', OptionCSOrderConfirm, {orderinfo: this.singleOrderInfo}, {transName: 'float', lock: true});
			else if(this.checkList.length > 1) {
				// 依參數判斷是否彈出提示訊息視窗
				if(typeof passNotice !== "boolean" && this.splitNotice)
					eventBus.$emit('POPUP-DIALOG', OptionCSOrderConfirm, {TYPE: "SPLITALL", CB: "onSingleSplit"}, {transName: 'float', lock: true});
				else {
					let queue = this.getSplitOrderList(this.checkList);
					this.splitResultList.splice(0);
					this.showBlock = true;
					for(let i in queue) {
						let oi = queue[i];
						setTimeout(() => {
							this.splitResultList.push(M4C.CombinePosition.execCombinePosition(oi));
						}, 250 * i);
					}
				}
			}
		},
		// 全拆
		onSplitAll(passNotice) {
			if(typeof passNotice !== "boolean" && this.splitNotice)
					eventBus.$emit('POPUP-DIALOG', OptionCSOrderConfirm, {TYPE: "SPLITALL", CB: "onSplitAll"}, {transName: 'float', lock: true});
			else {
				let queue = this.getSplitOrderList(this.splitAvailableAdvice);
				this.splitResultList.splice(0);
				this.showBlock = true;
				for(let i in queue) {
					let oi = queue[i];
					setTimeout(() => {
						this.splitResultList.push( M4C.CombinePosition.execCombinePosition(oi));
					}, 250 * i);
				}
			}
		},
		reloadList() {
			this.checkList.splice(0);
			// 單式選擇權
			if(this.isSingle) {
				// 防連點機制
				if (this.combineAvailableQueryLock) return; 
					this.combineAvailableQueryLock = setTimeout(()=>{delete this.combineAvailableQueryLock;}, 1000);
					// 重查可組建議清單
					this.combineAvailableResult = M4C.CombinePosition.queryCombinePositionAdvice("1");
			}
			// 複式選擇權
			if(this.isCombine) {
				// 防連點機制
				if (this.splitAvailableQueryLock) return; 
					this.splitAvailableQueryLock = setTimeout(()=>{delete this.splitAvailableQueryLock;}, 1000);
				// 重查可拆建議清單
				this.splitAvailableResult = M4C.CombinePosition.queryCombinePositionAdvice("2");
			}
		},
	},
	watch: {
		mode(nv) {
			this.reloadList();
		},
		"combineAllResult.$STATUS"(nv, ov) {
			if(nv === "DONE") {
				let list = this.combineAllAdvice.map(obj=>({'SYMBOL': obj.SYMBOL, 'SIDE': obj.SIDE, 'SYMBOL2': obj.SYMBOL2, 'SIDE2': obj.SIDE2, 'QTY': obj.QTY, 'TYPE': 'COMBINE_ALL'}));
				this.orderResult = M4C.CombinePosition.execCombinePosition(list[0]);
			}
		},
		// 全拆結束
		splitAllDone: {
			handler(nv, ov) {
				if(!nv.length) return;
				// 全部可拆數量
				let allLength = this.splitAvailableAdvice.length;
				// 勾選數量
				let checkLength = this.checkList.length;
				// 成功數量
				let doneLength = nv.filter(obj=>obj.$STATUS === "DONE").length;
				// 失敗數量
				let failLength = nv.filter(obj=>obj.$STATUS === "FAIL").length;
				// 執行結果
				let result = nv[0];
				if(nv.length === allLength) {
					// 全部成功或失敗情境
					if(doneLength === allLength || failLength === allLength) {
						let mseeage = doneLength? "全拆成功": `(${result.$CD}) ${result.$MSG}`;
						this.bmParam = {display: true, head: this.$ln('系統訊息'), body: mseeage, showConfirmBtn: true};
					}
					// 部分失敗情境
					else 
						this.bmParam = {display: true, head: this.$ln('系統訊息'), body: "部分拆解失敗，請確認!", showConfirmBtn: true};
				}
				else if(nv.length === checkLength) {
					// 全部成功或失敗情境
					if(doneLength === checkLength || failLength === checkLength) {
						let mseeage = doneLength? "拆解成功": `(${result.$CD}) ${result.$MSG}`;
						this.bmParam = {display: true, head: this.$ln('系統訊息'), body: mseeage, showConfirmBtn: true};
					}
					// 部分失敗情境
					else 
						this.bmParam = {display: true, head: this.$ln('系統訊息'), body: "部分拆解失敗，請確認!", showConfirmBtn: true};
				}
			},
			deep: true,
		}
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		// 卡片樣式(依模式顯示單一持倉或組合持倉樣式)
		comCard() {return this.isSingle? "SingleOptionCard": "CombineOptionCard"},
		// 一般持倉資料
		normalPositionSumList() {return this.$store.state.data.normalPositionSumList;},
		// 組合持倉資料
		compositePositionSumList() {return this.$store.state.data.compositePositionSumList;},
		// 選擇權組拆建議資料
		optionList() {
			return this.isSingle? this.combineAvailableAdvice: this.splitAvailableAdvice;
		},
		// 當前選擇權組拆持倉資料
		currentPositionList() {
			// 以選擇權組拆建議資料，組出簡易持倉資訊，以便使用全平組件
			return this.optionList.map(ps=>{
				if(ps.COMPOSITE_ID) {
					return  {
						$OFFSETABLE_QTY: ps.QTY,
						COMPOSITE_LIST: [
							{SYMBOL: ps.SYMBOL, SIDE: ps.SIDE},
							{SYMBOL: ps.SYMBOL2, SIDE: ps.SIDE2},
						]
					};
				}
				else {
					let singleData = {
						SYMBOL: ps.SYMBOL, 
						SIDE: ps.SIDE
					}
					if(singleData.SIDE == 'BUY')
						singleData.OFFSETABLE_BUY_QTY = ps.QTY
					else
						singleData.OFFSETABLE_SELL_QTY = ps.QTY
					return singleData;
				}
			})
		},
		// 單式選擇權
		isSingle() {return this.mode === 'S';},
		// 複式選擇權
		isCombine() {return this.mode === 'C';},
		/** 逐日盈虧:true / 逐笔盈亏:false */
		dailyPL() {
			return this.$store.state.position.dailyPL;
		},
		// 總損益試算
		totalPLTrial() {
			const field = this.dailyPL? "UNREALIZED_DAILY_PL": "UNREALIZED_PL";
			let positionList = this.isSingle? this.$store.state.data.normalPositionSumList: this.$store.state.data.compositePositionSumList;			
			const list = this.optionList.map(csData => {
				const position = positionList.find(ps=> {
					if(this.isSingle)
						return ps.SYMBOL === csData.SYMBOL && ps.$BUYSELL.indexOf(csData.SIDE) != -1;
					if(this.isCombine) {
						const ps1 = ps.COMPOSITE_LIST[0];
						const ps2 = ps.COMPOSITE_LIST[1]
						return ps1.SYMBOL === csData.SYMBOL && ps1.SIDE === csData.SIDE 
						&& ps2.SYMBOL === csData.SYMBOL2 && ps2.SIDE === csData.SIDE2;
					}
				}) || {};
				return position[field];
			});
			if(list.length)
				// 依欄位取值計算 
				return list.reduce((a,b) => (Number(a||0) + Number(b||0)));
		},
		singleOrderInfo() {
			let oi = {};
			if(this.checkList.length) {
				let psd1 = {};
				let psd2 = {};
				if(this.isSingle) {
					psd1 = this.checkList[0] || {};
					psd2 = this.checkList[1] || {};
					oi.SYMBOL = psd1.SYMBOL;
					oi.SYMBOL2 = psd2.SYMBOL;
					oi.SIDE = psd1.SIDE;
					oi.SIDE2 = psd2.SIDE;
					oi.TYPE = "COMBINE";
				}
				if(this.isCombine && this.checkList[0]) {
					psd1 = this.checkList[0];
					psd2 = this.checkList[0];
					oi.SYMBOL = psd1.SYMBOL;
					oi.SYMBOL2 = psd2.SYMBOL2;
					oi.SIDE = psd1.SIDE;
					oi.SIDE2 = psd2.SIDE2;
					oi.TYPE = "SPLIT";
					oi.COMPOSITE_ID = psd1.COMPOSITE_ID;
				}
				oi.QTY = Math.min(psd1.QTY, psd2.QTY);
			}
			return oi;
		},
		combineAvailableAdvice() {return M4C.CombinePosition.combineAvailableAdvice;},
		splitAvailableAdvice() {return M4C.CombinePosition.splitAvailableAdvice;},
		combineAllAdvice() {return M4C.CombinePosition.combineAllAdvice;},
		/** 狀態章 */
		stampStatus() {
			if(this.isSingle)
				return this.combineAvailableResult.$STATUS;
			if(this.isCombine)
				return this.splitAvailableResult.$STATUS;
		},
		splitAllDone() {
			let resultList = [];
			this.splitResultList.forEach(result => {
				if(result.$STATUS === 'FAIL' || result.$STATUS === 'DONE') {
					resultList.push(result);
				}
			});
			return resultList;
		},
		// 隱藏特定欄位 (未來後台支持後可拔除) https://trello.com/c/cUI1658H
		hosc() {try{return this.$store.state.config.publicPdSetting.function.hideOptionCSSomeColumn;}catch(e){}},
		splitNotice() {try {return this.$store.state.config.publicPdSetting.splitNotice;} catch(e) {}}
	},
}
</script>
<style scoped>
.switch-list-ctn {
	background-color: #2A3647;
}
.title-ctn,.select-list-ctn {
	background-color: #000B18;
}
.option-cs-foot-ctn {
	background-color: #292C2F;
}
.selected{
	border-bottom: 2px solid #F58923;
}
.option-cs-ctn /deep/ .check-ctn{
	min-width: 10vw;
	max-width: 10vw;
}
.option-cs-ctn /deep/ .single-position-ctn{
	min-width: 10vw;
	max-width: 10vw;
}
.SingleOptionCard /deep/ .price-ctn{
	min-width: 20vw;
	max-width: 20vw;
}
.CombineOptionCard /deep/ .price-ctn{
	min-width: 30vw;
	max-width: 30vw;
}
.SingleOptionCard /deep/ .contract-ctn {
	min-width: 35vw;
	max-width: 35vw;
}
.CombineOptionCard /deep/ .contract-ctn{
	min-width: 40vw;
	max-width: 40vw;
}
.option-position-card-ctn /deep/ .option-single-card-ctn:nth-child(2n+2){
	background: #000B18;
}
/deep/ .opt-cp {
	color: #A2A2A2;
	border: 1px solid #A2A2A2;
}
/deep/ .B-icon {
	color: #2453AB;
	border: 1px solid #2453AB;
}
/deep/ .S-icon {
	color: #945821;
	border: 1px solid #945821;
}
</style>