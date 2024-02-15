<template>
	<div class="flex-col flex-1 Option-Column-Config-ctn">
		<div class="flex-col flex-1 Option-Column-ShowList">
			<div class="flex-1 posr">
				<ScrollBounce :disable="showDraging">
					<!-- 拖拉調整順序 by draggable -->
					<draggable v-model="sortedShowList" handle=".handle"
						v-bind="dragOptions" @start="showDraging = true" @end="()=>{showDraging = false;}">
						<!-- 拖拉調整順序效果 -->
						<transition-group type="transition" :name="!showDraging ? 'flip-list' : null">
							<!-- 所有顯示欄位的資料清單 -->
							<div v-for="(showItem, key) in sortedShowList" class="border-bottom flex-1 flex-center ht3 pdlr3" :key="key" >
								<i class="material-icons md-24 clr-up pd2" @click="removeItem(showItem)">remove_circle</i>
								<div class="felx-1 flex-col w100p">{{$ln(showItem.head)}}</div>
								<i class="material-icons md-24 clr-gray2 pd2 handle">menu</i>
							</div>
						</transition-group>
					</draggable>
				</ScrollBounce>
			</div>	
		</div>
		<div class="flex-col flex-top Option-Column-HideList-title pdlr5 pdtb1 bgc-opt-gray">{{$ln("隐藏栏位")}}</div>
		<div class="flex-col flex-1 Option-Column-HideList">			
			<div class="flex-1 posr">
				<ScrollBounce :disable="hideDraging">
					<!-- 拖拉調整順序 by draggable -->
					<draggable v-model="sortedHideList" handle=".handle"
						v-bind="dragOptions" @start="hideDraging = true" @end="hideDraging = false">
						<!-- 拖拉調整順序效果 -->
						<transition-group type="transition" :name="!hideDraging ? 'flip-list' : null">
							<!-- 所有隱藏欄位的資料清單 -->
							<div v-for="(hideItem, idx) in sortedHideList" class="border-bottom flex-row flex-1 flex-center ht3 pdlr3" :key="idx" >
								<i class="material-icons md-24 clr-up pd2" @click="addItem(hideItem)">add_circle</i>
								<div class="felx-1 flex-col w100p">{{$ln(hideItem.head)}}</div>
								<i class="material-icons md-24 clr-gray2 pd2 handle" @click="()=>{}">menu</i>
							</div>
						</transition-group>
					</draggable>
				</ScrollBounce>
			</div>
			<div class="mgb10 flex-row flex-center">
				<Button class="font-size-big btn-cancel mgr2" @click="onDefault">{{$ln("回复预设")}}</Button>
				<Button class="font-size-big btn-confirm mgl3" @click="onConfirm">{{$ln("确定")}}</Button>
			</div>
		</div>
	</div>
</template>
<script>
import draggable from 'vuedraggable'

export default {
	data(){
		return {
			/** 調整順序拖曳中 */
			showDraging: false,
			/** 調整順序拖曳中 */
			hideDraging: false,
			/** 所有欄位設定 */
			columnsConfig: [],
		}
	},
	props:["param"],
	mounted() {
		this.columnsConfig = this.$disObserver(this.$store.state.opt.columns);
	},
	components: {
		draggable,
	},
	methods: {
		// 隱藏欄位(驅動響應方式)
		removeItem(item) {
			this.$set(item, 'hide', true);
		},
		// 隱藏欄位(驅動響應方式)
		addItem(item) {
			this.$set(item, 'hide', false);
		},
		
		onDefault() {
			// 回復預設清單(ui)。
			this.columnsConfig = this.$disObserver(this.$store.state.opt.defaultColumns);
			// 回復預設清單(vuex)
			this.$store.state.opt.columns.splice(0);
			for(let idx = 0; idx < this.$store.state.opt.defaultColumns.length; idx++){
				this.$store.state.opt.columns.push(this.$store.state.opt.defaultColumns[idx]);
			}
			this.$store.state.notify(`重设完成`);
		},
		onConfirm() {
			// 儲存清單(vuex)
			this.$store.state.opt.columns.splice(0);
			for(let idx = 0; idx < this.mergeList.length; idx++){
				this.$store.state.opt.columns.push(this.mergeList[idx]);
			}
			eventBus.$emit("CLOSE-DIALOG");
		},
	},
	computed: {
		$disObserver () {
			return this.$store.state.fn.$disObserver;
		},
		dragOptions() {
			return {
				animation: 200,
				group: "description",
				ghostClass: "ghost"
			};
		},
		/** 顯示欄位清單 */
		showList(){return this.columnsConfig.filter(col => {return !col.hide;});},
		/** 隱藏欄位清單 */
		hideList(){return this.columnsConfig.filter(col => {return col.hide;});},		
		/** 經記憶排序後的 expandList (響應式) */
		sortedShowList: {
			get: function () {
				return this.showList;
			},
			set: function (newValue) {
				// 拖曳改變順序後的結果轉成 [sid1, sid2, ...] 格式
				this.showList.splice(0);
                for(let idx = 0; idx < newValue.length; idx++){
					this.showList.push(newValue[idx]);
				}
			},
		},
		/** 經記憶排序後的 expandList (響應式) */
		sortedHideList: {
			get: function () {
				return this.hideList;
			},
			set: function (newValue) {
				// 拖曳改變順序後的結果轉成 [sid1, sid2, ...] 格式
				this.hideList.splice(0);
                for(let idx = 0; idx < newValue.length; idx++){
					this.hideList.push(newValue[idx]);
				}
			},
		},
		mergeList() {
			return this.sortedShowList.concat(this.sortedHideList);
		},
	},
	watch: {},
}
</script>
<style scoped>

</style>