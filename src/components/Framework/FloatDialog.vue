<template>
	<transition name="show">
    <div class="FULL float-dialog-ctn">
		<div class="FULL flex-center" @click.stop="onClose">
			<div class="flex-col">
				<!-- 關閉圖示 -->
				<!-- <div class="flex-1 flex-bottom-right">
					<i class="material-icons md-36" :class="{landscape: !$store.state.status.isPortrait}">close</i>
				</div> -->
				<!-- 彈出視窗本體 -->
				<div class="component-ctn" @click="stopPropagation">
					<component class="fd-content-bgc rd3" :is="comClass" :param="param" @close="onClose"></component>
				</div>
			</div>
		</div>
		<!-- 彈出時阻擋觸碰事件遮罩，避免長按放開會觸發視窗內事件 -->
		<div v-if="$store.state.sync.floatDialogStopEvent" class="FULL stop-event-mask"/>
    </div>
	</transition>
</template>

<script>
export default {
	props: ["comClass", "param"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		// 停止冒泡以避免觸發關閉視窗事件
		stopPropagation(event) {
			event.stopPropagation();
		},
		onClose() {
			event.stopPropagation();
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.float-dialog-ctn {
	z-index: 4;
}
.component-ctn {
	border-radius: 6px;
}
.landscape {
	position: absolute;
	top: 2vh;
	right: 2vh;
}
</style>