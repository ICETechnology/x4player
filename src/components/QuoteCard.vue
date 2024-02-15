<template>
	<div ref="qcCtn" class="quote-card-ctn flex-col tcend" :class="{'pointer-events-none': !isAvailable}" @click="onQuoteCardClick" :sid="sid" v-waypoint="{active: true, callback: onWaypoint}">
		<div class="row-ctn flex-1 flex-row">
			<!-- 展開圖示 -->
			<div class="cell0 flex-center expand-btn" :class="{'cell0-large':largeSize}" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
				<i class="material-icons" v-if="moreContracts && moreContracts.length > 1">{{expand ? 'arrow_drop_up' : 'arrow_drop_down'}}</i>
			</div>
			<div class="cell1 pdr1 flex-col flex-1 symbol-name-ctn">
				<!-- 合約名稱 -->
				<div class="flex-1 flex-start name flex-row" :class="{'font-size-big font-bold':largeSize}">
					<div>{{getName}}</div>
				</div>
				<!-- 代碼月份 -->
				<div class="flex-start font-size-micro" :class="{'font-size-small':largeSize}">
					<span class="clr-gray mr5">{{symbolMonth}}</span>
					<!-- <div v-if="hasOpt" class="has-opt-btn flex-center" @click="onClickOpt">{{$ln(`权`)}}</div> -->
				</div>
			</div>
			<!-- 行情內容 -->
			<transition name="loop" v-if="visibility && !suspend && !qo.$suspend">
				<component class="flex-1" :is="quoteStyle" :sid="sid" :qo="qo" :sortedList="sortedList"/>
			</transition>
		</div>
		<!-- 展開區塊 (其它月份) -->
		<div class="flex-col expand-ctn" v-if="expand">
			<QuoteCard class="flex-1" v-for="(otherSid,i) in moreContracts" :sid="otherSid" :suspend="suspend" :inside="true"
				:key="`QuoteCard-${sid}-${i}`" :sortedList="sortedList" ></QuoteCard>
		</div>
	</div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';
import QuoteCardBSPQ from '@/components/QuoteCardBSPQ';
import QuoteCardPPV from '@/components/QuoteCardPPV';
/** 滾動監聽 */
import Vue from 'vue';
import VueWaypoint from 'vue-waypoint'

export default {
	mixins: [QuoteAgent],
	props: ["sid", "expandObj", "suspend", "inside", "inFavorite", "sortedList"],
	data() {
		return {
			/** 當前是否展開 */
			expand: false,
			visibility: false,
		};
	},
	beforeMount() {
		Vue.use(VueWaypoint);
	},
	methods: {
		onQuoteCardClick(event) {
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
		onBtnExpand() {
			// 多於1個合約才展開
			if(this.moreContracts && this.moreContracts.length < 2) return;
			this.expand = !this.expand;
			if (this.expand) {
				this.$emit("onExpand", this.$refs.qcCtn);
				this.$store.state.sync.quoteCardExpandID = this.sid;
			}
		},
		/** 點擊『權』按鈕 */
		onClickOpt() {
			event.stopPropagation();
			// 轉為對應的 OptSid 後，作為切到期權後預設要顯示的商品
			this.$store.state.opt.selectedSymbol = M4C.Symbol.getOSIDbyFSID(this.sid);
			// 切換至期權版面
			this.$store.state.bottomBar.activeKey = "option";
		},
		/** 滾動監聽 */
		onWaypoint({going, direction}) {
			// console.log(`QuoteCard.onWaypoint`, this.sid, going, direction);
			// this.visibility = going === "in";
			// Waypoint:out 超過 1 秒才設定為不可視，已解決行情ScrollBounce發生會快速 out->in 導致隱藏後又顯示的問題
			if (going === 'in') {
				this.visibility = true;
				clearTimeout(this.offVisibilityTimeout);
			}
			else {
				this.offVisibilityTimeout = setTimeout((self)=>{self.visibility = false;}, 1000, this);
			}
		},
	},
	computed: {
		largeSize(){return this.$store.state.config.largeSize;},
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 本商品點擊展開的更多 sid */
		moreContracts() {
			return this.expandObj ? this.expandObj.moreContracts : [];
		},
		// "澳幣"
		getName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		// "6A1906"
		symbolMonth() {
			if (this.twMode)
				return `${this.displayAsHot?'熱門':''}${M4C.Symbol.getCIDM4(this.sid)}`;
			else
				return this.displayAsHot ? this.$ln("主连") : M4C.Symbol.getCIDM4(this.sid);
		},
		// 漲跌 (漲跌幅%)
		changeText() {
			let qo = this.qo;
			if (!qo.$cg) return '';
			let p = qo.$cg > 0 ? '+' : '';
			return `${p}${qo.$cg} (${p}${qo.$cgr})`;
		},
		// 當前展開的商品代碼
		quoteCardExpandID() {
			return this.$store.state.sync.quoteCardExpandID;
		},
		/** 是否包含期权商品 */
		hasOpt() {
			return M4C.Symbol.getOSIDbyFSID(this.sid);
		},
		/** 視為熱門月(主連) */
		displayAsHot() {
			// 在展開列表中 -> 不顯示為主連
			if (this.inside)
				return false;
			// 自選群組內時 -> 若商品代碼最後為 HOT 時，要顯示主連
			if (this.inFavorite) {
				return M4C.Symbol.isHotSID(this.sid);
			}
			// 非自選群組時 -> 該商品月份屬熱門月，要顯示主連
			else {
				return M4C.Symbol.isHotSymbol(this.sid);
			}
		},
		/** 報價卡片類別 */
		quoteStyle() {
			return this.$store.state.config.quoteStyle;
		},
		// 有支援的商品
		isAvailable() {return this.$checkSupportedItem(this.sid);},
		// 判斷是否支援
		$checkSupportedItem() {return this.$store.state.fn.$checkSupportedItem;},
	},
	watch: {
		// 當前展開的商品代碼
		quoteCardExpandID(nv) {
			if (nv != this.sid) {
				this.expand = false;
			}
		},
		expand(nv) {eventBus.$emit("EXPAND");},
	},
	components: {QuoteCardBSPQ, QuoteCardPPV}
};
</script>

<style scoped>
.row-ctn {
	/* 以下數值已在 browser/android/iphone6  360px/375px 驗證過 */
	/* height: 12vw; */
	min-height: 12vw;
	padding: 2.5vw 0 1.5vw 0;
}
/* 寬度設定 */
.cell0 {width: 6vw; max-width: 6vw; min-width: 6vw;}
.cell0-large {width: 8vw; max-width: 8vw; min-width: 8vw;}
.cell1 {width: 30vw; max-width: 29vw; min-width: 29vw;}

.h8 {
	height: 3px;
}
/* 权 */
.has-opt-btn {
	width: 20px;
	height: 20px;
	border-radius: 3px;
	color: white;
	background-color: #4A90E2;
}

/* 切換效果 */
.loop-leave-to,
.loop-enter {
	opacity: 0;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.loop-leave-active,
.loop-enter-active {
	transition-duration: 0.3;
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.loop-leave,
.loop-enter-to {
	opacity: 1;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
/* 展開區 */
.expand-ctn {
	background-color: initial;
}
</style>