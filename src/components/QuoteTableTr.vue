<template>
	<tr class="quote-table-tr tcend" @click="onTrClick" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}">
		<td class="flex-row">
			<!-- 展開圖示 -->
			<div class="flex-center expand-btn" :class="{'opacity0 pointer-events-none': !hasExpand}">
				<i class="material-icons" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
					{{expand ? 'arrow_drop_up' : 'arrow_drop_down'}}</i>
			</div>
			<div class="flex-1 flex-col">
				<!-- 合約名稱 -->
				<div class="flex-1 flex-start name font-bold flex-row">
					<div>{{getName}}</div>
				</div>
				<!-- 代碼月份 -->
				<div class="flex-start">
					<span class="clr-gray mr5 font-size-small">{{getSymbolMonth}}</span>
					<!-- <div v-if="hasOpt" class="has-opt-btn flex-center font-size-small" @click="onClickOpt">{{$ln(`权`)}}</div> -->
				</div>
			</div>
		</td>
		<td v-if="visibility" class="nowrap text-align-right" v-for="obj in showList"
			:class="[cellClass(obj)]">{{cellText(obj)}}</td>
	</tr>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	mixins: [QuoteAgent],
	props: ["sid", "suspend", "expandObj"],
	data() {
		return {
			/** 當前是否展開 */
			expand: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			if(direction) 	console.log(going, direction);
			if(direction && (direction == "top" || direction == "bottom")){
			
			this.visibility = going === 'in';
			}
		},
		onBtnExpand() {
			// 多於1個合約才展開
			if(this.moreContracts.length < 2) return;
			this.expand = !this.expand;
			this.$emit("onExpand", this.expand, this.sid, this.moreContracts);
		},
		onTrClick() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.sid);
			// 切到商品行情
			this.$store.state.status.landscapeClass = "MixChart";
		},
		// 欄位的 class
		cellClass(obj) {
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
			return list;
		},
		// 欄位的文字內容
		cellText(obj) {
			if (obj.isPrice)
				return this.$symbolPrice(this.sid, this.qo[obj.key]) || '--';
			return this[obj.key] || this.qo[obj.key] || '--';
		},
	},
	watch: {},
    computed: {
		$clrUd() {return this.$store.state.fn.$clrUd;},
		$volUnit() {return this.$store.state.fn.$volUnit;},
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
		/** 顯示欄位列表 */
		showList() {
			return this.$store.state.columnSD.quote.show;
		},
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
	},
}
</script>

<style scoped>
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