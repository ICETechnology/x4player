<template>
	<div class="FULL flex-center font-size-small" v-if="$store.state.desktop.displayComponents" :class="{'dragging': dragging}" @click="$store.state.desktop.displayComponents = false">
		<div class="desktop-components-ctn popup-box pd2 zindex-9">
			<fieldset v-for="grp in components" class="mgtb5">
				<legend>{{grp.label}}</legend>
				<div class="list-block-left">
					<span class="component-btn pdtb2 pdlr3 mg2 flex-center nowrap" v-for="(obj, idx) in grp.list"
						draggable="true" @dragstart="onDragStart(obj)" @dragend="onDragEnd">{{$ln(obj.label)}}</span>
				</div>
			</fieldset>
		</div>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			/** 拉動中 (用來觸發 class:dragging 以隱藏原始容器) */
			dragging: false,
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onDragStart(obj){
			this.dragging = true;
			console.log('onDragStart : ', obj.label);
			this.$store.state.desktop.dragCom = obj;
		},
		onDragEnd() {
			this.dragging = false;
			this.$store.state.desktop.displayComponents = false;
			console.log('onDragEnd');
			this.$store.state.desktop.dragCom = null;
		},
	},
	watch: {},
    computed: {
		components() {
			return this.$store.state.config.CONFIG.COMPONENTS;
		},
	},
}
</script>

<style scoped>
.desktop-components-ctn {
	position: absolute;
	top: 10%;
	left: 10%;
	width: 80%;
	height: 80%;
}
.grp-label {
	border-bottom: 1px solid #666;
}
.component-btn {
	border-radius: 0.2em;
	background-color: #1A2F47;
	cursor: move;
	cursor: grab;
	min-width: 4em;
}
.component-btn:hover {
	background-color: #333F5A;
}
.dragging {
	transition: 0.01s;
	transform: translateX(-9999px);
}
fieldset {
	/* margin: 20px; */
	padding: 0 10px 10px;
	border: 0px solid #333;
	border-radius: 8px;
}
.popup-box {
	color: #FFF;
	background-color: #1C2333;
}
</style>