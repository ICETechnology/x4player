<template>
    <div class="flex-row mgt1 font-size-little mgtb2">
		<div class=" flex-start flex-1">{{$ln(label)}}</div>
		<Button class="pdlr3 mgr2" @click="playEffect" v-if="param!='mute'">
			<i class="font-size-xl material-icons">play_circle_outline</i>
		</Button>
    </div>
</template>

<script>
export default {
	props: ["param"],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		playEffect(){
			event.stopPropagation();
			eventBus.$emit("DEMOEFFECT", {src: this.optValue});
		},
	},
	watch: {},
    computed: {
		label() {
			let option = this.$store.state.config.soundEffectUri.find(li=>{
				return li.v == this.optValue;
			});
			if(option){
				return option.n;
			}
			else
				return this.optValue;
		},
		optValue() {
			return this.param || "mute";
		},
	},
}
</script>

<style scoped>
.z-btn{
	z-index: 10;
}
</style>