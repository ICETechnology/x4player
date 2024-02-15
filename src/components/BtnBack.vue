<template>
    <div>
		<span class="flex-start" @click="onBtnBack">
			<i class="material-icons md-36">keyboard_arrow_left</i>
		</span>
    </div>
</template>

<script>
export default {
	data() {
		return {
        }
	},
	beforeMount() {
	},
    mounted() {
    },
	beforeDestroy() {
	},
	components: {
	},
    methods: {
		onBtnBack() {
			eventBus.$emit("CLOSE-DIALOG");
		},
	},
	watch: {
	},
    computed: {
    }
}
</script>

<style scoped>
</style>