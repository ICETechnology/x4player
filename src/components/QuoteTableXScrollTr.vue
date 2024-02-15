<template>
	<div class="quote-table-tr tcef flex-end" @click="onTrClick" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}" ref="tableTr"
		 :class="{'pointer-events-none': !isAvailable}" :style="{color:expandObj.color}">
		<div class="flex-row" v-if="visibility">
			<div class="flex-end text-align-right td pdl1 pdr3"  v-for="(obj, idx) in contentList" :key="idx"
			v-if="!noFixedLeft"	:class="[cellClass(obj, idx),{'font-size-big':$store.state.config.largeSize}]">{{cellText(obj, idx)}}</div>
		</div>
	</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ["sid", "suspend", "expandObj", "fixedIdx", "column", "noFixedLeft", "mode", "sortedList"],
	data() {
		return {
			/** 當前是否展開 */
			expand: false,
			tableTr: "",
			visibility: false,
		}
	},
	beforeMount() {},
    mounted() {
		this.tableTr = this.$refs.tableTr;
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				if(this.visibility)	this.offVisibilityTimeout = setTimeout(()=>{this.visibility = false;}, 1000);
			}
		},
		onTrClick() {
			if(!this.getName) return;
			event.stopPropagation();
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 更新是否顯示為主連(熱門月)
			if (this.displayAsHot)
				this.$store.commit("setSelectedSymbolDisplayAsHot");			
			// 準備關注合約列表
			this.$store.commit("setContractsList", this.sortedList);
			// 彈出商品頁
			eventBus.$emit("POPUP-DIALOG", "QuotePage", {sid: this.sid});
		},
		// 欄位的 class
		cellClass(obj, idx) {
			let list = [];
			let qo = this.qo;
			// 價格類欄位
			if (obj.isPrice) {
				list.push('is-price');
				list.push(this.$clrUd(qo[obj.key], qo.r));
			}
			// 依據最新價進行漲跌變色
			if (obj.udClr) {
				list.push(this.$clrUd(qo.p, qo.r));
			}
			if(obj.contentClass)
				return obj.contentClass;
			if(this.expandObj[idx+1] && this.expandObj[idx+1].contentClass)
				return this.expandObj[idx+1].contentClass;
			return list;
		},
		// 欄位的文字內容
		cellText(obj, idx) {
			if(this.isPureData)	return this.expandObj[idx+1];
			if (obj.isPrice)
				return this.$symbolPrice(this.sid, this.qo[obj.key]) || '--';
			if(obj.isChange)
				return this.$symbolChgTxtX({qo: this.qo, mode:0}) || '--';
			if(typeof obj.fn === 'function')
				return obj.fn(obj.key, this.expandObj, this.qo);
			// 持倉匯總資料
			let position = {}
			if(this.expandObj && this.expandObj.position) {
				position = this.expandObj.position;
			}
			if(this.expandObj[idx+1] && this.expandObj[idx+1].value)
				return this.expandObj[idx+1].value;
			return this[obj.key] || position[obj.key] || this.qo[obj.key] || this.expandObj[obj.key] || '--';
		},
	},
	watch: {},
    computed: {
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$volUnit() {return this.$store.state.fn.$volUnit;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		$symbolChgTxtX() {return this.$store.state.fn.$symbolChgTxtX;},
		// "澳幣"
		getName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		getSymbolMonth() {
			return this.displayAsHot ? this.$ln("主连") : M4C.Symbol.getCIDM4(this.sid);
		},
		/** 存在展開圖示 */
		hasExpand() {
			return this.moreContracts && this.moreContracts.length > 1			
		},
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj ? this.expandObj.moreContracts : [];
		},
		/** 顯示欄位列表 */
		showList() {
			if(this.column.length) return this.column;
			else
				return this.$store.state.columnSD.quote_tablex.show;
		},
		contentList() {
			if(typeof this.fixedIdx == 'number' && this.mode == 1)
				return this.showList.slice(this.fixedIdx + 1);
			else
				return this.showList;
		},
		isPureData() {
			let result = true;
			// 非字串、數字陣列
			if(!Array.isArray(this.expandObj))
				return false;
			this.expandObj.forEach(obj=>{
				if(typeof obj == "object" || typeof obj == 'funtion')
					result = false;
			});
			return result;
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid);},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
}
</script>

<style scoped>
.label {
	width: 1px;
	overflow: hidden;
}
td {
	padding: 4px;
	border-bottom: 1px solid #333;
	width: 33.33vw;
	min-width: 33.33vw;
	box-sizing: border-box;
}
/* 首行永遠固定於左 */
td:first-child {
	position:sticky;
	left: 0;
	z-index: 1;
	background-color: #333;
}
</style>