<template>
	<thead><tr class="">
		<th v-for="(obj,idx) in columns" v-if="!obj.hide" class="nowrap" :style="{'text-align': obj.align || 'right'}"
			ref="th" draggable="true" @dragstart="onDragStart(obj, idx)" @dragend="onDragEnd"
			@dragleave.prevent="dragTo = -1" @dragover.prevent="onDragOver(idx)" @drop="onDrop(idx)">
			<!-- 插入箭頭圖示 -->
			<i class="material-icons insert-icon" v-if="displayInsertIcon(idx)" :class="{'icon-right': idx===columns.length-1 && dragTo===idx+1}">forward</i>
			<!-- 標題文字 -->
			{{obj.label}}
		</th>
	</tr></thead>
</template>

<script>
export default {
	props: ['columns'],
	data() {
		return {
			dragItem: null,
			dragTo: -1,
			dragFrom: -1,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 拖曳開始 */
		onDragStart(obj, idx){
			this.dragFrom = idx;
			this.dragItem = obj;
		},
		/** 拖曳在欄位上時，計算要插入的位置 */
		onDragOver(idx) {
			let elm = this.$refs.th[idx];
			let width = elm.clientWidth;
			this.dragTo = idx + (event.offsetX > width/2 ? 1 : 0);
		},
		/** 拖曳在欄位上放開 */
		onDrop(idx) {
			this.columns.move(this.dragFrom, this.dragTo > this.dragFrom ? this.dragTo - 1 : this.dragTo);
		},
		/** 拖曳結束 */
		onDragEnd() {
			this.dragItem = null;
		},
		/** 是否顯示插入圖示 */
		displayInsertIcon(idx) {
			if (this.dragItem) {
				if (this.dragTo===idx) return true;
				if (this.dragTo===idx+1 && idx===this.columns.length-1) return true;
			}
		},		
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
th:hover {
	color: aqua;
}
</style>