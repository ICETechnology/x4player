<template>
	<span class="icon-btn mgl2 flex-center tcef" @click="onLock">
		<i class= "material-icons" :class="{'clr-orange': value}">{{value? 'lock': 'lock_open'}}</i>
	</span>
</template>
<script>
export default {
	data() {
		return {
			
		}
	},
	props:['value'],
	methods: {
		onLock() {this.$emit('input', !this.value);}
	},
}
</script>
<style scoped>
</style>