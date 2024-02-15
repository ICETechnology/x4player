<template>
    <div class="combine-position-card-ctn flex-col tcend" @contextmenu.prevent="(e)=>{$emit('contextMenu', combinePositionData)}">
		<div class="flex-row combine-position-data-ctn" v-if="!isDesktop">
			<div class="cell0 flex-center expand-btn" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
				<i class="material-icons">{{iconType}}</i>
			</div>
			<div class="flex-1 flex-start">
				<div v-html="getCombineContract()" />
			</div>
			<!-- 買賣方向 -->
			<div class="cell1 flex-center" :class="[$clr0(combinePositionData.$NET_QTY)]">
				{{$ln(combinePositionSide)}}
			</div>
			<!-- 净倉(暫不依正負數調整顏色，因SERVER版本新舊會無法正常顯示負數資料https://trello.com/c/NNoKijZP/) -->
			<div class="cell1 flex-center">
				{{Math.abs(combinePositionData.$COMPOSITE_QTY)}}
			</div>
			<!-- 占用保证金 -->
			<div class="cell2 flex-center" :class="[$clr0(combinePositionData.TOTAL_MARGIN)]">
				{{$displayPL(combinePositionData.TOTAL_MARGIN)}}
			</div>
		</div>
    	<div v-if="!isDesktop && expand" class="expand-ctn flex-row flex-center">
			<div class="flex-1"></div>
			<!-- 策略代碼為'0'時不啟用拆分功能，0為未定義策略不做處理。 -->
			<div class="rbtn w20vw mglr1 tcef" @click.stop="onBtnSplit" :class="{'disabled': disableSplit}">{{$ln(`拆分`)}}</div>
		</div>
		<!-- 桌機版 -->
		<div class="flex-row combine-position-data-ctn" v-if="isDesktop">
			<div class="cell1 flex-start">{{combinePositionData.SPREAD_TYPE}}</div>
			<div class="flex-1 flex-start">
				<div v-html="getCombineContract()" />
			</div>
			<!-- 净倉(暫不依正負數調整顏色，因SERVER版本新舊會無法正常顯示負數資料https://trello.com/c/NNoKijZP/) -->
			<div class="cell1 flex-center">
				{{combinePositionData.$COMPOSITE_QTY}}
			</div>
			<!-- 占用保证金 -->
			<div class="cell2 flex-center" :class="[$clr0(combinePositionData.TOTAL_MARGIN)]">
				{{$displayPL(combinePositionData.TOTAL_MARGIN)}}
			</div>
		</div>
    </div>
</template>

<script>
import CombinePositionOrder from "@/components/CombinePositionOrder.vue";
export default {
	props: ["combinePositionData", "expandSid", "uid"],
	data() {
		return {
			expand: false,
        }
	},
	beforeMount() {
	},
    methods: {
		clrSide(side){
			if(side === "BUY")
				return "clr-up";
			else
				return "clr-dn";
		},
		getCombineContract() {
			let el = `<span>${this.combinePositionData.SPREAD_TYPE}</span> 
					<span class="${this.clrSide(this.composite1Data.SIDE)}">${M4C.Symbol.getCNM4(this.composite1Data.SYMBOL)}</span>`;
			if(this.isDesktop && this.composite2Data)
				el = `<span class="${this.clrSide(this.composite1Data.SIDE)}">${M4C.Symbol.getCNM4(this.composite1Data.SYMBOL)}</span> & <span class="${this.clrSide(this.composite2Data.SIDE)}">${M4C.Symbol.getCNM4(this.composite2Data.SYMBOL)}</span>`;
			else if(this.composite2Data){
				el += ` &<br><span class="${this.clrSide(this.composite2Data.SIDE)}">${M4C.Symbol.getCNM4(this.composite2Data.SYMBOL)}</span>`;
			}
			return el;
		},
		/** 點擊展開/收合圖示 */
		onBtnExpand() {
			if (this.iconType === "block")
				return;
			this.expand = !this.expand;
			// 展開時通報上層
			if (this.expand) {
				this.$emit("onExpand", this.uid);
			}
		},
		/** 拆分组合 */
		onBtnSplit() {
			eventBus.$emit("POPUP-DIALOG", CombinePositionOrder, {"type": 'split', "data": this.combinePositionData}, {transName: 'float'});
		},
	},
	components: {},
	watch: {
		// 上層帶來的 expandSid 改變時，檢查自己是否應該閉合/展開
		propExpandSid(nv) {
			this.expand = nv===this.uid;
		},
		expand(nv){
			eventBus.$emit("EXPAND");
		}
	},
	computed: {
		$clr0() {return this.$store.state.fn.$clr0;},
		$displayPL() {return this.$store.state.fn.$displayPL;},
		iconType() {
			if (this.expand)
				return "arrow_drop_up";
			else
				return "arrow_drop_down";
		},
		propExpandSid() {
			return this.expandSid;
		},
		composite1Data() {
			return this.combinePositionData.COMPOSITE_LIST[0];
		},
		composite2Data() {
			return this.combinePositionData.COMPOSITE_LIST[1];
		}, 
		disableSplit(){
			let exgId = M4C.Symbol.getExchangeName(this.composite1Data.SYMBOL);
			// 不支援組拆的策略代碼 或 不支援的交易所。
			return Number(this.combinePositionData.STRATEGY) <= 0 || (this.supportSplitCompositeList.indexOf(exgId) < 0);
		},
		combinePositionSide() {
			if(this.combinePositionData.$NET_QTY > 0) return '买';
			if(this.combinePositionData.$NET_QTY < 0) return '卖';
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 交易所策略對映表
		// 由於公開設定的CONFIG覆蓋各貼牌的CONFIG機制實做在1.84。因此1.83在這裡先做個相容處理。
		COMPOSITE_EXG_STRATEGYMAP() {
			// 預設CONFIG清單
			const defaultMap = this.$store.state.config.CONFIG.COMPOSITE_EXG_STRATEGYMAP || "";
			// 公開設定
			const publicPdSetting = this.$store.state.config.publicPdSetting;
			try {
				return publicPdSetting.CONFIG.COMPOSITE_EXG_STRATEGYMAP || defaultMap;
			} catch(e) { return defaultMap;}
		},
		// 支持拆分組合持倉的交易所清單(由交易所策略對映表取key轉換方式取得)
		supportSplitCompositeList() {
			try {
				return Object.keys(this.COMPOSITE_EXG_STRATEGYMAP);				
			} catch (error) { return [];}
		},
	}
}
</script>

<style scoped>
.combine-position-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
}
.expand-ctn {
	padding: 2vw;
}
.desktop .combine-position-data-ctn {
	padding-top: 0.8em;
	padding-bottom: 0.8em;
	padding-right: 0.8em;
}
</style>