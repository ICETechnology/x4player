<!-- 指定交易所後的行情容器元件 -->
<template>
    <div class="flex-col quote-market-content-list" v-press="onPress">
		<div class="flex-1 posr" v-if="!$store.state.ui.QuoteCardMode">
			<ScrollBounce ref="sb" :disable="dragMode">
				<!-- 拖拉調整順序 by draggable -->
				<component :is="dragMode ? 'draggable' : 'div'" v-model="sortedList"
					v-bind="dragOptions" @start="draging = true" @end="draging = false">
					<!-- 此分類表底下所有的 symbol 對應為 QuoteCard -->
					<component :is="quoteCardClass" v-for="(expandObj, idx) in sortedList" :sid="expandObj.sid" :expandObj="expandObj" @onExpand="onExpand"
						:key="`QMS-${idx}-${expandObj.sid}`" :suspend="suspend" :tab-key="tabKey" :inFavorite="inFavorite"
						:sortedList="sortedList"/>
				</component>
				<Stamp v-if="sortedList && sortedList.length===0" :stampStatus="stampStatus" :ignoreLogin="true" />
			</ScrollBounce>
			<!-- 排序按鈕 -->
			<span class="drag-start-btn flex-center" :class="{check: dragMode}" @click="onSwitchDragMode" v-if="enableSortBtn">
				<i class="material-icons md-36">{{dragMode ? `check` : `sort_by_alpha`}}</i>
			</span>
		</div>
    </div>
</template>

<script>
import draggable from 'vuedraggable'
import MultiStockRow from '@/components/MultiStockRow.vue';
import SortSymbolList from "@/components/SortSymbolList.vue";

export default {
	mixins: [SortSymbolList],
	props: ["param", "suspend", "tabKey"],
	data() {
		return {
			/** 當前為調整順序模式 */
			dragMode: false,
			/** 調整順序拖曳中 */
			draging: false,
			sidOrderList: [],
			sortedList: [],
        }
	},
	beforeMount() {},
    mounted() {
		// 未點選任何商品來產出頁表時，就點選閃電，取當前頁(前後頁 suspend) sortedList 給閃電標頭用
		if(!this.$store.state.status.curContractsList.length && !this.suspend) this.setList(this.sortedList);
	},
	beforeDestroy() {},
	components: {
		draggable,
		MultiStockRow,
	},
    methods: {
		/** 有 QuoteCard 被點擊展開 */
		onExpand(cardCtn) {
			// 沒有指定就略過。
			if(!cardCtn) return;
			// 內容展開後超過螢幕的自動捲動校正機制 (延遲為了讓 expand 內容建立好)
			setTimeout((self)=>{
				let el = self.$refs.sb.$el.querySelector('.scroll-bounce-ctn');
				// 讓卡片內容可顯示完全 (ScrollBounce 裡，隱藏的 ReflashCtn 佔高 75px)
				let top = cardCtn.offsetTop + cardCtn.clientHeight - (el.clientHeight - 75);
				// 新的Top不可超過原卡片的Top，確保原卡片最多被頂到最上方
				top = top > cardCtn.offsetTop ? cardCtn.offsetTop : top;
				// 展開僅准自動往下方捲動
				el.scrollTop = top > el.scrollTop ? top : el.scrollTop;
			}, 100, this);
		},
		/** 長按 */
		onPress(e) {
			let quoteCard = e.srcElement.closest('.quote-card-ctn');
			if(!quoteCard) return;
			let sid = quoteCard.getAttribute("sid");
			// 拖曳中情境時，關閉長按功能
			if (this.$store.state.sync.quoteDragMode)
				return;
			this.$store.commit("setSelectedSymbol", sid);
			// 準備關注合約列表
			this.setList(this.sortedList);
			eventBus.$emit("ORDER", {positionEffect: 'OPEN'});
		},
		onSwitchDragMode() {
			this.dragMode = this.$store.state.sync.quoteDragMode = !this.dragMode;
			if (this.dragMode) {
				eventBus.$emit("FLASHMESSAGE", this.$ln("開啟拖曳改變商品順序"), {"bgClr": "black"});
			}
		},
		setList(sortedList) {
			this.$store.commit("setContractsList", sortedList);
		}
	},
    computed: {
		/** 經記憶排序後的 expandList (響應式) */
		expandObjList: {
			get: function () {
				let list = [...this.propExpandList];
				return list;
			},
			set: function (newValue) {
				// 拖曳改變順序後的結果轉成 [sid1, sid2, ...] 格式
				this.sidOrderList = newValue.map((obj)=>{return obj.sid;});
				localStorage.setItem(this.storageKey, JSON.stringify(this.sidOrderList));
			},
		},
		/** 使傳入參數成為響應式 */
		propExpandList: function() {
            return this.param.expandList;			
		},
		/** 拖曳改順序的設定參數 */
		dragOptions() {
			return {
				animation: 200,
				group: "description",
				disabled: false,
				ghostClass: "ghost"
			};
		},
		storageKey() {
			return `${this.$store.state.config.projectID}_QUOTEMARKET_SORT_${this.$store.state.status.quoteTabID}`;
		},
		/** 交易所ID */
		quoteTabID() {
			return this.$store.state.status.quoteTabID;
		},
		/** 狀態章的狀態 (因為 v-if 有判斷過 length===0 才會顯示，所以這邊不再判斷 length 了) */
		stampStatus() {
			return this.quoteTabID.indexOf("focus") !== -1 ? "SELF_SELECT_EMPTY" : "EMPTY";
		},
		/** 是否正處於自選股裡 */
		inFavorite() {
			return this.quoteTabID.indexOf('focus') === 0 || this.quoteTabID.indexOf('selfselect.idx') === 0;
		},
		/** 報價卡片類別 */
		quoteStyle() {
			return this.$store.state.config.quoteStyle;
		},
		/** 使用哪一種卡片 */
		quoteCardClass() {
			return (this.quoteStyle==='QuoteCardPPV' || this.quoteStyle==='QuoteCardBSPQ') ? 'QuoteCard' : 'QuoteCardExpander';
		},
		/** 啟用排序按鈕及功能 (僅限自選群組) */
		enableSortBtn() {
			return this.$store.state.status.quoteTabType === 'sel';
		},
		// 利用轉字串來簡單避免 ssgList <-> sortedList 無限連動的問題
		sortedListString() {
			return JSON.stringify(this.sortedList.map((obj)=>{return obj.sid;}));
		},
	},
	watch: {
		// 拖曳模式/改變順序 -> 回存自選
		sortedListString(nv) {
			if (this.dragMode) {
				M4C.SelfGroup.saveCurGroup(JSON.parse(nv));
			}
		},
	},
}
</script>

<style scoped>
.quote-market-content-list {
	/* padding: 0 4px; */
	overflow: hidden;
}
.header-ctn {
	color: #BBB;
	padding: 6px 0;
	border-bottom: 1px solid #999;
	z-index: 1;
}

/* 調整商品順序說明文字 */
.drag-memo {
	margin: 10px;
	padding: 4px;
	width: 100%;
	color: white;
	background-color: #333;
}
/* 調整商品順序按鈕 */
.drag-start-btn {
	position: absolute;
	right: 16px;
	bottom: 16px;
	width: 48px;
	height: 48px;
	border-radius: 24px;
	color: white;
	opacity: .5;
	background-color: aqua;
}
/* 調整商品順序按鈕 (打勾狀態) */
.drag-start-btn.check {
	opacity: 1;
}
/* 移動的項目 */
.ghost {
	background: #222;
}
</style>