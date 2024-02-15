<template>
	<div class="block-msg-ctn">
		<span v-if="!bmParam.display" class="flex-bottom h80vw container">
			<slot v-if="false"></slot>
			<span
				class="text"
				v-for="(w, i) in wordList"
				:style="{ 'animation-delay': 0.1 * (i + 1 )+ 's' }"
				:key="i"
				>{{ w }}</span
			>
		</span>
		<!-- 提示訊息 -->
		<BlockMessage
			v-if="bmParam.display"
			:param="bmParam"
			@confirm="onConfirm"
		></BlockMessage>
	</div>
</template>
<script>
export default {
	data() {
		return {};
	},
	props: ["bmParam", "paramText"],
	mounted() {},
	methods: {
		onConfirm() {
			this.$emit("CLOSE");
		},
	},
	computed: {
		word(){return this.paramText || this.$slots.default[0].text;},
		wordList() {if(this.word) return this.word.split('');},
	}
};
</script>
<style scoped>
.block-msg-ctn {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1;
}
.container {
	overflow: hidden;
}
.text {
	animation: animateToRight 3s infinite;
	animation-fill-mode: backwards;
}
@keyframes animateToRight {
	0% {
		transform: translateX(300px);
	}
	20%,
	60% {
		opacity: 1;
		transform: translateX(0);
	}
	90%,
	100% {
		opacity: 0;
		transform: translateX(-300px) scale(0.2);
	}
}
</style>