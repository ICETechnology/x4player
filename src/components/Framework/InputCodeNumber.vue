<template>
    <div class="flex-center flex-row mgtb3 posr font-size-big">
		<div class="input-number" :class="{flicker: onFocus && inputCodeNumber.length===0}">{{code0}}</div>
		<div class="input-number" :class="{flicker: onFocus && inputCodeNumber.length===1}">{{code1}}</div>
		<div class="input-number" :class="{flicker: onFocus && inputCodeNumber.length===2}">{{code2}}</div>
		<div class="input-number" :class="{flicker: onFocus && inputCodeNumber.length===3}">{{code3}}</div>

		<div class="FULL"><input ref="codeInput" class="w100p h100p" type="number" @focus="onFocus=true" @blur="onFocus=false"
			v-model="$store.state.status.inputCodeNumber" inputmode="numeric" pattern="[0-9]*" /></div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			onFocus: false,
		}
	},
	beforeMount() {},
    mounted() {
		// setTimeout((self)=>{
		// 	self.$refs.codeInput.focus();
		// }, 100, this);
	},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
		inputCodeNumber(nv) {
			this.$store.state.status.inputCodeNumber = nv.slice(0,4);
		},
	},
    computed: {
		code0() {return this.inputCodeNumber.substr(0,1);},
		code1() {return this.inputCodeNumber.substr(1,1);},
		code2() {return this.inputCodeNumber.substr(2,1);},
		code3() {return this.inputCodeNumber.substr(3,1);},
		inputCodeNumber() {
			return this.$store.state.status.inputCodeNumber;
		},
	},
}
</script>

<style scoped>
.input-number {
	margin: 2vw;
	padding: 1vw;
	width: 5vw;
	height: 5vw;
	border-bottom: 2px solid white;
}
input {
	opacity: 0;
}
@keyframes flickerAnimation {
  0%   { opacity:1; }
  50%  { opacity:0; }
  100% { opacity:1; }
}
.flicker {
	border-bottom: 2px solid yellow;
    animation: flickerAnimation 1s infinite;
}
</style>