<template>
	<div class="desktop-container-dropper-block" :class="{dragEnter: dragEnter}" 
		@dragenter.prevent="dragEnter = true" @dragleave.prevent="dragEnter = false" @dragover.prevent
		@drop="onDrop" />
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
		onDrop() {
			this.$emit('onDrop');
			this.dragEnter = false;
		}
	},
	watch: {},
    computed: {},
}
</script>

<style scoped>
</style>