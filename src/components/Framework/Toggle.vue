<template>
	<div class="checkbox-wrapper flex-item posr" :class="toggleStyle">
		<div class="checkbox-ctn flex-item flex-vertical-center FULL font-size-normal" :ref="generateId()" @click="setValue(!value)" >
			<div ref="tCtn" class="toggle-ctn true-ctn flex-row" v-if="value==true">
				<span class="flex-1 flex-vertical-center flex-start label pdl2">{{text}}</span>
			</div>
			<div ref="fCtn" class="toggle-ctn false-ctn flex-row" v-if="value==false">
				<span class="flex-1 flex-vertical-center flex-end label pdr2">{{text}}</span>
			</div>
			<span ref="circleIcon" class="circle-icon" :class="[value==true? 'right': 'left', {'circle-true': mode && value}]"></span>
		</div>
	</div>
</template>
<script>
export default {
	data() {
		return {};
	},
	props: ["value", "text", "mode"],
	watch: {
		value(nv, ov){
			let self = this;
			this.$refs[this.generateId()].classList.add('active');
			setTimeout(() => {
				self.$refs[this.generateId()].classList.remove('active');
			}, 400);
		}
	},
	methods: {
		generateId() {
			return "toggle_" + this._uid;
		},
		setValue(v){
			eventBus.$emit("SWITCHDATA");
			this.$emit('input', v > 0);
		}
	},
	computed: {
		toggleStyle() {
			if(this.isSmall) return 'small h20 size-small';
			else if(this.isMini) return 'mini h10 font-size-mini';
			else return 'normal h40 w50 font-size-normal';
		},
		isSmall() {return this.mode == 'small';},
		isMini() {return this.mode == 'mini';},
	}
};
</script>
<style scoped>
.checkbox-ctn{
	white-space: nowrap;
}
.false-ctn{
	color:gray;
	background-color: white;
	border-radius: 2em;
	width: 100%;
	height: 9vw;
}
.true-ctn{
	color:white;
	background-color: rgb(76, 217, 100);
	border-radius: 2em;
	width: 100%;
	height: 9vw;
}
.circle-icon{
	position: absolute;
	background-color: white;
	width: 8vw;
	height: 8vw;
	border-radius: 50%;
	border: 1px solid gray;
}
.small {
	width: 8vw;
}
.normal {
	width: 15vw;
}
.small .true-ctn{
	background-color: #3A4B8D;
}
.small .circle-true{
	background-color: #5677FC;
}
.small .circle-icon {
	height: 1em;
	width: 1em;
	border: 0;
}
.small .circle-icon.left{
	left: 0;
}
.small .circle-icon.right{
	left: calc(100% - 1em);
}
.small .circle-icon::after{
	width: 1em;
	height: 1em;
}
.small .true-ctn, .small .false-ctn {
	height: 0.6em;
}
.checkbox-wrapper.mini {
	min-width: 2em;
}
.mini .true-ctn{
	background-color: #2AC940;
}
.mini .circle-icon {
	height: 0.6em;
	width: 0.6em;
	border: 0;
	background-color: #111820;
}
.member-login-ctn .mini .circle-icon{
	background-color: white;
}
.member-login-ctn .mini .false-ctn{
	background-color: gray;
}
.mini .circle-icon.left{
	left: 0.1em;
}
.mini .circle-icon.right{
	left: calc(100% - 0.7em);
}
.mini .circle-icon::after{
	width: 0.6em;
	height: 0.6em;
}
.mini .true-ctn, .mini .false-ctn {
	height: 0.8em;
}
.circle-icon.left{
	left: 1px;
	transition: all 0.4s cubic-bezier(0.8, 0.4, 0.3, 1.25), background 0.4s ease;
}
.circle-icon.right{
	left: calc(100% - 9vw);
	transition: all 0.4s cubic-bezier(0.8, 0.4, 0.3, 1.25), background 0.4s ease;
}
.circle-icon::after{
	content: '';
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 1);
    position: fixed;
	box-sizing: border-box;
    transform: scale(0);
	width: 8vw;
	height: 8vw;
}
.checkbox-ctn.active .circle-icon::after{
    animation: ripple 300ms ease-out;
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
@media screen and (orientation: landscape) {
	.false-ctn, .true-ctn{height: 9vh;}
	.circle-icon {width: 8vh; height: 8vh;}
	.small {width: 8vh;}
	.normal {width: 15vh;}
	.circle-icon.right{left: calc(100% - 9vh);}
	.circle-icon::after {width: 8vh; height: 8vh;}
}
/** 桌機版 */
.desktop .normal {
	width: 4.2em;
	height: 3em;
}
.desktop .true-ctn, .desktop .false-ctn{
	height: 2em;
}
.desktop .circle-icon {
	width: 2em;
	height: 2em;
}
.desktop .circle-icon.left {
	left: 0;
}
.desktop .circle-icon.right {
	left: 2.2em;
}
.desktop .circle-icon::after {
	width: 2em;
	height: 2em;
}
.desktop .small {
	width: 2.25em;
}
.desktop .small .circle-icon {
	height: 1em;
	width: 1em;
	border: 0;
}
.desktop .small .circle-icon.right{
	left: calc(100% - 1em);
}
.desktop .small .circle-icon::after{
	width: 1em;
	height: 1em;
}
.desktop .small .true-ctn,.desktop .small .false-ctn {
	height: 0.6em;
}
</style>