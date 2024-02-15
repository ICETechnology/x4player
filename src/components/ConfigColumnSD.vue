<template>
    <div class="config-column-sd flex-col" :class="[param.key, param.maxWidth?'maxWidth':'']">
		<!-- 每列顯示欄數 -->
		<div v-if="param.sample" class="flex-end mgb1 mgr5">
			<div class="col-cnt-ctn flex-row font-size-mini">
				<radio class="radio-ctn flex-row" v-model="columnSD.quote.rowColCnt">
					<span value="3">大</span>
					<span value="4">中</span>
					<span value="5">小</span>
				</radio>
			</div>
		</div>
		<!-- 所見即所得區 -->
		<div v-if="param.sample" class="flex-row pdlr5 pdb2 sample-ctn">
			<component :is="param.sample" class="flex-1" :sid="sid" :isSample="true" :columnKey="columnKey" />
		</div>
		<!-- 拖拉欄位區 -->
		<div class="flex-1 posr pdt2">
			<DragColumn :columnKey="param.key" />
		</div>
		<!-- 下方按鈕區 -->
		<div class="flex-row mgtb5">
			<div class="flex-1 flex-center">
				<Button class="flex-center btn btn-confirm dark" @click="onBtnReset">{{$ln('还原预设')}}</Button>
			</div>
			<div class="flex-1 flex-center">
				<Button class="flex-center btn btn-confirm" @click="onBtnConfirm">{{$ln('确定')}}</Button>
			</div>
		</div>
    </div>
</template>

<script>
import PositionCardSD from "@/components/PositionCardSD.vue";
export default {
	props: ['param'],
	data() {
		return {
		}
	},
	beforeMount() {
		this.$emit('title', '编辑卡片栏位');
		// by 合約設定欄位機制 : 此 columnKey 不存在時，準備複製來用
		if (this.columnKey.indexOf(':') !== -1 && !this.columnSD[this.columnKey]) {
			M4C.ColumnSD.duplicateColumnKey(this.columnKey);
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {PositionCardSD},
    methods: {
		onBtnConfirm() {
			eventBus.$emit("CLOSE-DIALOG");
		},
		onBtnReset() {
			M4C.ColumnSD.resetShowHide(this.param.key);
		},
	},
	watch: {},
    computed: {
		sid() {
			return this.param.sid || this.$store.state.selectedSymbol.ID;
		},
		columnSD() {
			return this.$store.state.columnSD;
		},
		columnKey() {
			return this.param.key;
		},
	},
}
</script>

<style scoped>
.btn {
	width: 8em !important;
	height: 2em;
	border-radius: 2vw;
}
.col-cnt-ctn {
	border: 1px solid #777;
	border-radius: 2px;
}
.radio-ctn {
	border-radius: 0 !important;
	height: auto !important;
}
.radio-ctn span {
	padding: 0 0.5em;
}
/* 最大寬度模式 (適合欄位字很寬的情況) */
.maxWidth /deep/ .drag-column .list-ctn {
	margin-left: 0;
	margin-right: 0;
}
.maxWidth /deep/ .drag-column .item {
	width: 170px;
}
.maxWidth /deep/ .drag-column .item .label {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: inline-block;
	line-height: 24px;
	padding-left: 1vw;
	padding-right: 1vw;
}
</style>