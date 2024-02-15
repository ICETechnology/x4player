<template>
    <div class="combine-report-card-ctn flex-col tcend">
		<div class="flex-row combine-report-data-ctn" v-if="!isDesktop">
			<div class="cell0 flex-center expand-btn" @click.stop="onBtnExpand" @touchstart.stop="" @touchend.stop="">
				<i class="material-icons">{{iconType}}</i>
			</div>
			<!-- 合約 -->
			<div class="flex-start flex-col cell1">
				<SymbolCNM4 :sid="combinePositionData.SYMBOL" class="w100p" :optWrap="true" :class="clrSide(this.combinePositionData.SIDE)"/>
				<SymbolCNM4 :sid="combinePositionData.SYMBOL2" class="w100p" :optWrap="true" :class="clrSide(this.combinePositionData.SIDE2)" v-if="combinePositionData.SYMBOL2"/>
			</div>
			<!-- 狀態 | 策略 -->
			<div class="flex-1 flex-center flex-col">
				<div class="flex-row">
					<span>{{$ln(typeMap[combinePositionData.TYPE])}}</span>
					<span>{{$ln(statusMap[combinePositionData.STATUS])}} </span>
				</div>
				<span> {{$ln(getstrategyMap(combinePositionData.STRATEGY))}}</span>
			</div>
			<!-- 數量/時間 -->
			<div class="cell2 flex-center flex-col">
				<span>{{combinePositionData.QTY}}</span>
				<span>{{receiveTime}}</span>
			</div>
		</div>
    	<div v-if="!isDesktop && expand" class="expand-ctn flex-col">
			<div class="flex-row mgb1">
				<span class="font-size-small clr-gray">{{$ln('单号')}}：</span>
				<span>{{combinePositionData.APPLY_ID}}</span>
			</div>
			<div class="flex-row flex-1 space-between">
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('时间')}}</span>
					<span>{{receiveTime}}</span>
				</div>				
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('状态')}}</span>
					<span>{{$ln(statusMap[combinePositionData.STATUS])}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('策略')}}</span>
					<span>{{$ln(getstrategyMap(combinePositionData.STRATEGY))}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('操作')}}</span>
					<span>{{$ln(typeMap[combinePositionData.TYPE])}}</span>
				</div>
				<div class="flex-col">
					<span class="font-size-small clr-gray">{{$ln('数量')}}</span>
					<span>{{combinePositionData.QTY}}</span>
				</div>
			</div>
			<div class="flex-row mgt1" v-if="combinePositionData.MSG">
				<span class="font-size-small clr-gray">{{$ln('備註')}}：</span>
				<span>{{combinePositionData.MSG}}</span>
			</div>
		</div>
		<!-- 桌機版 -->
		<div class="flex-row combine-report-data-ctn" v-if="isDesktop">
			<!-- 時間 -->
			<div class="flex-center cell2">{{receiveTime}}</div>
			<!-- 合約 -->
			<div class="flex-start flex-row flex-1 contracts-ctn" v-if="isDesktop">
				<div v-html="getCombineContract()" />
			</div>
			<!-- 單號 -->
			<div class="flex-end cell1">{{combinePositionData.APPLY_ID || '--'}}</div>
			<!-- 狀態 -->
			<div class="flex-center cell2">
				<div class="flex-row">
					<!-- 類型 -->
					<span>{{$ln(typeMap[combinePositionData.TYPE])}}</span>
					<!-- 結果 -->
					<span>{{$ln(statusMap[combinePositionData.STATUS])}} </span>
				</div>
			</div>
			<!-- 策略 -->
			<div class="flex-center cell2">{{$ln(getstrategyMap(combinePositionData.STRATEGY))}}</div>
			<!-- 數量 -->
			<div class="flex-center cell2">{{combinePositionData.QTY}}</div>
			<div class="flex-start cell1">{{combinePositionData.MSG || "--"}}</div>			
		</div>
    </div>
</template>

<script>
export default {
	props: ["combinePositionData", "expandSid"],
	data() {
		return {
			expand: false,
			typeMap: {
				COMBINE:"組合", SPLIT:"拆解"
			},
			statusMap: {
				"PendingNew": "申请中",
				"New": "成功",
				"Rejected": "失败",
			},
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
		/** 點擊展開/收合圖示 */
		onBtnExpand() {
			if (this.iconType === "block")
				return;
			this.expand = !this.expand;
			// 展開時通報上層
			if (this.expand) {
				this.$emit("onExpand", this.combineId);
			}
		},
		getstrategyMap(strategy) {
			let strategyText = "";
			let exgId = M4C.Symbol.getExchangeName(this.combinePositionData.SYMBOL);
			const strategyObj = this.strategyMap[strategy];
			// 不在個股期權交易所清單中時以futName優先取出策略名稱
			if(!~this.stkOptionExgList.indexOf(exgId)) {
				strategyText = strategyObj.futName || strategyObj.N;
			}
			else
				strategyText = strategyObj.N
			return strategyText || "未知策略";
		},
		getCombineContract() {
			let el = `<span class="${this.clrSide(this.combinePositionData.SIDE)}">${M4C.Symbol.getCNM4(this.combinePositionData.SYMBOL)}</span>`;
			if(this.isDesktop && this.combinePositionData.SYMBOL2)
				el += ` &  <span class="${this.clrSide(this.combinePositionData.SIDE2)}">${M4C.Symbol.getCNM4(this.combinePositionData.SYMBOL2)}</span>`;
			else if(this.combinePositionData.SYMBOL2){
				el += ` &<br><span class="${this.clrSide(this.combinePositionData.SIDE2)}">${M4C.Symbol.getCNM4(this.combinePositionData.SYMBOL2)}</span>`;
			}
			return el;
		},
	},
	components: {},
	watch: {
		// 上層帶來的 expandSid 改變時，檢查自己是否應該閉合/展開
		propExpandSid(nv) {
			this.expand = nv==this.combineId;
		},
		expand(nv){
			eventBus.$emit("EXPAND");
		}
	},
	computed: {
		combineId() {
			// 為相容舊版，所以先取ID當KEY沒有才取舊有的APPLY_ID
			return this.combinePositionData.ID || this.combinePositionData.APPLY_ID;
		},
		receiveTime() {
			if(this.combinePositionData.RECEIVE_TIME)
				return new Date(this.combinePositionData.RECEIVE_TIME).time8()
			else return "--";
		},
		iconType() {
			if (this.expand)
				return "arrow_drop_up";
			else
				return "arrow_drop_down";
		},
		propExpandSid() {
			return this.expandSid;
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
		// 策略對映表
		strategyMap() {
			return M4C.CombinePosition.strategyMap;
		},
		// 股票期權交易所清單(用來判斷是否顯示不同策略名稱)
		stkOptionExgList() {return M4C.CombinePosition.stkOptionExgList;},
	}
}
</script>

<style scoped>
.combine-report-card-ctn {
	border-bottom: 1px solid #666;
}
.combine-report-data-ctn {
	padding-top: 2vw;
	padding-bottom: 2vw;
	padding-right: 2vw;
}
.expand-ctn {
	padding: 2vw;
}
.desktop .combine-report-card-ctn {
	border: none;
}
.desktop .combine-report-data-ctn {
	padding-top: 0.8em;
	padding-bottom: 0.8em;
	padding-right: 0.8em;
}
</style>