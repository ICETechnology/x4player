<template>
    <tr @click="onClick" v-waypoint="{active: true, callback: onWaypoint}" :class="{'selected': selected}">
		<!-- 不在畫面上時 -->
		<td v-if="!visibility" colspan=30>&nbsp;</td>
		<!-- 在畫面上時 -->
		<td v-for="obj in columns" :style="{'text-align': obj.align || 'right'}" v-if="!obj.hide && visibility"
			class="nowrap pdtb1 pdlr2" @contextmenu.prevent="(e)=>{$emit('contextMenu', rpt, obj, _self)}"
			:class="[`col-${obj.key}`, `${obj.classKey ? _self[obj.classKey] : ''}`]">
			<!-- 判斷複式單顯示 -->
			<div v-if="obj.key=='$CONTRACT_NAME'&&rpt['$CONTRACT_NAME2']" class="flex-col">
				<span>{{rpt[obj.key]}}</span>
				<span>{{rpt['$CONTRACT_NAME2']}}</span>
			</div>
			<div v-else>
				{{_self[obj.key] || rpt[obj.key]}}
			</div>
		</td>
    </tr>
</template>

<script>
import ReportCardFn from "@/components/ReportCardFn";
export default {
    mixins: [ReportCardFn],
	props: ['rpt', 'selectedObj'],
	data() {
		return {
			_self: this,
			visibility: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			// 設定關注商品
			this.$store.commit("setSelectedSymbol", this.rpt.SYMBOL);
			// 支持切換 設定/移除 當前選擇回報
			this.selectedObj.rpt = this.selectedObj.rpt === this.rpt ? null: this.rpt;
			// 將一般 click 過濾為 dbl-click (固定寫法)
			if (this.waitDoubleClick == null) {this.waitDoubleClick = true; setTimeout(self=>delete self.waitDoubleClick, 300, this); return;}
			eventBus.$emit("ORDER", {orderType: 'LIMIT'});
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			this.visibility = going === 'in';
		},
	},
	watch: {},
    computed: {
		columns() {
			return this.$store.state.desktop.reportColumns;
		},
		$STATUS() {
			return this.$ln(this.rpt.$STATUS);
		},
		$STATUS_CLASS() {
			return this.getStatusClass(this.rpt);
		},
		$SIDE_TEXT() {
			return this.$ln(this.rpt.$SIDE==='BUY' ? '买' : '卖');
		},
		$POSITION_EFFECT_TEXT() {
			return this.$ln(`${this.rpt.$POSITION_EFFECT}(short)`);
		},
		// 委託別
		$ORDER_TYPE_TEXT() {
			if (this.rpt.$IS_OCO)
				return this.$ln(`止损止盈OCO`);
			let result = this.$store.state.config.mapOrderTypeLabel[this.rpt.TC_ORDER_TYPE] || this.rpt.TC_ORDER_TYPE;
			result = this.$ln(result);
			if (result && (this.rpt.POSITION_EFFECT === "CWO" || this.rpt.POSITION_EFFECT === "CWC"))
				result += this.$ln("备兑");
			return result || "";
		},
		// 委託價
		$ORDER_PRICE() {
			let p = this.rpt.$IS_OCO ? this.rpt.OCO[0].ORDER_PRICE : this.rpt.ORDER_PRICE;
			return `${p}`;
		},
		/** 效期別 ex. ROD/IOC/FOK */
		$TIMEINFORCE() {
			return this.rpt.TIME_IN_FORCE || this.rpt.OCO[0].TIME_IN_FORCE;
		},
		$TRG_PRICE() {
			if (this.rpt.$IS_OCO)
				return this.rpt.OCO[0].SMO.TRG_PRICE + ' / ' + this.rpt.OCO[1].SMO.TRG_PRICE;
		},
		selected() {
			return this.selectedObj.rpt === this.rpt;
		}
	},
}
</script>

<style scoped>
</style>