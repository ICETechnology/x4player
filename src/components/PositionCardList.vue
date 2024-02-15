<template>
    <div class="position-card-list-ctn flex-col">
		<div class="flex-row head clr-gray sys-bgc zindex-1 font-size-small pdlr4">
			<div class="cell0 flex-start tcef" @click="onSort('$SYMBOL')">
				{{$ln('合约')}}
				<div v-if="sortKey==='$SYMBOL'" class="flex-center"><i class="material-icons md-18 font-size-small">{{sortDesc ? 'north' : 'south'}}</i></div>
			</div>
			<div class="cell1 flex-center tcef" @click="onSort('$NET_QTY')">
				<span class="clr-orange">{{$ln('持仓')}}</span><span v-if="!twMode">/{{$ln('可用')}}</span>
				<div v-if="sortKey==='$NET_QTY'" class="flex-center"><i class="material-icons md-18 font-size-small">{{sortDesc ? 'north' : 'south'}}</i></div>
			</div>
			<div class="cell2 flex-center tcef" @click="onSort('$BSAVG')">
				{{$ln(`均价`)}}
				<div v-if="sortKey==='$BSAVG'" class="flex-center"><i class="material-icons md-18 font-size-small">{{sortDesc ? 'north' : 'south'}}</i></div>
			</div>
			<div class="cell3 flex-end nowrat tcef" @click="onSort(dailyPL ? 'UNREALIZED_DAILY_PL' : 'UNREALIZED_PL')">
				<i v-if="!twMode" class="material-icons md-18 clr-orange" @click.stop="onSwitchPL">swap_horiz</i>
				<span class="nowrap">{{$ln(dailyPL ? `逐日盈亏` : `逐笔盈亏`)}}</span>
				<div v-if="sortKey==='UNREALIZED_DAILY_PL'" class="flex-center"><i class="material-icons md-18 font-size-small">{{sortDesc ? 'north' : 'south'}}</i></div>
				<div v-if="sortKey==='UNREALIZED_PL'" class="flex-center"><i class="material-icons md-18 font-size-small">{{sortDesc ? 'north' : 'south'}}</i></div>
			</div>
		</div>
		<div class="position-card-parent flex-1 posr font-size-little">
			<ScrollBounce class="FULL" :refresh="true" @refresh="onRefresh" :status="stampStatus">
				<PositionCard class="position-card-ctn tcef"
					v-for="(psd, i) in sortedPositionSumList" :key="`PositionCardList-${psd.$SYMBOL}`" @setContractsList="setContractsList"
					:positionSumData="psd" @onExpand="sid => expandSid = sid" :expandSid="expandSid"/>
				<Stamp v-if="sortedPositionSumList.length===0" :stampStatus="stampStatus" />
				<div class="mgtb5 pdtb3"></div>
			</ScrollBounce>
		</div>
		<!-- 全平 -->
		<CloseAllPosition class="close-all-position font-size-little flex-center" />
    </div>
</template>

<script>
import PositionCard from "@/components/PositionCard.vue";
import CloseAllPosition from "@/components/CloseAllPosition.vue";

export default {
	props: ['suspend', 'visibility'],
	data() {
		return {
			/** 當前展開哪個商品 (各商品展開互斥) */
			expandSid: "",
        }
	},
	beforeDestroy() {
		this.$store.state.status.isPosition = false;
		// 清空關注合約列表
		// this.$store.state.status.curContractsList = [];
		
	},
	mounted() {
		// 新手教學
		eventBus.$emit("HEPLER", "position", 2);
		this.$store.state.status.isPosition = this.visibility;
	},
	methods: {
		onRefresh() {
			M4C.Position.queryPositionSum();
		},
		// 切換逐筆/逐日盈虧
		onSwitchPL() {
			this.$store.state.position.dailyPL = !this.$store.state.position.dailyPL;
			// 若當前正由盈虧在排序時，需要恢復預設不排序
			if (this.sortKey.indexOf('UNREALIZED') !== -1) {
				this.sortKey = '$SYMBOL';
				this.sortDesc = false;
			}
		},
		onSort(key) {
			if (this.sortKey === key) {
				// 同 Key 又已經 desc -> 恢復為不 sort 狀態
				if (this.sortDesc)
					this.sortKey = '$SYMBOL';
				this.sortDesc = !this.sortDesc;
			}
			else {
				this.sortKey = key;
				this.sortDesc = false;
			}
			// console.log('PositionCardList.onSort', this.sortKey, this.sortDesc);
		},
		setContractsList() {
			// 收到彈出下單盒事件時，製作出專供切換上下檔的合約列表
			try {
				// 調整以有無商品表過濾切換清單
				this.$store.state.status.curContractsList = this.sortedPositionSumList.filter(o=>(M4C.Symbol.getContractInfo(o.$SYMBOL))).map(s=>s.$SYMBOL);
			}catch(e){}
		},
	},
	watch: {
		/** 持倉變化時要重設 expandSid (以免平倉的下一列的商品被展開) */
		normalPositionSumList(nv) {
			// 因持倉核心已用商品代碼排序，所以持倉如果又以其他欄位排序時會被判斷為有資料變動。所以不適合在這裡處理清空展開設定。
			// this.expandSid = "";
		},
		visibility(nv) {
			this.$store.state.status.isPosition = nv;
		},
		sortedPositionSumList(){
			// 當前關注合約列表
			let list =[];
			this.sortedPositionSumList.forEach(data => {
				if(!data.$IS_COMPOSITE){
					list.push(data.$SYMBOL)
				}				
			});
			this.$store.state.status.curContractsList = list;
			}
	},
	computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 經過排序的持倉列表 */
		sortedPositionSumList() {
			let val = this.sortDesc ? -1 : 1;
			let dataKey = this.sortKey;
			let list = this.totalPositionSumList;
			// 簡單處理盈虧得要轉數值在比大小 (若未來有更多，可以再開變數定義該欄位要轉數值)
			if (dataKey.indexOf('UNREALIZED') !== -1) {
				list.sort((a,b)=>{
					if (a[dataKey] === b[dataKey])
						return a.$SYMBOL > b.$SYMBOL ? 1 : -1;
					return Number(a[dataKey]) > Number(b[dataKey]) ? val : -val;
				});
			}
			else {
				list.sort((a,b)=>{
					// 複式選擇權排在最下面
					// if (a.$IS_COMPOSITE && !b.$IS_COMPOSITE) return 1;
					if (a[dataKey] === b[dataKey])
						return a.$SYMBOL > b.$SYMBOL ? 1 : -1;
					return a[dataKey] > b[dataKey] ? val : -val;
				});
			}
			return list;
		},
		// 所有要呈現的持倉資料
		totalPositionSumList() {
			if (this.twMode)
				return [].concat(this.normalPositionSumList).concat(this.compositePositionSumList);
			else
				return this.normalPositionSumList;
		},
		/** 持倉匯總資料 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		// 台灣複式選擇權持倉資料
		compositePositionSumList() {
			return this.$store.state.data.compositePositionSumList;
		},
		queryPositionSumResult() {
			return this.$store.state.result.queryPositionSumResult;
		},
		/** PositionSumResult.$STATUS */
		stampStatus() {
			return this.queryPositionSumResult.$STATUS;
		},
		/** 逐日盈虧:true / 逐笔盈亏:false */
		dailyPL() {
			return this.$store.state.position.dailyPL;
		},
		sortKey: {
			set(v) {this.$store.state.config.normalPositionTable_sortKey = v;},
			get() {return this.$store.state.config.normalPositionTable_sortKey;}
		},
		sortDesc: {
			set(v) {return this.$store.state.config.normalPositionTable_sortDesc = v;},
			get() {return this.$store.state.config.normalPositionTable_sortDesc;}
		},
	},
	components: {
		PositionCard,
		CloseAllPosition,
	},
}
</script>

<style scoped>
.position-card-list-ctn .head {
	height: 10vw;
	/* border-bottom: 1px solid #575C61; */
}
/* 寬度設定 */
.position-card-list-ctn /deep/ .cell0 {width: 29vw; max-width: 29vw;}
.position-card-list-ctn /deep/ .cell1 {width: 25vw; max-width: 25vw;}
.position-card-list-ctn /deep/ .cell2 {width: 23vw; max-width: 23vw;}
.position-card-list-ctn /deep/ .cell3 {width: 23vw; max-width: 23vw;}

/* 全平按鈕 */
.close-all-position {
	position: absolute;
	right: 5vw;
	bottom: 5vw;
	width: 12vw;
	height: 12vw;
	border-radius: 6vw;
	color: white;
	background-color: #DE6461;
	box-shadow: 0px 0px 5px 0px rgba(222, 100, 97, 0.5);
}
.position-card-parent .position-card-ctn:nth-child(even) {
	background: #000B18;
}
</style>