<template>
    <div class="FULL desktop-quote flex-col font-size-small" @click="e=null">
		<!-- 工具列 -->
		<div class="flex-row flex-center">
			<!-- 1. 交易所/商品選單 下拉選擇器 -->
			<DesktopExgSymbolSelector v-if="!selfselect" @contractList="onContractList" :ucid="ucid" @symbolChange="onSymbolChange" />
			<!-- 2. 庫存/自選 下拉選擇器 -->
			<DesktopSelfSelectSelector v-if="selfselect" @contractList="onContractList" :ucid="ucid" />
			<!-- 空白 -->
			<div class="flex-1"></div>
			<!-- 欄位設定 -->
			<ColumnConfigIcon ref="columnConfigIcon" :default="$store.state.desktop.quoteDefaultColumns" :current="$store.state.desktop.quoteColumns" class="icon-btn" :title="$ln('栏位设定')" />
			<!-- 加入自選功能組件 -->
			<FavoriteIcon ref="favoriteIcon" class="icon-btn" :symbol="$store.state.selectedSymbol.ID" />
		</div>
		<div class="flex-1 posr overflow-auto pdlr2">
			<table class="desktop mw100p" cellspacing="0">
				<!-- 支持拖曳欄位，點擊排序 -->
				<DesktopTableHead :columns="columns" />
				<tbody>
					<DesktopQuoteRow v-for="sid in contractList" :sid="sid" :spaceRowObj="spaceRowObj" :displayAsHot="displayAsHot" 
						@contextMenu="onContextMenu" />
					<!-- 製作出各欄最適寬度的列 -->
					<tr class="space-row"><td v-for="obj in columns" class="nowrap">{{`_${spaceRowObj[obj.key] || ''}`}}</td></tr>
				</tbody>
			</table>
			<!-- 狀態章 -->
			<Stamp v-if="contractList.length===0" :stampStatus="stampStatus" />
		</div>
    </div>
</template>

<script>
export default {
	props: ['ucid', 'selfselect'],
	data() {
		return {
			/** 讓所有列整合出各欄最大寬度的容器 */
			spaceRowObj: {},
			contractList: [],
			e: null,
			displayAsHot: false,
		}
	},
	beforeMount() {
		this.$store.state.status.quoteTabID = this.$store.state.status.quoteTabID || 'SHFE';
	},
    mounted() {
	},
	beforeDestroy() {},
	components: {},
    methods: {
		onContractList(list) {
			this.contractList = list || [];
		},
		/** 右鍵選單 */
		onContextMenu(sid, obj, row) {
			sid = this.displayAsHot ? M4C.Symbol.toHotSymbol(sid) : sid;
			this.contextmenu.pop({
				list: [
					// 加入移除自選
					this.contextmenu.optFav(sid),
					// --- 分隔線 ---
					{'line': true},
					// 下單盒
					this.contextmenu.optOrder(()=>{row.popupOrder(obj)}),
					// --- 分隔線 ---
					{'line': true},
					// 欄位設定
					this.contextmenu.optColumn(this.$refs.columnConfigIcon.onColumnConfig),
				],
				param: this.sid,
			});
		},
		// 商品選單切換 -> 判斷是否選在熱門月
		onSymbolChange(s) {
			this.displayAsHot = s==="HOT";
		},
	},
	watch: {
		/** 切换交易所 */
		'$store.state.status.quoteTabID'() {
			this.spaceRowObj = {};
		},
	},
    computed: {
		contextmenu() {
			return this.$store.state.desktop.contextmenu;
		},
		/** 是否超過一組自選群組 */
		multiSS() {
			return this.$store.state.data.ssgList.length > 1;
		},
		sid() {
			let sid = this.$store.state.selectedSymbol.ID;
			return this.contractList.indexOf(sid) !== -1 ? sid : null;
		},
		columns() {
			return this.$store.state.desktop.quoteColumns;
		},
		stampStatus() {
			return this.contractList.length === 0 ? 'EMPTY' : '';
		},
	},
}
</script>

<style scoped>
.space-row {
	opacity: 0;
	line-height: 1px;
}
</style>