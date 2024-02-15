<template>
	<div class="checkbox-wrapper">
		<span class="check-label" :class="isTrue?'checked':'unchecked'" @click.stop="onChange">
			<i class="material-icons" v-if="!uiStyle">done</i>
			<span v-if="uiStyle" :class="uiStyle"> </span>
			<slot></slot>
		</span>
	</div>
</template>
<script>
export default {
	props: ["value", "uiStyle", "reverse"],
	data() {
		return {
			uid: "".random(),
		};
	},
	methods: {
		onChange(){
			this.$emit('input', !this.value);
		}
	},
	computed: {
		isTrue() {
			if(this.reverse) return !this.value;
			else return this.value;
		},
	},
	// beforeMount() {
	// 	//在渲染完成做語言轉換
	// 	this.$slots.default[0].text = this.$ln(this.$slots.default[0].text);
	// },
	// beforeUpdate() {
	// 	//在資料變動的時候slot會變動回原本的資料，所以在做一次多語系轉換
	// 	this.$slots.default[0].text = this.$ln(this.$slots.default[0].text);
	// },
};
</script>
<style lang='scss' scoped>
@import "./src/css/index";
.checkbox-wrapper {
	@extend .flex-item;
	align-items: center;
}
.check-label {
	@extend .flex-item;
	align-items: center;
	position: relative;
}

.checked > i{
	background: rgba(255, 152, 0, 0.932);
	color: black;
	border-radius: 2px;
	border: 2px solid rgba(255, 152, 0, 0.932);
	font-size: 1em;
	margin-right: 4px;
}
.checked > span.dot, .unchecked > span.dot{
	border: 2px solid #aaaaaa;
	border-radius: 50%;
	height: 5vw;
	width: 5vw;
	position: relative;
}
.checked > span.dot::after {
	content: '';
	border-radius: 50%;
	background: rgba(255, 152, 0, 0.932);
	box-sizing: border-box;
	position: absolute;
	margin: auto;
	top:0;
	bottom:0;
	left:0;
	right:0;
	width: 0.8em;
	height: 0.8em;
}
.unchecked > i {
	background-color: black;
	border: 2px solid white;
	border-radius: 2px;
	color: black;
	font-size: 1em;
	margin-right: 4px;
	width: 1em;
	height: 1em;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 1;
  }
  20% {
    transform: scale(1, 1);
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(2, 2);
  }
}
.check-label>i::before{
	content: '';
	border-radius: 50%;
	background-color: rgba(255, 255, 255, 0.1);
	position: absolute;
	box-sizing: border-box;
	top: -6px;
	left: -6px;
	transform: scale(0);
	width: 2em;
	height: 2em;
}
.check-label:active>i::before{
	animation: ripple 300ms ease-out;
}
@media screen and (orientation: landscape) {
	.checked > span.dot::after {
		content: '';
		border-radius: 50%;
		background: rgba(255, 152, 0, 0.932);
		box-sizing: border-box;
		position: absolute;
		margin: auto;
		top:0;
		bottom:0;
		left:0;
		right:0;
		width: 1.5em;
		height: 1.5em;
	}
}
/** 桌機版 */
.desktop .checked > span.dot, .desktop .unchecked > span.dot {
	height: 1em;
	width: 1em;
}
.desktop .checked > span.dot::after {
	height: 0.8em;
	width: 0.8em;
}
.disable-ui{
	pointer-events: none;
	color: gray;
}
.disable-ui .unchecked i{
	border: 2px solid gray;
}
</style>

