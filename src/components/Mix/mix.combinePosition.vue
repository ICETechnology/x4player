<template>
    <div class="mix-combine-position-ctn FULL flex-col">
		<div class="switch-ctn flex-row space-around">
			<div class="flex-1 flex-center" @click="type='combine'">
				<span class="pd2 switch-btn" :class="{'focus': type=='combine'}">{{$ln('组合持仓')}}</span>
			</div>
			<div class="flex-1 flex-center" @click="type='split'">
				<span class="pd2 switch-btn" :class="{'focus': type=='split'}">{{$ln('组合报单')}}</span>
			</div>
		</div>
		<transition name="show-in">
			<CombinePositionCardList v-if="type=='combine'" key="combine"/>
			<CombineReportCardList v-if="type=='split'" key="split"/>
		</transition>
    </div>
</template>

<script>
import CombinePositionCardList from "@/components/CombinePositionCardList.vue";
import CombineReportCardList from "@/components/CombineReportCardList.vue";

export default {
	props: [],
	data() {
		return {
			type: 'combine',
		}
	},
	mounted() {
	},
	components: {
		CombinePositionCardList,
		CombineReportCardList
	}
}
</script>

<style scoped>
.focus {
	border-bottom: 3px solid #F5A623;
}
/* 左右滑入效果 */
.show-in-enter-active{
	transition-duration: 0.5s;
	transition-property: opacity, transform;
	transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1);
	overflow: hidden;
	touch-action: none; /* 動畫中不再接受 touch 以免造成動畫異常 */
}
.show-in-enter{
	opacity: 0;
	transform: translate(2em, 0);
	touch-action: none;
}
.show-in-leave-active {
	opacity: 0;
	transform: translate(-2em, 0);
	touch-action: none;
}
</style>