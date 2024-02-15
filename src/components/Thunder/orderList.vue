<template>
	<transition :name="isDesktop? 'desktopExpand': 'expand'">
		<div class="FULL overflow-y-auto order-list-ctn pd1" :class="side" v-if="isExpand">
			<div v-for="(li, key) in list" :key="key" class="order-card-ctn flex-row rd2 mgb3 pd2" :class="[{'row-reverse': side=='SELL'}, getColor(li)]">
				<span class="flex-row circle-icon" :class="{'row-reverse': side=='SELL'}" @click="cancelOrder([li])">
					<i class="material-icons font-size-little">clear</i>
				</span>
				<span>{{getOrderType(li)}}</span>
				<span class="flex-1 pdr1 clr-black" @click="onSelectedLi(li)">#{{li.$INDEX}}</span>
				<span class="flex-1 pdr1" @click="onSelectedLi(li)">{{getOrderQty(li)}}</span>
			</div>
		</div>
	</transition>
</template>
<script>
import ThunderOrder from "./ThunderOrder";
export default {
	mixins: [ThunderOrder],
	data() {
		return {
			isExpand: false,
		}
	},
	props:["report", "side"],
	mounted() {
		this.isExpand = this.list.length;
	},
	beforeDestroy() {
		if(this.$store.state.thunder.selectedPrice != "")
			this.$store.state.thunder.selectedPrice = "";
	},
	methods: {
		// 置頂選取委託
		onSelectedLi(li) {
			let keyList = this.list.map(rpt=> rpt.key);
			let idx = keyList.indexOf(li.key);
			// 移除
			this.list.splice(idx, 1);
			// 重加置頂
			this.list.unshift(li);
		},
		// 轉換委託類型
		getOrderType(li) {
			if(li.$IS_OCO) return 'O';
			else if(li.TC_ORDER_TYPE == "STPLMT") return "SL";
			else if(li.TC_ORDER_TYPE == "STOP") return "SM";
			else if(li.TC_ORDER_TYPE == "MIT" || li.TC_ORDER_TYPE == "LIT") return "T";
			else if(li.TC_ORDER_TYPE == "LIMIT") return "L";
			else if(li.TC_ORDER_TYPE == "TSTOP") return "TS";
			else if(li.TC_ORDER_TYPE == "TSTPLMT") return "TS";
		},
		// 委託數量
		getOrderQty(li) {
			return li.$ORDER_QTY;
		},
		// 依委託類型顯示背景顏色
		getColor(li) {
			let type = this.getOrderType(li);
			let bgc = "";
			switch(type) {
				case "O":
					bgc = "bgc-6C266F";
					break;
				case "SM":
					bgc = "bgc-E03434";
					// 有MAIN_ORDER_ID代表是子委託(出場委託)
					if(li.MAIN_ORDER_ID)
						bgc = "bgc-sl";
					break;
				case "SL":
					bgc = "bgc-E03434";
					if(li.MAIN_ORDER_ID)
						bgc = "bgc-sl";
					break;
				case "T":
					bgc = "bgc-1B31AB";
					if(li.MAIN_ORDER_ID)
						bgc = "bgc-sp";
					break;
				case "L":
					bgc = "bgc-018C8C";
					break;
				case "TS":
					bgc = "bgc-ts";
					break;
				default:
					bgc = "bgc-orange";
					break;
			}
			return bgc;
		}
	},
	computed: {
		// 回報觸發價位
		price() {return this.report.p},
		// 回報清單。
		list() {return this.report.rpt[this.side]},
		isClose() {
			return this.report.rpt.BUY.length < 2 && this.report.rpt.SELL.length < 2;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
	},
	watch: {
		// 如果多、空委託都少於2時不顯示
		isClose(nv){
			if(nv) this.$store.state.thunder.selectedPrice = "";
		}
	},
}
</script>
<style scoped>
.order-list-ctn {
	height: 30vh;
	border: 1px solid #666;
}
.order-list-ctn.BUY {
	top: -15vh;
	left: 0vw;
	right: -15vw;
	z-index: 1;
}
.order-list-ctn.SELL {
	top: -15vh;
	left: -15vw;
	right: 0vw;
	z-index: 1;
}
.bgc-E03434 {
	background: #E03434;
}
.bgc-1B31AB {
	background: #1B31AB;
}
.bgc-6C266F {
	background: #6C266F;
}
.bgc-018C8C {
	background: #018C8C;
}
.circle-icon {
	border-radius: 50%;
	background: black;
}
.expand-leave-to,
.expand-enter {
	height: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.expand-leave-active,
.expand-enter-active {
	transition-duration: 0.3s;
	transition-property: height;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.expand-leave,
.expand-enter-to {
	height: 30vh;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.bgc-sp {background-color: #3399FF !important;}
.bgc-sl, .bgc-ts {background-color: #9933FF !important;}
.desktop .order-list-ctn {
	height: 15em;
}
.desktop .order-list-ctn.BUY {
	top: -7em;
	left: 0;
	right: -3em;
}
.desktop .order-list-ctn.SELL {
	top: -7em;
	left: -3em;
	right: 0;
}
.desktopExpand-leave-to,
.desktopExpand-enter {
	opacity: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.desktopExpand-leave-active,
.desktopExpand-enter-active {
	transition-duration: 0.3s;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.desktopExpand-leave, .desktopExpand-enter-to {
	opacity: 1;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
</style>