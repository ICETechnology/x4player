<template>
    <div class="chess-board-selector-ctn posr flex-center">
		<div class="FULL mask" @click="onClose" />
		<div class="options-ctn flex-row list-block scrolling-y">
			<div class="opt-ctn flex-center" v-for="opt in options" @click="onClick(opt)"
				:class="{selected: opt.selected}">{{opt.label}}</div>
		</div>
    </div>
</template>

<script>
export default {
	props: ["value", "options"],
	data() {
		return {

		}
	},
	beforeMount() {
		// 列表中沒有已選擇選項時，預設選擇第一個選項 (方便性)
		let selectedOpt = this.options.find(opt=>opt.selected);
		if (!selectedOpt) {
			selectedOpt = this.options[0];
			selectedOpt.selected = true;
			this.$emit('input', selectedOpt);
		}
	},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick(opt) {
			this.options.find(opt=>opt.selected).selected = false;
			opt.selected = true;
			this.$emit('input', opt);
			this.$emit('close', opt);
		},
		onClose() {
			this.$emit('close');
		}
	},
	watch: {},
    computed: {
	},
}
</script>

<style scoped>
.chess-board-selector-ctn {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1;
}
.mask {
	background-color: black;
	opacity: .5;
}
.options-ctn {
	width: 75vw;
	padding: 3vw;
	background-color: #333;
	border-radius: 2vw;
	z-index: 1;
	max-height: 60vh;
}
.opt-ctn {
	width: 35vw;
	height: 10vw;
	border: 1px solid #999;
	border-radius: 1vw;
	margin-top: 2vw;
}
.opt-ctn.selected {
	color: orange;
	border: 1px solid orange;
}
</style>