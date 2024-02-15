<template>
	<div class="FULL">
		<DesktopContainerDropperBlock class="drop-ctn ct" @onDrop="onDrop('flex-col', 'center')"/>
		<DesktopContainerDropperBlock class="drop-ctn tp" @onDrop="onDrop('flex-col', 'top')"/>
		<DesktopContainerDropperBlock class="drop-ctn bt" @onDrop="onDrop('flex-col', 'bottom')"/>
		<DesktopContainerDropperBlock class="drop-ctn lt" @onDrop="onDrop('flex-row', 'left')"/>
		<DesktopContainerDropperBlock class="drop-ctn rt" @onDrop="onDrop('flex-row', 'right')"/>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			dragEnter: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onDrop(flex, side) {
			this.$emit('onDrop', flex, side);
			this.dragEnter = false;
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
.drop-ctn.dragEnter {
	opacity: 0.5;
	background: #999;
	border: 1px dashed white;
}
.drop-ctn {
	position: absolute;
}
.drop-ctn.ct {
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}
.drop-ctn.tp {
	top: 0;
	left: 0;
	right: 0;
	height: 30%;
}
.drop-ctn.bt {
	bottom: 0;
	left: 0;
	right: 0;
	height: 30%;
}
.drop-ctn.lt {
	top: 0;
	left: 0;
	bottom: 0;
	width: 30%;
}
.drop-ctn.rt {
	top: 0;
	right: 0;
	bottom: 0;
	width: 30%;
}
</style>