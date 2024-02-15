<template>
	<div class="multi-stock-row-ctn flex-col flex-1 font-size-small">
		<div class="nk-option-ctn flex-row bgc-333" v-if="contractList.length" :class="useComClass == 'MiniTChart'? 'TChart-radio': 'normal-radio'">
			<span class="tchart-btn flex-center tcef" ref="TChartOpt" @click="onTchart" :class="{'focusitem': useComClass == 'MiniTChart'}">{{$ln('分时')}}</span>
			<Radio class="kchart-nk flex-1" ref="KChartOpt" v-model="nk">
				<span class="opt-btn tcef" value="1" @click="onNkClick(1)">{{$ln('1分')}}</span>
				<span class="opt-btn tcef" value="5" @click="onNkClick(5)">{{$ln('5分')}}</span>
				<span class="opt-btn tcef" value="15" @click="onNkClick(15)">{{$ln('15分')}}</span>
				<span class="opt-btn tcef" value="d" @click="onNkClick('d')">{{$ln('日')}}</span>
			</Radio>
		</div>
		<div class="flex-1 posr" ref="multiStockRowScrollCtn">
			<ScrollBounce ref="sb">
				<div class="thumb-list-ctn pdl1 flex-row flex-wrap h100p" :class="{'mgt2 mglr4':largeSize}" v-press="onPress">
					<div v-for="(symbol, key) in contractList" :key="key" class="thumb-card quote-card-ctn posr" :class="{'split-card':!largeSize,'thumb-card-large mgt4':largeSize,'pointer-events-none': !isAvailable(symbol)}"
						:sid="symbol" @click="onThumbCardClick(symbol, $event)">
						<MultiStockRowCard class="FULL" :suspend="suspend" :isThumbMode="true" :propsSid="toHotSymbol(symbol)" :propNk="propNk" :comClass="useComClass" />
					</div>
					<div v-for="v in fillUpContracts" :key="`none-Contract-${v}`" class="thumb-card split-card" :class="{'split-card':!largeSize,'thumb-card-large mgt3':largeSize}"></div>
				</div>
			</ScrollBounce>
			<Stamp v-if="contractList && contractList.length===0" :stampStatus="status" :ignoreLogin="true" />
		</div>
	</div>
</template>
<script>
import SortSymbolList from "@/components/SortSymbolList.vue";
import MultiStockRowCard from "@/components/MultiStockRowCard.vue";

export default {
	mixins: [SortSymbolList],
	data() {
		return{
			expandSid: '',
			expandContracts: [],
			sidOrderList: [],
			sortedList: [],
			status: 'Done',
			fillUpContracts: 0,
			nkList: ['1', '5', '15', 'd'],
			propNk: '',
			displayAsHot: true,
			scrollHeight: 0,
		}
	},
	props:["param", "suspend", "tabKey"],
	components:{
		MultiStockRowCard,
	},
	beforeMount() {this.propNk = this.nk;},
	mounted() {
		// 未點選任何商品來產出頁表時，就點選閃電，取當前頁(前後頁 suspend) sortedList 給閃電標頭用
		if(!this.$store.state.status.curContractsList.length && !this.suspend) this.setList(this.sortedList);
		// 計算一個畫面可容納多少個縮圖
		let minNum= this.$safeFloat(this.$refs.multiStockRowScrollCtn.offsetHeight / (window.innerWidth / 2));
		let minCards = this.largeSize? Math.ceil(minNum): Math.ceil(minNum*2);

		// 不足的另外渲染空元素填滿。
		if(this.contractList && this.contractList.length < minCards) {
			this.fillUpContracts = minCards - this.contractList.length;
		}
	},
	methods: {
		onThumbCardClick(sid,event) {
			event.stopPropagation();
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", sid);
			// 更新是否顯示為主連(熱門月)
			if (this.displayAsHot)
				this.$store.commit("setSelectedSymbolDisplayAsHot");
			// 準備關注合約列表
			this.setList(this.sortedList);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: sid});
		},
		// 分k選擇時切換miniK顯示。
		onNkClick(v) {
			this.propNk = v;
			this.$store.state.config.multiStockComClass = "miniKChart";
		},
		// 分時選擇時切換miniT顯示。
		onTchart() {
			this.propNk = 1;
			this.$store.state.config.multiStockComClass = "MiniTChart";
		},
		/** 長按 */
		onPress(e) {
			let quoteTableTr = e.srcElement.closest('.quote-card-ctn');
			let sid = quoteTableTr.getAttribute("sid");
			// 拖曳中情境時，關閉長按功能
			this.$store.commit("setSelectedSymbol", sid);
			// 準備關注合約列表
			this.setList(this.sortedList);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		// 有支援的商品
		isAvailable(sid) {return this.$checkSupportedItem(sid);},
		toHotSymbol(sid) {
			// 週台期不轉熱門月
			if (M4C.Symbol.isWeeklySymbol(sid))
				return sid;
			return M4C.Symbol.toHotSymbol(sid);
		},
		setList(sortedList) {
			this.$store.commit("setContractsList", sortedList);
		}
	},
	watch: {
		largeSize(nv){
			let minNum= this.$safeFloat(this.$refs.multiStockRowScrollCtn.offsetHeight / (window.innerWidth / 2));
			let minCards = nv? Math.ceil(minNum): Math.ceil(minNum*2);
			// 不足的另外渲染空元素填滿。
			if(this.contractList && this.contractList.length < minCards) {
				this.fillUpContracts = minCards - this.contractList.length;
			}
		},
		suspend(nv) {
			if(!nv && this.tempNK){
				this.nk = this.tempNK;
			}
			else {
				this.tempNK = this.nk;
			}
		},
	},
	computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		/** 經記憶排序後的 expandList (響應式) */
		expandObjList() {
			let list = this.propExpandList? [...this.propExpandList]: [];
			// 有展開時，將展開內容列表插入展開index
			if (this.expandSid && this.expandContracts.length) {
				let idx = this.propExpandList.findIndex(o=>o.sid===this.expandSid);
				list.splice(idx+1, 0, ...this.expandContracts);
			}
			return list;
		},
		/** 使傳入參數成為響應式 */
		propExpandList: function() {
            return this.param.expandList;			
		},
		contractList() {
			return this.sortedList.map(obj=>(obj.sid));
		},
		nk: {
			set(v) {
				this.$store.state.Kchart.NK = v;
			},
			get(){
				return this.$store.state.Kchart.NK;
			},
		},
		// 當前使用的組件
		useComClass() {return this.$store.state.config.multiStockComClass;},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
		// 啟用TVC
		enableTVC() {
			try{return this.$store.state.config.publicPdSetting.function.tvc;}catch(e){}
		},
	},
}
</script>
<style scoped>
.multi-stock-row-ctn {
	overflow: hidden;
}
.thumb-card {
	height: 50vw;
	max-height: 50vw;
	min-width: 100%;
}
.thumb-card-large {
	height: 38vw;
	max-height: 38vw;
}
.split-card {
	min-width: 49vw;;
}
.multi-stock-row-ctn .kchart-nk {
	border-radius: 0;
}
.kchart-nk>span.focus {
	background-color: rgba(0,0,0,0);

}
.tchart-btn {
	width: 15vw;
}
.TChart-radio .tchart-btn.focusitem {
	border-bottom: 2px solid rgba(255, 152, 0, 0.932);
}
.multi-stock-row-ctn .normal-radio .focus {
	background-color: initial;
	border-bottom: 2px solid rgba(255, 152, 0, 0.932);
}
.tchart-btn, .k-selector /deep/ .radio-wrapper>*{
	padding: 4px 2px;
}
.opt-btn, .tchart-btn {
	min-width: 6.6vw;
}
.opt-btn, .other-btn, .tchart-btn{
	border-bottom: 2px solid rgba(255, 255, 255, 0);
}
</style>